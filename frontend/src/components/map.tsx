'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getCategoryEmoji } from '../data';
import { createPortal } from 'react-dom';
import axios from 'axios';

// API base URL
const API_BASE_URL = 'http://localhost:3001/api';

interface MapProps {
  style?: string;
  center?: [number, number];
  zoom?: number;
  pitch?: number;
  bearing?: number;
  enable3DBuildings?: boolean;
}

// Backend data types
interface Place {
  place_id: number;
  name: string;
  description: string;
  image_url: string;
  category: string;
  latitude: number;
  longitude: number;
  avg_rating: number;
  review_count: number;
  reviews?: Review[];
}

interface Review {
  rating_id?: number;
  user_id: number;
  place_id: number;
  stars: number;
  comment: string;
  username?: string;
  created_at?: string;
}

interface User {
  user_id: number;
  username: string;
  email: string;
}

// Move outside component to prevent re-creation on each render
const getMapStyle = () => {
  try {
    if (process.env.NEXT_PUBLIC_MAPTILER_API_KEY) {
      return `https://api.maptiler.com/maps/streets/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_API_KEY}`;
    }
  } catch (error) {
    console.error('Error getting MapTiler style:', error);
  }
  // Fallback to MapLibre demo tiles
  return 'https://demotiles.maplibre.org/style.json';
};

export default function Map({
  style = getMapStyle(),
  center = [102.3217, 2.3153],
  zoom = 12,
  pitch = 45,
  bearing = -17.6,
  enable3DBuildings = false
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const userMarker = useRef<maplibregl.Marker | null>(null);
  const locationMarkers = useRef<{ [key: string]: maplibregl.Marker }>({});
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [dialogLocation, setDialogLocation] = useState<Place | null>(null);
  const locationRequestedRef = useRef(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const isNavigatingRef = useRef(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [review, setReview] = useState<Review>({ stars: 0, comment: '', user_id: 1, place_id: 0 });
  const [hoveredRating, setHoveredRating] = useState(0);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState<string | null>(null);
  
  // Load places from API
  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/places`);
        // Convert string lat/lng to numbers
        const formattedPlaces = response.data.places.map((place: Place) => ({
          ...place,
          latitude: parseFloat(place.latitude.toString()),
          longitude: parseFloat(place.longitude.toString()),
          avg_rating: parseFloat(place.avg_rating?.toString() || '0'),
          review_count: parseInt(place.review_count?.toString() || '0')
        }));
        setPlaces(formattedPlaces);
        setError(null);
      } catch (err) {
        console.error('Error fetching places:', err);
        setError('Failed to load places data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlaces();
  }, []);

  // Get unique categories for filter
  const categories = useMemo(() => {
    const allCategories = places.map(p => p.category || 'Other');
    return ['All', ...Array.from(new Set(allCategories))].filter(Boolean);
  }, [places]);

  // Filtered locations
  const filteredPlaces = useMemo(() => {
    if (selectedCategory === 'All') return places;
    return places.filter(p => p.category === selectedCategory);
  }, [places, selectedCategory]);

  // Load place details when a place is selected
  useEffect(() => {
    if (selectedLocation) {
      const fetchPlaceDetails = async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/places/${selectedLocation}`);
          // Convert string lat/lng to numbers
          const placeData = {
            ...response.data,
            latitude: parseFloat(response.data.latitude),
            longitude: parseFloat(response.data.longitude),
            avg_rating: parseFloat(response.data.avg_rating) || 0,
            review_count: parseInt(response.data.review_count) || 0
          };
          setDialogLocation(placeData);
        } catch (err) {
          console.error('Error fetching place details:', err);
        }
      };
      
      fetchPlaceDetails();
    }
  }, [selectedLocation]);

  const navigateToLocation = useCallback((location: Place) => {
    if (!map.current || !isMapInitialized) return;
    
    // If already navigating, prevent multiple animations
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    
    // Set both states immediately
    setSelectedLocation(location.place_id);
    setDialogLocation(location);

    // Helper function to create or update marker
    const getOrCreateMarker = (placeId: number, loc: Place) => {
      const markerKey = `place-${placeId}`;
      if (!locationMarkers.current[markerKey] && map.current) {
        // Create a new marker with category emoji
        const markerElement = document.createElement('div');
        markerElement.className = 'marker';
        markerElement.style.width = '40px';
        markerElement.style.height = '40px';
        markerElement.style.backgroundColor = 'white';
        markerElement.style.borderRadius = '50%';
        markerElement.style.display = 'flex';
        markerElement.style.alignItems = 'center';
        markerElement.style.justifyContent = 'center';
        markerElement.style.fontSize = '20px';
        markerElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        markerElement.style.border = '2px solid #4a90e2';
        markerElement.style.cursor = 'pointer';
        markerElement.innerHTML = getCategoryEmoji(loc.category);

        // Create popup content
        const popupContent = document.createElement('div');
        popupContent.className = 'popup-content';
        popupContent.innerHTML = `
          <div class="p-2">
            <h3 class="font-bold text-sm">${loc.name}</h3>
            <p class="text-xs text-gray-600">${loc.description}</p>
          </div>
        `;

        // Create and add marker
        const marker = new maplibregl.Marker({
          element: markerElement,
          anchor: 'bottom'
        })
          .setLngLat([loc.longitude, loc.latitude])
          .setPopup(new maplibregl.Popup({ 
            offset: 25,
            closeButton: false,
            closeOnClick: false
          })
            .setDOMContent(popupContent))
          .addTo(map.current);

        locationMarkers.current[markerKey] = marker;
        return marker;
      } 
      
      return locationMarkers.current[markerKey];
    };

    // Close any open popups first to avoid visual glitches
    Object.values(locationMarkers.current).forEach(marker => {
      const popup = marker.getPopup();
      if (popup && popup.isOpen()) {
        popup.remove();
      }
    });

    // Get or create marker for selected location
    const marker = getOrCreateMarker(location.place_id, location);
    
    // Simplified two-step animation approach
    if (map.current) {
      // Always zoom out slightly first
      const originalZoom = map.current.getZoom();
      const targetZoom = Math.max(originalZoom - 2, 10);
      
      // First step: zoom out to provide context
      map.current.easeTo({
        zoom: targetZoom,
        pitch: 50, // Tilt for visual interest
        duration: 700,
        essential: true
      });
      
      // Second step: fly to new location
      setTimeout(() => {
        if (map.current) {
          map.current.flyTo({
            center: [location.longitude, location.latitude],
            zoom: 16,
            pitch: 45,
            speed: 0.7, // Slower for smoother effect
            curve: 1.2, // Gentler curve
            essential: true,
            duration: 1800,
            padding: { top: 50, bottom: 150, left: 50, right: 50 },
          });
          
          // Show popup after animation completes
          setTimeout(() => {
            marker.togglePopup();
            isNavigatingRef.current = false;
          }, 1900);
        }
      }, 750);
    }
  }, [isMapInitialized]);
  
  // Helper function to calculate bearing between two points (direction)
  const getBearing = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const toRadians = (degrees: number) => degrees * Math.PI / 180;
    const toDegrees = (radians: number) => radians * 180 / Math.PI;
    
    const startLat = toRadians(lat1);
    const startLng = toRadians(lng1);
    const destLat = toRadians(lat2);
    const destLng = toRadians(lng2);
    
    const y = Math.sin(destLng - startLng) * Math.cos(destLat);
    const x = Math.cos(startLat) * Math.sin(destLat) -
              Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);
    let bearing = toDegrees(Math.atan2(y, x));
    bearing = (bearing + 360) % 360; // Normalize to 0-360
    
    return bearing;
  };
  
  // Helper function to calculate distance between two coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in km
    return d;
  };
  
  const deg2rad = (deg: number): number => {
    return deg * (Math.PI/180);
  };

  // Memoize getUserLocation function to prevent recreation on every render
  const getUserLocation = useCallback(() => {
    if (locationRequestedRef.current || !navigator.geolocation || !map.current || !isMapInitialized) return;

    console.log("Getting user location...");
    locationRequestedRef.current = true;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("Location received:", position.coords.latitude, position.coords.longitude);
        const lng = position.coords.longitude;
        const lat = position.coords.latitude;

        // Store user location for the button
        setUserLocation([lng, lat]);

        // Create user marker if it doesn't exist
        if (!userMarker.current && map.current) {
          const el = document.createElement('div');
          el.className = 'user-marker';
          el.style.width = '20px';
          el.style.height = '20px';
          el.style.borderRadius = '50%';
          el.style.backgroundColor = '#4285F4';
          el.style.border = '2px solid white';
          el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

          const pulse = document.createElement('div');
          pulse.className = 'pulse';
          pulse.style.position = 'absolute';
          pulse.style.width = '30px';
          pulse.style.height = '30px';
          pulse.style.borderRadius = '50%';
          pulse.style.backgroundColor = 'rgba(66, 133, 244, 0.4)';
          pulse.style.border = '2px solid rgba(66, 133, 244, 0.4)';
          pulse.style.top = '-7px';
          pulse.style.left = '-7px';
          pulse.style.animation = 'pulse 2s infinite';
          el.appendChild(pulse);

          // Add keyframes for pulse animation to document
          if (!document.getElementById('pulse-animation')) {
            const style = document.createElement('style');
            style.id = 'pulse-animation';
            style.innerHTML = `
              @keyframes pulse {
                0% { transform: scale(1); opacity: 1; }
                100% { transform: scale(2); opacity: 0; }
              }
            `;
            document.head.appendChild(style);
          }

          userMarker.current = new maplibregl.Marker({
            element: el,
            anchor: 'center'
          })
            .setLngLat([lng, lat])
            .addTo(map.current);
        } else if (userMarker.current) {
          userMarker.current.setLngLat([lng, lat]);
        }

        // Center map on user's location
        if (map.current) {
          map.current.flyTo({
            center: [lng, lat],
            zoom: 15,
            essential: true
          });
        }
      },
      (error) => {
        console.error('Error getting user location:', error);
        setLocationError(`Couldn't get your location: ${error.message}`);
        locationRequestedRef.current = false; // Allow retrying
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, // Longer timeout
        maximumAge: 0
      }
    );
  }, [isMapInitialized]);

  // Function to center map on user location
  const showUserLocation = useCallback(() => {
    console.log('showUserLocation called', { userLocation, isMapInitialized });

    if (userLocation && map.current && isMapInitialized) {
      console.log('Creating/updating user marker at:', userLocation);

      map.current.flyTo({
        center: userLocation,
        zoom: 15,
        essential: true
      });

      // Show the popup when centering
      if (userMarker.current) {
        const popup = userMarker.current.getPopup();
        if (popup) {
          popup.remove(); // First remove it if it exists
          popup.addTo(map.current); // Then add it back
        }
      }
    } else if (!userLocation) {
      console.log('No user location available, requesting location');
      getUserLocation();
    }
  }, [userLocation, isMapInitialized, getUserLocation]);

  // Get user location after map is initialized
  useEffect(() => {
    if (isMapInitialized) {
      console.log('Map initialized, requesting user location');
      // Add delay to ensure map is ready
      const timer = setTimeout(() => {
        getUserLocation();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isMapInitialized, getUserLocation]);

  // Update user marker when location changes
  useEffect(() => {
    if (userLocation && map.current && isMapInitialized && userMarker.current) {
      console.log('Updating user marker position due to location change:', userLocation);
      userMarker.current.setLngLat(userLocation);
    }
  }, [userLocation, isMapInitialized]);

  // Update: Only show markers for filtered locations
  useEffect(() => {
    if (!map.current || !isMapInitialized) return;
    
    // Remove all current markers
    Object.keys(locationMarkers.current).forEach(id => {
      locationMarkers.current[id]?.remove();
      delete locationMarkers.current[id];
    });
    
    // Add markers for filtered places
    filteredPlaces.forEach(place => {
      const markerKey = `place-${place.place_id}`;
      
      // Create marker element
      const el = document.createElement('div');
      el.className = 'location-marker';
      el.style.width = '30px';
      el.style.height = '30px';
      el.style.backgroundColor = 'white';
      el.style.borderRadius = '50%';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.fontSize = '16px';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
      el.style.cursor = 'pointer';
      el.innerHTML = getCategoryEmoji(place.category);
      
      // Create popup content
      const popupContent = document.createElement('div');
      popupContent.className = 'popup-content';
      popupContent.innerHTML = `
        <div class="p-2">
          <h3 class="font-bold text-sm">${place.name}</h3>
          <p class="text-xs text-gray-600">${place.description}</p>
        </div>
      `;
      
      // Create and add marker
      if (map.current) { // Add null check
        const marker = new maplibregl.Marker({
          element: el,
          anchor: 'bottom'
        })
          .setLngLat([place.longitude, place.latitude])
          .setPopup(new maplibregl.Popup({ 
            offset: 25,
            closeButton: false,
            closeOnClick: false
          })
            .setDOMContent(popupContent))
          .addTo(map.current);
        
        // Add click event
        el.addEventListener('click', () => {
          navigateToLocation(place);
        });
        
        locationMarkers.current[markerKey] = marker;
      }
    });
  }, [filteredPlaces, isMapInitialized, navigateToLocation]);

  // Map initialization
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    try {
      const mapStyle = style;
      console.log("Using map style:", mapStyle); // For debugging

      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center,
        zoom,
        pitch, // Using pitch parameter now
        bearing, // Using bearing parameter now
        attributionControl: false // Reduce network requests for attribution tiles
      });

      // Add error handling for map load
      map.current.on('error', (e) => {
        console.error('Map error:', e);
        // If there's an error, try to reload with fallback style
        if (map.current && e.error && e.error.message.includes('aborted')) {
          console.log('Attempting to reload with fallback style...');
          map.current.setStyle('https://demotiles.maplibre.org/style.json');
        }
      });

      // Wait for the map to load before adding controls or markers
      map.current.on('load', () => {
        console.log("Map loaded successfully");
        if (map.current) { // Add null check here
          map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
          setIsMapInitialized(true);

          // --- 3D Buildings Layer Logic ---
          if (enable3DBuildings && process.env.NEXT_PUBLIC_MAPTILER_API_KEY) {
            const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
            const mapInstance = map.current;
            // Find the first symbol layer with a text-field to insert below
            const layers = mapInstance.getStyle().layers;
            let labelLayerId = undefined;
            for (let i = 0; i < layers.length; i++) {
              if (layers[i].type === 'symbol' && 
                  layers[i].layout && 
                  'text-field' in (layers[i].layout || {})) {
                labelLayerId = layers[i].id;
                break;
              }
            }
            // Add the OpenMapTiles vector source for buildings
            if (!mapInstance.getSource('openmaptiles')) {
              mapInstance.addSource('openmaptiles', {
                url: `https://api.maptiler.com/tiles/v3/tiles.json?key=${MAPTILER_KEY}`,
                type: 'vector',
              });
            }
            // Add the 3D buildings layer with enhanced visibility
            if (!mapInstance.getLayer('3d-buildings')) {
              mapInstance.addLayer(
                {
                  'id': '3d-buildings',
                  'source': 'openmaptiles',
                  'source-layer': 'building',
                  'type': 'fill-extrusion',
                  'minzoom': 14, // Show buildings at lower zoom level
                  'filter': ['!=', ['get', 'hide_3d'], true],
                  'paint': {
                    'fill-extrusion-color': [
                      'interpolate',
                      ['linear'],
                      ['get', 'render_height'],
                      0, '#e0e0e0', // Light gray for low buildings
                      50, '#a8c7ff', // Light blue for medium buildings
                      100, '#4d8eff', // Blue for tall buildings
                      200, '#1a4dff', // Dark blue for very tall buildings
                      400, '#001a66'  // Very dark blue for skyscrapers
                    ],
                    'fill-extrusion-height': [
                      'interpolate',
                      ['linear'],
                      ['zoom'],
                      14, 0,
                      15, ['*', ['get', 'render_height'], 1.2], // Increase height by 20%
                      16, ['*', ['get', 'render_height'], 1.2]
                    ],
                    'fill-extrusion-base': ['case',
                      ['>=', ['get', 'zoom'], 15],
                      ['get', 'render_min_height'], 0
                    ],
                    'fill-extrusion-opacity': 0.9, // More opaque
                  }
                },
                labelLayerId
              );
            }
          }
        }
      });

    } catch (err) {
      console.error('Error initializing map:', err);
      // If initialization fails, try to create map with fallback style
      if (mapContainer.current && !map.current) {
        try {
          map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: 'https://demotiles.maplibre.org/style.json',
            center,
            zoom,
            attributionControl: false
          });
          map.current.on('load', () => {
            if (map.current) {
              map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
              setIsMapInitialized(true);
            }
          });
        } catch (fallbackErr) {
          console.error('Error initializing map with fallback style:', fallbackErr);
        }
      }
    }

    return () => {
      locationRequestedRef.current = false;
      if (map.current) {
        try {
          map.current.remove();
        } catch (err) {
          console.error('Error cleaning up map:', err);
        }
        map.current = null;
      }
    };
  }, [center, zoom, style, pitch, bearing, enable3DBuildings]);

  // Add a useEffect to handle dialog visibility
  useEffect(() => {
    if (dialogLocation) {
      // Force dialog to show immediately when location changes
      const dialog = document.getElementById('location-dialog');
      if (dialog) {
        dialog.style.display = 'block';
      }
    }
  }, [dialogLocation]);

  const handleReviewSubmit = async () => {
    // Check if user is logged in
    if (!currentUser) {
      setShowLoginDialog(true);
      return;
    }
    
    if (review.stars === 0) {
      alert('Please select a rating');
      return;
    }
    if (!review.comment.trim()) {
      alert('Please enter your review');
      return;
    }
    
    try {
      // Prepare review data
      const reviewData = {
        user_id: currentUser.user_id,
        place_id: dialogLocation?.place_id,
        stars: review.stars,
        comment: review.comment
      };
      
      // Submit to API
      await axios.post(`${API_BASE_URL}/ratings`, reviewData);
      
      // Reset form
      setShowReviewDialog(false);
      setReview({ stars: 0, comment: '', user_id: currentUser.user_id, place_id: dialogLocation?.place_id || 0 });
      
      // Refresh place details to show new review
      if (dialogLocation) {
        const response = await axios.get(`${API_BASE_URL}/places/${dialogLocation.place_id}`);
        setDialogLocation(response.data);
      }
      
      // Show success message
      alert('Review submitted successfully!');
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    }
  };

  // Format review date to relative time (e.g., "2 days ago")
  const formatReviewDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    }
  };

  const ReviewDialog = useMemo(() => {
    if (!showReviewDialog) return null;

    return createPortal(
      <div className="fixed inset-0 bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Leave a Review</h3>
            <button
              onClick={() => setShowReviewDialog(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">How would you rate this place?</p>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className="focus:outline-none"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setReview({ ...review, stars: star })}
                >
                  <svg
                    className={`w-8 h-8 ${
                      (hoveredRating || review.stars) >= star
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="review" className="block text-sm font-medium text-gray-700 mb-2">
              Your Review
            </label>
            <textarea
              id="review"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-black text-black"
              placeholder="Share your experience..."
              value={review.comment}
              onChange={(e) => setReview({ ...review, comment: e.target.value })}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowReviewDialog(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleReviewSubmit}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Submit Review
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }, [showReviewDialog, review, hoveredRating, dialogLocation, currentUser]);

  // Add login function and state for login dialog
  const handleLogin = async () => {
    try {
      setLoginError(null);
      // Validate form
      if (!loginForm.email || !loginForm.password) {
        setLoginError('Please enter both email and password');
        return;
      }
      
      // Call login API
      const response = await axios.post(`${API_BASE_URL}/users/login`, loginForm);
      
      // Set current user
      setCurrentUser(response.data);
      
      // Close dialog
      setShowLoginDialog(false);
      
      // Reset form
      setLoginForm({ email: '', password: '' });
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Invalid credentials. Please try again.');
    }
  };
  
  // Login dialog component
  const LoginDialog = useMemo(() => {
    if (!showLoginDialog) return null;
    
    return createPortal(
      <div className="fixed inset-0 bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Login</h3>
            <button
              onClick={() => setShowLoginDialog(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {loginError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md text-sm">
              {loginError}
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={loginForm.email}
              onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowLoginDialog(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleLogin}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Login
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }, [showLoginDialog, loginForm, loginError]);

  return (
    <>
      <div className="relative w-full h-full" style={{ minHeight: "400px" }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
          </div>
        )}
        
        <div
          ref={mapContainer}
          className="w-full h-full"
        />

        {locationError && (
          <div className="absolute top-2 left-2 right-2 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded z-20">
            <p>{locationError}</p>
            <button
              onClick={() => {
                setLocationError(null);
                locationRequestedRef.current = false;
                getUserLocation();
              }}
              className="mt-1 bg-red-700 text-white px-3 py-1 rounded text-sm"
            >
              Try Again
            </button>
          </div>
        )}

        {error && (
          <div className="absolute top-2 left-2 right-2 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded z-20">
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-1 bg-red-700 text-white px-3 py-1 rounded text-sm"
            >
              Reload
            </button>
          </div>
        )}

        {/* User info/login button */}
        <div className="absolute top-4 right-4 z-20">
          {currentUser ? (
            <div className="bg-white rounded-full py-1 px-3 shadow-md flex items-center space-x-2">
              <span className="text-sm font-medium text-blue-800">{currentUser.username}</span>
              <button 
                onClick={() => setCurrentUser(null)}
                className="text-gray-500 hover:text-red-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginDialog(true)}
              className="bg-white hover:bg-blue-50 text-blue-700 font-medium rounded-full py-1 px-3 shadow-md transition-colors"
            >
              Login
            </button>
          )}
        </div>

        {/* Button to get initial location if not yet obtained */}
        {!userLocation && !locationError && isMapInitialized && (
          <button
            onClick={getUserLocation}
            className="absolute bottom-48 right-6 bg-green-600 hover:bg-green-700 text-white font-medium rounded-full p-3 shadow-lg transition-colors z-10 focus:outline-none focus:ring-2 focus:ring-green-500"
            aria-label="Get my location"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m5.656-5.656a1 1 0 010 1.414m2.828-2.828a5 5 0 010 7.072" />
            </svg>
          </button>
        )}

        {/* Button to center on existing location */}
        {userLocation && (
          <button
            onClick={showUserLocation}
            className="absolute bottom-48 right-6 bg-blue-700 hover:bg-blue-800 text-white font-medium rounded-full p-3 shadow-lg transition-colors z-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Show my location"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}

      {/* Category Filter UI */}
      {categories.length > 1 && (
        <div className="absolute left-0 right-0 top-2 z-20 flex justify-center pointer-events-none">
          <div className="bg-white rounded-full shadow px-4 py-2 flex gap-2 items-center pointer-events-auto overflow-x-auto max-w-full hide-scrollbar">
            {categories.map(category => (
              <button
                key={category}
                className={`px-3 py-1 rounded-full font-medium text-sm transition whitespace-nowrap
                  ${selectedCategory === category ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-blue-100'}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category !== 'All' && getCategoryEmoji(category)} {category}
              </button>
            ))}
          </div>
        </div>
      )}

        {/* Location cards at the bottom */}
        <div className="absolute bottom-4 left-0 right-0 z-10 px-4">
          <div className="flex overflow-x-auto gap-3 pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {filteredPlaces.map((place) => (
              <div
                key={place.place_id}
                onClick={() => navigateToLocation(place)}
                className={`
                  flex-shrink-0 bg-white rounded-lg shadow-md p-3 cursor-pointer relaxed-card-font
                  w-56 transition-all duration-300 ease-in-out border-2 box-border
                  my-3 relative
                  ${selectedLocation === place.place_id ? 'border-blue-500 shadow-xl transform -translate-y-1' : 'border-gray-200 hover:scale-105 hover:shadow-xl hover:border-blue-300'}
                `}
              >
                <h3 className="font-medium text-base truncate text-blue-900">{place.name}</h3>
                <p className="text-gray-600 text-sm line-clamp-2 mt-1">{place.description}</p>
                <div className={`
                  mt-2 inline-block px-2 py-1 text-xs rounded-full
                  ${place.category === 'Attraction' ? 'bg-yellow-100 text-yellow-700' :
                     place.category === 'University' ? 'bg-blue-100 text-blue-700' :
                       place.category === 'Shopping' ? 'bg-purple-100 text-purple-700' :
                         place.category === 'Heritage' ? 'bg-amber-100 text-amber-700' :
                           'bg-gray-100 text-gray-700'}`}>
                  {getCategoryEmoji(place.category)} {place.category}
                </div>
                
                {/* Rating display */}
                {place.avg_rating > 0 && (
                  <div className="flex items-center mt-2">
                    <div className="flex text-yellow-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-3 h-3 ${
                            star <= Math.round(place.avg_rating)
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-xs text-gray-600 ml-1">
                      {place.avg_rating.toFixed(1)} ({place.review_count})
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Information Dialog */}
        {dialogLocation && (
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 z-20 max-w-xs w-full border border-gray-200 overflow-y-auto max-h-[calc(100vh-240px)]">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center">
                <span className="text-xl mr-2">{getCategoryEmoji(dialogLocation.category)}</span>
                <h3 className="font-bold text-lg pr-6 text-blue-900">{dialogLocation.name}</h3>
              </div>
              <button
                onClick={() => setDialogLocation(null)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close details"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {dialogLocation.image_url && (
              <div className="mb-3 rounded-md overflow-hidden">
                <img
                  src={dialogLocation.image_url}
                  alt={dialogLocation.name}
                  className="w-full h-32 object-cover"
                />
              </div>
            )}

            <p className="text-sm text-gray-600 mb-3">{dialogLocation.description}</p>

            {/* Overall Rating */}
            <div className="mb-3 flex items-center">
              <div className="flex text-yellow-400 mr-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg 
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(dialogLocation.avg_rating)
                        ? 'text-yellow-400'
                        : 'text-gray-200'
                    }`}
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                ))}
              </div>
              <p className="text-xs font-medium text-gray-700">
                {dialogLocation.avg_rating ? dialogLocation.avg_rating.toFixed(1) : '0'} 
                ({dialogLocation.review_count || 0} reviews)
              </p>
            </div>

            {/* Category Tag */}
            <div className={`
              mb-4 inline-block px-2 py-1 text-xs rounded-full
              ${dialogLocation.category === 'Attraction' ? 'bg-yellow-100 text-yellow-700' :
                      dialogLocation.category === 'University' ? 'bg-blue-100 text-blue-700' :
                        dialogLocation.category === 'Shopping' ? 'bg-purple-100 text-purple-700' :
                          dialogLocation.category === 'Heritage' ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-700'}
            `}>
              {getCategoryEmoji(dialogLocation.category)} {dialogLocation.category}
            </div>

            {/* User Reviews Section */}
            {dialogLocation.reviews && dialogLocation.reviews.length > 0 && (
              <div className="mt-4 mb-3">
                <h4 className="font-medium text-sm mb-2 text-blue-900">User Reviews</h4>

                {dialogLocation.reviews.map((review, index) => (
                  <div key={review.rating_id || index} className="mb-3 pb-3 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-gray-800">{review.username}</p>
                      <div className="flex text-yellow-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg 
                            key={star}
                            className={`w-3 h-3 ${
                              star <= review.stars
                                ? 'text-yellow-400'
                                : 'text-gray-200'
                            }`}
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                          </svg>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{review.comment}</p>
                    {review.created_at && (
                      <p className="text-[10px] text-gray-400 mt-1">
                        {formatReviewDate(review.created_at)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Leave a review button */}
            <div className="mt-4">
              <button
                onClick={() => {
                  if (!currentUser) {
                    setShowLoginDialog(true);
                  } else {
                    setShowReviewDialog(true);
                    setReview({ 
                      stars: 0, 
                      comment: '', 
                      user_id: currentUser.user_id,
                      place_id: dialogLocation.place_id 
                    });
                  }
                }}
                className="w-full block text-center text-xs bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition">
                Leave a Review
              </button>
            </div>

            {/* Location coordinates */}
            <div className="mt-3 text-[10px] text-gray-400 flex justify-between">
              <span>Lat: {Number(dialogLocation.latitude).toFixed(4)}</span>
              <span>Lng: {Number(dialogLocation.longitude).toFixed(4)}</span>
            </div>
          </div>
        )}
      </div>
      {ReviewDialog}
      {LoginDialog}
    </>
  );
}