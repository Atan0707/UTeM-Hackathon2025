"use client";

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function Home() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (map.current) return; // initialize map only once
    if (!mapContainer.current) return; // wait for map container to be ready

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: `https://api.maptiler.com/maps/streets/style.json?key=EJsqIOpsUVhXXofk2osf`,
        center: [101.7003, 2.9924], // Malaysia coordinates
        zoom: 5
      });
  
      map.current.on('error', (e) => {
        console.error('Map error:', e);
      });
  
      map.current.on('load', () => {
        console.log('Map loaded successfully');
        setMapLoaded(true);
      });

      // Add navigation controls (optional)
      map.current.addControl(new maplibregl.NavigationControl());
      
    } catch (error) {
      console.error('Error initializing map:', error);
    }

    // Clean up on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-teal-500 text-white p-4 shadow-lg">
        <h1 className="text-2xl font-bold text-center">MapLibre Explorer</h1>
      </header>

      {/* Map container */}
      <div className="flex-1 relative">
        <div 
          ref={mapContainer} 
          className="absolute inset-0 rounded-lg shadow-inner m-4"
          style={{ height: 'calc(100% - 2rem)' }}
        />
        
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 m-4 rounded-lg">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-700 font-medium">Loading map...</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-800 p-4 text-center text-sm text-gray-600 dark:text-gray-300">
        <p>Powered by MapLibre GL JS and MapTiler</p>
      </footer>
    </div>
  );
}