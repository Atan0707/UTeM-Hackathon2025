# UTeM Hackathon 2025 API

This is an Express implementation of the UTeM Hackathon 2025 API, providing the same functionality as the original C++ implementation using Express.js and MySQL.

## Features

- User authentication (register, login)
- Places management (create, list, get details)
- Ratings system (add/update ratings, get statistics)
- Geographic search (find nearby places)

## Prerequisites

- Node.js (v14.x or later)
- MySQL server
- Yarn package manager

## Setup

1. Clone the repository

2. Install dependencies
   ```
   yarn install
   ```

3. Configure MySQL
   Make sure you have MySQL running with user `root` and password `root` (or update the credentials in the code).

4. Start the server
   ```
   yarn dev
   ```

The server will run on port 3000 by default, but you can change this in the .env file.

## API Endpoints

### User Routes

- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login a user
- `GET /api/users/:userId/reviewed-places` - Get places reviewed by a user

### Places Routes

- `GET /api/places` - Get all places
- `GET /api/places/:placeId` - Get details for a single place
- `POST /api/places` - Add a new place
- `GET /api/places/:placeId/ratings` - Get ratings for a place
- `GET /api/places/top-rated/list` - Get top-rated places
- `POST /api/places/nearby` - Find nearby places

### Ratings Routes

- `POST /api/ratings` - Add or update a rating
- `GET /api/ratings/statistics` - Get rating statistics

## Development

To start the development server with automatic reloading:

```
yarn dev
``` 