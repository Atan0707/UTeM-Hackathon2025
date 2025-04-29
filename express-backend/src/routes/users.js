const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }
    
    // Insert the new user
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, password]
    );
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle duplicate email error
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Database error: ' + error.message
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing email or password' 
      });
    }
    
    // Find user by email and password
    const [users] = await pool.query(
      'SELECT user_id, username FROM users WHERE email = ? AND password = ?',
      [email, password]
    );
    
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    const user = users[0];
    
    res.status(200).json({
      success: true,
      user_id: user.user_id,
      username: user.username,
      email
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Database error: ' + error.message
    });
  }
});

// Get user's reviewed places
router.get('/:userId/reviewed-places', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const [places] = await pool.query(
      `SELECT p.place_id, p.name, p.description, p.image_url, p.category, 
      p.latitude, p.longitude, ur.stars as user_rating, ur.comment as user_comment 
      FROM places p 
      JOIN ratings ur ON p.place_id = ur.place_id AND ur.user_id = ? 
      ORDER BY ur.created_at DESC`,
      [userId]
    );
    
    res.status(200).json({
      reviewed_places: places
    });
  } catch (error) {
    console.error('Error getting reviewed places:', error);
    res.status(500).json({
      success: false,
      message: 'Database error: ' + error.message
    });
  }
});

module.exports = router; 