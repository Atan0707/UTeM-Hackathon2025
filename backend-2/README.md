# Travel Recommendation System Backend

A C++ backend service for a travel recommendation system with MySQL database and RESTful API endpoints using Crow framework.

## Tech Stack

- **C++** - Core programming language
- **Crow** - C++ microframework for web server
- **MySQL** - Database management system
- **MySQL Connector/C++** - Official MySQL client library for C++

## Features

### Core Functionality
- User authentication system (register, login)
- Travel place management (add, view, search)
- Rating and review system for places (1-5 stars with optional comments)
- Location-based search using coordinates

### Advanced SQL Operations
- Aggregation functions (COUNT, SUM, AVG, MIN, MAX)
- Complex JOIN operations
- Nested subqueries
- Conditional grouping and filtering
- Distance calculations using Haversine formula

## API Endpoints

### User Management
- `POST /api/register` - Register a new user
- `POST /api/login` - User login

### Places Management
- `GET /api/places` - Get all places with average ratings
- `GET /api/places/<id>` - Get details for a specific place
- `POST /api/places` - Add a new place

### Ratings
- `POST /api/ratings` - Add or update a rating for a place
- `GET /api/places/<id>/ratings` - Get all ratings for a place

### Advanced Queries
- `GET /api/places/top-rated` - Get top-rated places (using AVG aggregation and GROUP BY)
- `GET /api/statistics/ratings` - Get rating statistics by place (multiple aggregation functions)
- `GET /api/users/<id>/reviewed-places` - Get places reviewed by a specific user (JOINs and subqueries)
- `POST /api/places/nearby` - Find places near specified coordinates (distance calculation)
- `GET /api/statistics/users` - Get user activity statistics (complex nested queries)

## Database Schema

The system uses three primary tables:

1. **users** - Stores user information for authentication
   - user_id, username, email, password, created_at

2. **places** - Stores travel destinations information
   - place_id, name, description, latitude, longitude, created_at

3. **ratings** - Stores place ratings and reviews
   - rating_id, user_id, place_id, stars, comment, created_at

## Setup Instructions

### Prerequisites
- C++ compiler with C++11 support or higher
- MySQL server (5.7+ recommended)
- MySQL Connector/C++ library
- Crow framework

### Database Setup
1. Install MySQL server
2. Run the SQL script to create the database and tables:
   ```
   mysql -u root -p < schema.sql
   ```

### Compile and Run
1. Ensure MySQL Connector/C++ is installed
2. Compile the application:
   ```
   g++ -o travel_app main.cpp -lmysqlcppconn -lpthread
   ```
3. Run the server:
   ```
   ./travel_app
   ```
4. The server will start on port 8080

## API Usage Examples

### Register a user
```
POST /api/register
{
  "username": "traveler123",
  "email": "traveler@example.com",
  "password": "securepassword"
}
```

### Add a new place
```
POST /api/places
{
  "name": "Eiffel Tower",
  "description": "Famous landmark in Paris",
  "latitude": 48.8584,
  "longitude": 2.2945
}
```

### Rate a place
```
POST /api/ratings
{
  "user_id": 1,
  "place_id": 1,
  "stars": 5,
  "comment": "Beautiful place, highly recommended!"
}
```

### Find nearby places
```
POST /api/places/nearby
{
  "latitude": 48.8584,
  "longitude": 2.2945,
  "radius": 5
}
```

## Error Handling

The API returns appropriate HTTP status codes:
- 200/201 - Success
- 400 - Bad request (missing parameters, invalid input)
- 401 - Unauthorized (invalid credentials)
- 404 - Resource not found
- 500 - Server error

## Security Considerations

- Implemented prepared statements to prevent SQL injection
- Input validation for all API endpoints
- Error handling to prevent information leakage
