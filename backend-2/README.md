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
4. The server will start on port 18080

## API Usage Guide

The backend API runs on port 18080 and can be accessed at `http://localhost:18080`. All API endpoints accept and return JSON data.

### Common Headers

For all API requests:
```
Content-Type: application/json
```

### Authentication Flow

1. Register a new user:
```javascript
// Frontend code (React/Vue/vanilla JS)
async function registerUser(userData) {
  try {
    const response = await fetch('http://localhost:18080/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: userData.username,
        email: userData.email,
        password: userData.password
      })
    });
    
    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    } else {
      return { success: false, error: data.message || 'Registration failed' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

2. Login and get user info:
```javascript
async function loginUser(credentials) {
  try {
    const response = await fetch('http://localhost:18080/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password
      })
    });
    
    const data = await response.json();
    if (response.ok) {
      // Store user data in localStorage or state management
      localStorage.setItem('user', JSON.stringify(data));
      return { success: true, user: data };
    } else {
      return { success: false, error: data.message || 'Login failed' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### Working with Places

1. Fetch all places:
```javascript
async function getAllPlaces() {
  try {
    const response = await fetch('http://localhost:18080/api/places');
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, places: data.places };
    } else {
      return { success: false, error: data.message || 'Failed to fetch places' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

2. Get a specific place with reviews:
```javascript
async function getPlaceDetails(placeId) {
  try {
    const response = await fetch(`http://localhost:18080/api/places/${placeId}`);
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, place: data };
    } else {
      return { success: false, error: data.message || 'Failed to fetch place details' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

3. Add a new place:
```javascript
async function addNewPlace(placeData) {
  try {
    const response = await fetch('http://localhost:18080/api/places', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: placeData.name,
        description: placeData.description,
        latitude: placeData.latitude,
        longitude: placeData.longitude
      })
    });
    
    const data = await response.json();
    if (response.ok) {
      return { success: true, placeId: data.place_id };
    } else {
      return { success: false, error: data.message || 'Failed to add place' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### Rating and Reviews

1. Add or update a rating:
```javascript
async function ratePlace(ratingData) {
  try {
    const response = await fetch('http://localhost:18080/api/ratings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: ratingData.userId,
        place_id: ratingData.placeId,
        stars: ratingData.stars,
        comment: ratingData.comment || ''
      })
    });
    
    const data = await response.json();
    if (response.ok) {
      return { success: true, message: data.message };
    } else {
      return { success: false, error: data.message || 'Failed to submit rating' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

2. Get all ratings for a place:
```javascript
async function getPlaceRatings(placeId) {
  try {
    const response = await fetch(`http://localhost:18080/api/places/${placeId}/ratings`);
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, ratings: data.ratings };
    } else {
      return { success: false, error: data.message || 'Failed to fetch ratings' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### Advanced Features

1. Find places near user location:
```javascript
async function findNearbyPlaces(position, radiusKm) {
  try {
    const response = await fetch('http://localhost:18080/api/places/nearby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        latitude: position.latitude,
        longitude: position.longitude,
        radius: radiusKm
      })
    });
    
    const data = await response.json();
    if (response.ok) {
      return { success: true, places: data.nearby_places };
    } else {
      return { success: false, error: data.message || 'Failed to find nearby places' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

2. Get top-rated places:
```javascript
async function getTopRatedPlaces() {
  try {
    const response = await fetch('http://localhost:18080/api/places/top-rated');
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, places: data.top_rated_places };
    } else {
      return { success: false, error: data.message || 'Failed to fetch top places' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

3. Get places reviewed by a specific user:
```javascript
async function getUserReviewedPlaces(userId) {
  try {
    const response = await fetch(`http://localhost:18080/api/users/${userId}/reviewed-places`);
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, places: data.reviewed_places };
    } else {
      return { success: false, error: data.message || 'Failed to fetch user reviewed places' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### Integrating with Frontend Frameworks

#### React Example

```jsx
import { useState, useEffect } from 'react';

function PlacesList() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPlaces() {
      try {
        const response = await fetch('http://localhost:18080/api/places');
        const data = await response.json();
        
        if (response.ok) {
          setPlaces(data.places);
        } else {
          setError(data.message || 'Failed to fetch places');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPlaces();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="places-list">
      <h2>Discover Amazing Places</h2>
      <div className="places-grid">
        {places.map(place => (
          <div key={place.place_id} className="place-card">
            <h3>{place.name}</h3>
            <p>{place.description}</p>
            <div className="rating">
              <span>★ {place.avg_rating.toFixed(1)}</span>
              <span>({place.review_count} reviews)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Error Handling

The API returns appropriate HTTP status codes:
- 200/201 - Success
- 400 - Bad request (missing parameters, invalid input)
- 401 - Unauthorized (invalid credentials)
- 404 - Resource not found
- 500 - Server error

Each error response includes a JSON object with:
```json
{
  "success": false,
  "message": "Description of the error"
}
```

## Security Considerations

- Implemented prepared statements to prevent SQL injection
- Input validation for all API endpoints
- Error handling to prevent information leakage

## CORS Support

The API has built-in CORS support and allows requests from any origin with the following headers:
- Content-Type
- Authorization

And the following methods:
- GET
- POST
- PUT
- DELETE
