require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./config/db');

// Import routes
const usersRoutes = require('./routes/users');
const placesRoutes = require('./routes/places');
const ratingsRoutes = require('./routes/ratings');

// Initialize database
initializeDatabase();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Welcome route
app.get('/', (req, res) => {
  res.send('Hello World! Welcome to UTeM Hackathon 2025 API');
});

// Register route handlers
app.use('/api/users', usersRoutes);
app.use('/api/places', placesRoutes);
app.use('/api/ratings', ratingsRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API is available at http://localhost:${PORT}`);
}); 