const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// Add a rating to a place or update existing rating
router.post('/', async (req, res) => {
  try {
    const { user_id, place_id, stars, comment } = req.body;
    
    // Validate required fields
    if (!user_id || !place_id || stars === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Validate stars value
    if (stars < 1 || stars > 5) {
      return res.status(400).json({
        success: false,
        message: 'Stars must be between 1 and 5'
      });
    }
    
    // Check if user already rated this place
    const [existingRatings] = await pool.query(
      'SELECT rating_id FROM ratings WHERE user_id = ? AND place_id = ?',
      [user_id, place_id]
    );
    
    if (existingRatings.length > 0) {
      // Update existing rating
      const ratingId = existingRatings[0].rating_id;
      
      await pool.query(
        'UPDATE ratings SET stars = ?, comment = ? WHERE rating_id = ?',
        [stars, comment || '', ratingId]
      );
      
      res.status(200).json({
        success: true,
        message: 'Rating updated successfully'
      });
    } else {
      // Insert new rating
      const [result] = await pool.query(
        'INSERT INTO ratings (user_id, place_id, stars, comment) VALUES (?, ?, ?, ?)',
        [user_id, place_id, stars, comment || '']
      );
      
      res.status(201).json({
        success: true,
        message: 'Rating added successfully'
      });
    }
  } catch (error) {
    console.error('Error adding/updating rating:', error);
    res.status(500).json({
      success: false,
      message: 'Database error: ' + error.message
    });
  }
});

// Get rating statistics
router.get('/statistics', async (req, res) => {
  try {
    const [stats] = await pool.query(
      `SELECT p.place_id, p.name,
      COUNT(r.rating_id) as total_reviews,
      AVG(r.stars) as average_rating,
      MIN(r.stars) as lowest_rating,
      MAX(r.stars) as highest_rating
      FROM places p
      LEFT JOIN ratings r ON p.place_id = r.place_id
      GROUP BY p.place_id
      ORDER BY average_rating DESC`
    );
    
    // Format the statistics
    const formattedStats = stats.map(stat => ({
      place_id: stat.place_id,
      name: stat.name,
      total_reviews: stat.total_reviews,
      average_rating: stat.average_rating ? parseFloat(stat.average_rating) : 0,
      lowest_rating: stat.lowest_rating || 0,
      highest_rating: stat.highest_rating || 0
    }));
    
    res.status(200).json({
      rating_statistics: formattedStats
    });
  } catch (error) {
    console.error('Error getting rating statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Database error: ' + error.message
    });
  }
});

module.exports = router; 