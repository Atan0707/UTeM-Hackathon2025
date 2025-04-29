const mysql = require('mysql2/promise');

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root', 
  database: process.env.DB_NAME || 'utem_hackathon',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Function to initialize the database
async function initializeDatabase() {
  try {
    // Get a connection from the pool
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root'
    });

    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'utem_hackathon'}`);
    
    // Use the database
    await connection.query(`USE ${process.env.DB_NAME || 'utem_hackathon'}`);
    
    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create places table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS places (
        place_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        image_url VARCHAR(255),
        category VARCHAR(50),
        latitude DOUBLE NOT NULL,
        longitude DOUBLE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create ratings table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ratings (
        rating_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        place_id INT NOT NULL,
        stars INT NOT NULL CHECK (stars BETWEEN 1 AND 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id),
        FOREIGN KEY (place_id) REFERENCES places(place_id)
      )
    `);
    
    console.log('Database initialized successfully');
    await connection.end();
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

module.exports = {
  pool,
  initializeDatabase
}; 