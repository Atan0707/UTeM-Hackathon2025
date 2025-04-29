import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// User related API calls
export const userApi = {
  register: async (userData: { username: string; email: string; password: string }) => {
    const response = await api.post('/users/register', userData);
    return response.data;
  },
  
  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/users/login', credentials);
    return response.data;
  },
  
  getUserReviews: async (userId: number) => {
    const response = await api.get(`/users/${userId}/reviewed-places`);
    return response.data;
  }
};

// Places related API calls
export const placesApi = {
  getAllPlaces: async () => {
    const response = await api.get('/places');
    return response.data;
  },
  
  getPlaceById: async (placeId: number) => {
    const response = await api.get(`/places/${placeId}`);
    return response.data;
  },
  
  addPlace: async (placeData: {
    name: string;
    description?: string;
    image_url?: string;
    category?: string;
    latitude: number;
    longitude: number;
  }) => {
    const response = await api.post('/places', placeData);
    return response.data;
  },
  
  getPlaceRatings: async (placeId: number) => {
    const response = await api.get(`/places/${placeId}/ratings`);
    return response.data;
  },
  
  getTopRatedPlaces: async () => {
    const response = await api.get('/places/top-rated/list');
    return response.data;
  },
  
  getNearbyPlaces: async (coords: { latitude: number; longitude: number; radius: number }) => {
    const response = await api.post('/places/nearby', coords);
    return response.data;
  }
};

// Ratings related API calls
export const ratingsApi = {
  addOrUpdateRating: async (ratingData: {
    user_id: number;
    place_id: number;
    stars: number;
    comment?: string;
  }) => {
    const response = await api.post('/ratings', ratingData);
    return response.data;
  },
  
  getRatingStatistics: async () => {
    const response = await api.get('/ratings/statistics');
    return response.data;
  }
}; 