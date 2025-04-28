'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { LocationUI, locations, getCategoryEmoji } from '../data';

interface MapProps {
  style?: string;
  center?: [number, number];
  zoom?: number;
  pitch?: number;
  bearing?: number;
  enable3DBuildings?: boolean;
}

// Move outside component to prevent re-creation on each render
const getMapStyle = () => {
  if (process.env.NEXT_PUBLIC_MAPTILER_API_KEY) {
    return `https://api.maptiler.com/maps/streets/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_API_KEY}`;
  }
  // Fallback to MapLibre demo tiles
  return 'https://demotiles.maplibre.org/style.json';
};

// Add new interface for review
interface Review {
  rating: number;
  comment: string;
}

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
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [dialogLocation, setDialogLocation] = useState<LocationUI | null>(null);
  const locationRequestedRef = useRef(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [review, setReview] = useState<Review>({ rating: 0, comment: '' });
  const [hoveredRating, setHoveredRating] = useState(0);

  // Get unique categories for filter
  const categories = ['All', ...Array.from(new Set(locations.map(l => l.category || 'Other')))]
    .filter((v, i, a) => a.indexOf(v) === i);

  // Filtered locations
  const filteredLocations = selectedCategory === 'All'
    ? locations
    : locations.filter(l => l.category === selectedCategory);

  const navigateToLocation = useCallback((location: LocationUI) => {
    if (!map.current || !isMapInitialized) return;
    
    // Set both states immediately
    setSelectedLocation(location.id);
    setDialogLocation(location);

    // Create or update marker for the selected location
    if (!locationMarkers.current[location.id]) {
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
      markerElement.innerHTML = getCategoryEmoji(location.category);

      // Create popup content
      const popupContent = document.createElement('div');
      popupContent.className = 'popup-content';
      popupContent.innerHTML = `
        <div class="p-2">
          <h3 class="font-bold text-sm">${location.name}</h3>
          <p class="text-xs text-gray-600">${location.description}</p>
        </div>
      `;

      // Create and add marker
      const marker = new maplibregl.Marker({
        element: markerElement,
        anchor: 'bottom'
      })
        .setLngLat([location.lng, location.lat])
        .setPopup(new maplibregl.Popup({ offset: 25 })
          .setDOMContent(popupContent))
        .addTo(map.current);

      locationMarkers.current[location.id] = marker;
    } else {
      // Update existing marker's popup
      const popupContent = document.createElement('div');
      popupContent.className = 'popup-content';
      popupContent.innerHTML = `
        <div class="p-2">
          <h3 class="font-bold text-sm">${location.name}</h3>
          <p class="text-xs text-gray-600">${location.description}</p>
        </div>
      `;
      locationMarkers.current[location.id].setPopup(
        new maplibregl.Popup({ offset: 25 })
          .setDOMContent(popupContent)
      );
    }

    // Close any open popups first to avoid visual glitches
    if (selectedLocation && locationMarkers.current[selectedLocation]) {
      const popup = locationMarkers.current[selectedLocation].getPopup();
      if (popup && popup.isOpen()) {
        popup.remove();
      }
    }

    // Add markers if they don't exist yet
    if (!locationMarkers.current[location.id] && map.current) {
      const popup = new maplibregl.Popup({ 
        offset: 25,
        closeButton: false
      })
        .setHTML(`
          <div>
            <h3 class="font-medium">${location.name}</h3>
            <p class="text-sm">${location.description}</p>
            <p class="text-xs text-gray-500 mt-1">Lat: ${location.lat.toFixed(6)}, Lng: ${location.lng.toFixed(6)}</p>
          </div>
        `);
      
      const el = document.createElement('div');
      el.className = 'location-marker';
      el.style.width = '30px';
      el.style.height = '30px';
      el.style.backgroundImage = 'url(/images/marker.png)';
      el.style.backgroundSize = 'contain';
      el.style.backgroundRepeat = 'no-repeat';
      el.style.cursor = 'pointer';

      // Set the marker position with exact coordinates
      const marker = new maplibregl.Marker(el)
        .setLngLat([location.lng, location.lat])
        .setPopup(popup)
        .addTo(map.current);
      
      locationMarkers.current[location.id] = marker;
    }


    // First zoom out from current location
    if (selectedLocation && locationMarkers.current[selectedLocation]) {
      const currentMarker = locationMarkers.current[selectedLocation];
      const currentLngLat = currentMarker.getLngLat();
      
      map.current.flyTo({
        center: [currentLngLat.lng, currentLngLat.lat],
        zoom: 12,
        essential: true,
        duration: 1000,
        curve: 1.42
      });
    }

    // Then fly to new location with a slight delay
    setTimeout(() => {
      if (map.current) {
        map.current.flyTo({
          center: [location.lng, location.lat],
          zoom: 16,
          essential: true,
          duration: 2000,
          padding: { top: 50, bottom: 150, left: 50, right: 50 },
          curve: 1.42
        });

        // Show the popup after navigation
        if (locationMarkers.current[location.id]) {
          locationMarkers.current[location.id].togglePopup();
        }
      }
    }, 1000);

  }, [isMapInitialized, selectedLocation]);

  // Memoize getUserLocation function to prevent recreation on every render
  const getUserLocation = useCallback(() => {
    // Your existing getUserLocation implementation
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
        userMarker.current.togglePopup();
      }

      //userMarker.current.togglePopup();
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
  // Remove markers for locations not in filteredLocations
  useEffect(() => {
    if (!map.current) return;
    // Remove all markers
    Object.keys(locationMarkers.current).forEach(id => {
      if (!filteredLocations.find(l => l.id === id)) {
        locationMarkers.current[id]?.remove();
        delete locationMarkers.current[id];
      }
    });
    // Add markers for filtered locations if not present
    filteredLocations.forEach(location => {
      if (!locationMarkers.current[location.id]) {
        // Marker creation logic (copy from navigateToLocation)
        const el = document.createElement('div');
        el.className = 'location-marker';
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.backgroundImage = 'url(/images/marker.png)';
        el.style.backgroundSize = 'contain';
        el.style.backgroundRepeat = 'no-repeat';
        el.style.cursor = 'pointer';
        const marker = new maplibregl.Marker(el)
          .setLngLat([location.lng, location.lat])
          .addTo(map.current!);
        locationMarkers.current[location.id] = marker;
      }
    });
  }, [filteredLocations, map, locationMarkers]);

  // Your existing useEffect code for initializing map
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
        attributionControl: false // Reduce network requests for attribution tiles
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
            const map = maplibregl as any;
            // Find the first symbol layer with a text-field to insert below
            const layers = map.current.getStyle().layers;
            let labelLayerId = undefined;
            for (let i = 0; i < layers.length; i++) {
              if (layers[i].type === 'symbol' && layers[i].layout && layers[i].layout['text-field']) {
                labelLayerId = layers[i].id;
                break;
              }
            }
            // Add the OpenMapTiles vector source for buildings
            if (!map.current.getSource('openmaptiles')) {
              map.current.addSource('openmaptiles', {
                url: `https://api.maptiler.com/tiles/v3/tiles.json?key=${MAPTILER_KEY}`,
                type: 'vector',
              });
            }
            // Add the 3D buildings layer with enhanced visibility
            if (!map.current.getLayer('3d-buildings')) {
              map.current.addLayer(
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
                    'fill-extrusion-ambient-occlusion': true, // Add ambient occlusion
                    'fill-extrusion-ambient-occlusion-intensity': 0.3, // Control occlusion intensity
                    'fill-extrusion-ambient-occlusion-radius': 2 // Control occlusion radius
                  }
                },
                labelLayerId
              );
            }
          }
          // --- End 3D Buildings Layer Logic ---
        }
      });

      map.current.on('error', (e) => {
        console.error('Map error:', e);
      });
    } catch (err) {
      console.error('Error initializing map:', err);
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
  }, [center, zoom, style]);

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

  const handleReviewSubmit = () => {
    if (review.rating === 0) {
      alert('Please select a rating');
      return;
    }
    if (!review.comment.trim()) {
      alert('Please enter your review');
      return;
    }
    // TODO: Implement actual review submission
    console.log('Review submitted:', review);
    setShowReviewDialog(false);
    setReview({ rating: 0, comment: '' });
  };

  return (
    <div className="relative w-full h-full" style={{ minHeight: "400px" }}>
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
      <div className="absolute left-0 right-0 top-2 z-20 flex justify-center">
        <div className="bg-white rounded-full shadow px-4 py-2 flex gap-2 items-center">
          {categories.map(category => (
            <button
              key={category}
              className={`px-3 py-1 rounded-full font-medium text-sm transition
                ${selectedCategory === category ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-blue-100'}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category !== 'All' && getCategoryEmoji(category)} {category}
            </button>
          ))}
        </div>
      </div>

      {/* Location cards at the bottom */}
      <div className="absolute bottom-4 left-0 right-0 z-10 px-4">
        <div className="flex overflow-x-auto gap-3 pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {filteredLocations.map((location) => (
            <div
              key={location.id}
              onClick={() => navigateToLocation(location)}
              className={`
                flex-shrink-0 bg-white rounded-lg shadow-md p-3 cursor-pointer relaxed-card-font
                w-56 transition-all duration-300 ease-in-out border-2 border-black box-border
                my-3 relative
                ${selectedLocation === location.id ? 'shadow-xl transform -translate-y-1' : 'hover:scale-105 hover:shadow-xl hover:border-black'}
              `}
            >
              <h3 className="font-medium text-base truncate text-blue-900">{location.name}</h3>
              <p className="text-gray-600 text-sm line-clamp-2 mt-1">{location.description}</p>
              <div className={`
                mt-2 inline-block px-2 py-1 text-xs rounded-full
                ${location.category === 'Attraction' ? 'bg-yellow-100 text-yellow-700' :
                   location.category === 'University' ? 'bg-blue-100 text-blue-700' :
                     location.category === 'Shopping' ? 'bg-purple-100 text-purple-700' :
                       location.category === 'Heritage' ? 'bg-amber-100 text-amber-700' :
                         'bg-gray-100 text-gray-700'}`}>
                {getCategoryEmoji(location.category)} {location.category}
              </div>
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

          {dialogLocation.imageUrl && (
            <div className="mb-3 rounded-md overflow-hidden">
              <img
                src={dialogLocation.imageUrl}
                alt={dialogLocation.name}
                className="w-full h-32 object-cover"
              />
            </div>
          )}

          <p className="text-sm text-gray-600 mb-3">{dialogLocation.description}</p>

          {/* Overall Rating */}
          <div className="mb-3 flex items-center">
            <div className="flex text-yellow-400 mr-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
              </svg>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
              </svg>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
              </svg>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
              </svg>
              <svg className="w-4 h-4" fill="gray" stroke="currentColor" strokeWidth="0.5" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
              </svg>
            </div>
            <p className="text-xs font-medium text-gray-700">4.0 (24 reviews)</p>
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
          <div className="mt-4 mb-3">
            <h4 className="font-medium text-sm mb-2 text-blue-900">User Reviews</h4>

            {/* Review 1 */}
            <div className="mb-3 pb-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-800">Ahmad Firdaus</p>
                <div className="flex text-yellow-400">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-1">Great place to visit! The ambiance is amazing and the staff are very friendly.</p>
              <p className="text-[10px] text-gray-400 mt-1">2 days ago</p>
            </div>

            {/* Review 2 */}
            <div className="mb-3 pb-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-800">Sarah Tan</p>
                <div className="flex text-yellow-400">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                  <svg className="w-3 h-3" fill="gray" stroke="currentColor" strokeWidth="0.5" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-1">I love coming here on weekends. The prices are reasonable and the location is convenient.</p>
              <p className="text-[10px] text-gray-400 mt-1">1 week ago</p>
            </div>

            {/* Review 3 */}
            <div className="mb-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-800">Mohd Raza</p>
                <div className="flex text-yellow-400">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                  <svg className="w-3 h-3" fill="gray" stroke="currentColor" strokeWidth="0.5" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                  <svg className="w-3 h-3" fill="gray" stroke="currentColor" strokeWidth="0.5" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-1">It was okay but could be better. The place is a bit crowded during weekends.</p>
              <p className="text-[10px] text-gray-400 mt-1">3 weeks ago</p>
            </div>
          </div>

          {/* Google Maps Link */}
          <div className="mt-4">
            <button
              onClick={() => {
                setShowReviewDialog(true);
                setReview({ rating: 0, comment: '' });
              }}
              className="w-full block text-center text-xs bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition">
              Leave a Review
            </button>
          </div>
        </div>
      )}

      {/* Review Dialog */}
      {showReviewDialog && (
        <div className="fixed inset-0 bg-opacity-30 flex items-center justify-center z-50">
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
                    onClick={() => setReview({ ...review, rating: star })}
                  >
                    <svg
                      className={`w-8 h-8 ${
                        (hoveredRating || review.rating) >= star
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
        </div>
      )}
    </div>
  );
}