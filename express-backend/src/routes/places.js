const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// Get all places
router.get('/', async (req, res) => {
  try {
    const [places] = await pool.query(
      `SELECT p.*, 
      (SELECT AVG(stars) FROM ratings r WHERE r.place_id = p.place_id) as avg_rating,
      (SELECT COUNT(*) FROM ratings r WHERE r.place_id = p.place_id) as review_count
      FROM places p`
    );
    
    // Format the response
    const formattedPlaces = places.map(place => ({
      ...place,
      avg_rating: place.avg_rating ? parseFloat(place.avg_rating) : 0,
      image_url: place.image_url || '',
      category: place.category || ''
    }));
    
    res.status(200).json({
      places: formattedPlaces
    });
  } catch (error) {
    console.error('Error getting places:', error);
    res.status(500).json({
      success: false,
      message: 'Database error: ' + error.message
    });
  }
});

// Get a single place by ID
router.get('/:placeId', async (req, res) => {
  try {
    const placeId = req.params.placeId;
    
    // Get place details with average rating
    const [places] = await pool.query(
      `SELECT p.*, 
      (SELECT AVG(stars) FROM ratings r WHERE r.place_id = p.place_id) as avg_rating,
      (SELECT COUNT(*) FROM ratings r WHERE r.place_id = p.place_id) as review_count
      FROM places p 
      WHERE p.place_id = ?`,
      [placeId]
    );
    
    if (places.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Place not found'
      });
    }
    
    const place = places[0];
    
    // Format place data
    const formattedPlace = {
      ...place,
      avg_rating: place.avg_rating ? parseFloat(place.avg_rating) : 0,
      image_url: place.image_url || '',
      category: place.category || '',
    };
    
    // Get reviews for this place
    const [reviews] = await pool.query(
      `SELECT r.*, u.username
      FROM ratings r
      JOIN users u ON r.user_id = u.user_id
      WHERE r.place_id = ?
      ORDER BY r.created_at DESC`,
      [placeId]
    );
    
    // Add reviews to the response
    formattedPlace.reviews = reviews;
    
    res.status(200).json(formattedPlace);
  } catch (error) {
    console.error('Error getting place details:', error);
    res.status(500).json({
      success: false,
      message: 'Database error: ' + error.message
    });
  }
});

// Add a new place
router.post('/', async (req, res) => {
  try {
    const { name, description, image_url, category, latitude, longitude } = req.body;
    
    // Validate required fields
    if (!name || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Insert the new place
    const [result] = await pool.query(
      'INSERT INTO places (name, description, image_url, category, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description || '', image_url || '', category || '', latitude, longitude]
    );
    
    res.status(201).json({
      success: true,
      place_id: result.insertId,
      message: 'Place added successfully'
    });
  } catch (error) {
    console.error('Error adding place:', error);
    res.status(500).json({
      success: false,
      message: 'Database error: ' + error.message
    });
  }
});

// Update a place
router.put('/:placeId', async (req, res) => {
  try {
    const placeId = req.params.placeId;
    const { name, description, image_url, category, latitude, longitude } = req.body;
    
    // Validate required fields
    if (!name || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Check if place exists
    const [existingPlace] = await pool.query(
      'SELECT * FROM places WHERE place_id = ?',
      [placeId]
    );
    
    if (existingPlace.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Place not found'
      });
    }
    
    // Update the place
    await pool.query(
      'UPDATE places SET name = ?, description = ?, image_url = ?, category = ?, latitude = ?, longitude = ? WHERE place_id = ?',
      [name, description || '', image_url || '', category || '', latitude, longitude, placeId]
    );
    
    res.status(200).json({
      success: true,
      message: 'Place updated successfully'
    });
  } catch (error) {
    console.error('Error updating place:', error);
    res.status(500).json({
      success: false,
      message: 'Database error: ' + error.message
    });
  }
});

// Delete a place
router.delete('/:placeId', async (req, res) => {
  try {
    const placeId = req.params.placeId;
    
    // Check if place exists
    const [existingPlace] = await pool.query(
      'SELECT * FROM places WHERE place_id = ?',
      [placeId]
    );
    
    if (existingPlace.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Place not found'
      });
    }
    
    // Delete any associated ratings first (to maintain foreign key constraints)
    await pool.query(
      'DELETE FROM ratings WHERE place_id = ?',
      [placeId]
    );
    
    // Delete the place
    await pool.query(
      'DELETE FROM places WHERE place_id = ?',
      [placeId]
    );
    
    res.status(200).json({
      success: true,
      message: 'Place deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting place:', error);
    res.status(500).json({
      success: false,
      message: 'Database error: ' + error.message
    });
  }
});

// Get ratings for a place
router.get('/:placeId/ratings', async (req, res) => {
  try {
    const placeId = req.params.placeId;
    
    const [ratings] = await pool.query(
      `SELECT r.*, u.username
      FROM ratings r
      JOIN users u ON r.user_id = u.user_id
      WHERE r.place_id = ?
      ORDER BY r.created_at DESC`,
      [placeId]
    );
    
    res.status(200).json({
      ratings
    });
  } catch (error) {
    console.error('Error getting ratings:', error);
    res.status(500).json({
      success: false,
      message: 'Database error: ' + error.message
    });
  }
});

// Get top-rated places
router.get('/top-rated/list', async (req, res) => {
  try {
    const [places] = await pool.query(
      `SELECT p.place_id, p.name, p.description, p.image_url, p.category, p.latitude, p.longitude,
      AVG(r.stars) as average_rating, COUNT(r.rating_id) as review_count
      FROM places p
      LEFT JOIN ratings r ON p.place_id = r.place_id
      GROUP BY p.place_id
      HAVING COUNT(r.rating_id) > 0
      ORDER BY average_rating DESC, review_count DESC
      LIMIT 10`
    );
    
    // Format the places
    const formattedPlaces = places.map(place => ({
      ...place,
      average_rating: parseFloat(place.average_rating),
      image_url: place.image_url || '',
      category: place.category || ''
    }));
    
    res.status(200).json({
      top_rated_places: formattedPlaces
    });
  } catch (error) {
    console.error('Error getting top-rated places:', error);
    res.status(500).json({
      success: false,
      message: 'Database error: ' + error.message
    });
  }
});

// Find nearby places
router.post('/nearby', async (req, res) => {
  try {
    const { latitude, longitude, radius } = req.body;
    
    if (latitude === undefined || longitude === undefined || radius === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing coordinates or radius'
      });
    }
    
    // Calculate distance using Haversine formula in MySQL
    const [places] = await pool.query(
      `SELECT *, 
      (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance 
      FROM places 
      HAVING distance < ? 
      ORDER BY distance`,
      [latitude, longitude, latitude, radius]
    );
    
    // Format the places
    const formattedPlaces = places.map(place => ({
      ...place,
      distance: parseFloat(place.distance),
      image_url: place.image_url || '',
      category: place.category || ''
    }));
    
    res.status(200).json({
      nearby_places: formattedPlaces
    });
  } catch (error) {
    console.error('Error finding nearby places:', error);
    res.status(500).json({
      success: false,
      message: 'Database error: ' + error.message
    });
  }
});

module.exports = router; 