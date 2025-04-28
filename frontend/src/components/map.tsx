'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { LocationUI, locations, getCategoryEmoji } from '../data';

interface MapProps {
  style?: string;
  center?: [number, number];
  zoom?: number;
}

// Move outside component to prevent re-creation on each render
const getMapStyle = () => {
  if (process.env.NEXT_PUBLIC_MAPTILER_API_KEY) {
    return `https://api.maptiler.com/maps/streets/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_API_KEY}`;
  }
  // Fallback to MapLibre demo tiles
  return 'https://demotiles.maplibre.org/style.json';
};

export default function Map({
  style = getMapStyle(),
  center = [102.3217, 2.3153],
  zoom = 12
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

  // Function to navigate to a location when card is clicked
  const navigateToLocation = useCallback((location: LocationUI) => {
    if (!map.current || !isMapInitialized) return;

    // Only perform actions if selecting a different location or re-selecting after null
    const isNewSelection = selectedLocation !== location.id;
    setSelectedLocation(location.id);

    // Set the dialog content
    setDialogLocation(location);

    // Close any open popups first to avoid visual glitches
    if (selectedLocation && locationMarkers.current[selectedLocation]) {
      locationMarkers.current[selectedLocation].getPopup();
    }

    // Fly to location with smooth animation
    map.current.flyTo({
      center: [location.lng, location.lat],
      zoom: 16,
      essential: true,
      duration: 2000,
      padding: { top: 50, bottom: 150, left: 50, right: 50 },
      curve: 1.42
    });

    // Show popup for the location with slight delay to ensure smoother animation
    if (locationMarkers.current[location.id]) {
      setTimeout(() => {
        if (isNewSelection && locationMarkers.current[location.id]) {
          locationMarkers.current[location.id].togglePopup();
        }
      }, 1000);
    }
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

      // Show the popup when centering
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

      {/* Location cards at the bottom */}
      <div className="absolute bottom-4 left-0 right-0 z-10 px-4">
        <div className="flex overflow-x-auto gap-3 pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {locations.map((location) => (
            <div
              key={location.id}
              onClick={() => navigateToLocation(location)}
              className={`
                flex-shrink-0 bg-white rounded-lg shadow-md p-3 cursor-pointer
                w-56 transition-all duration-300 ease-in-out border-2 border-black overflow-hidden
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
                      location.category === 'Historical' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-700'}`}>
                {location.category}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Information Dialog */}
      {dialogLocation && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 z-20 max-w-xs w-full border border-gray-200">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center">
              <span className="text-xl mr-2">{getCategoryEmoji(dialogLocation.category)}</span>
              <h3 className="font-bold text-lg pr-6">{dialogLocation.name}</h3>
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

          <div className="flex flex-wrap justify-between items-center">
            <div className={`
        px-2 py-1 text-xs rounded-full mb-2
        ${dialogLocation.category === 'Attraction' ? 'bg-yellow-100 text-yellow-700' :
                dialogLocation.category === 'University' ? 'bg-blue-100 text-blue-700' :
                  dialogLocation.category === 'Shopping' ? 'bg-purple-100 text-purple-700' :
                    dialogLocation.category === 'Historical' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-700'}
      `}>
              {dialogLocation.category}
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${dialogLocation.lat},${dialogLocation.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition"
            >
              Open in Google Maps
            </a>
          </div>
        </div>
      )}

    </div>
  );
}