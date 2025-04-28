'use client';

import { useEffect, useRef } from 'react';
import maplibregl, { Color } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapProps {
  style?: string;
  center?: [number, number];
  zoom?: number;
}

export default function Map({ 
  style = `https://api.maptiler.com/maps/streets/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_API_KEY}`,
  center = [102.3217, 2.3153],
  zoom = 12 
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (map.current) return; // initialize map only once

    map.current = new maplibregl.Map({
      container: mapContainer.current!,
      style: style,
      center: center,
      zoom: zoom
    });

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    // Get user location and add marker
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lng = position.coords.longitude;
          const lat = position.coords.latitude;
          // Add a red marker with a popup
          new maplibregl.Marker({ color: 'red' })
            .setLngLat([lng, lat])
            .setPopup(
              new maplibregl.Popup({ offset: 25 }).setHTML('<span style="color: black; font-weight: bold;">You are here</span>')
            )
            .addTo(map.current!)
            .togglePopup(); // Open the popup by default
          // Optionally, center the map on the user's location:
          // map.current!.setCenter([lng, lat]);
        },
        (error) => {
          console.error('Error getting user location:', error);
        }
      );
    }

    return () => {
      map.current?.remove();
    };
  }, [style, center, zoom]);

  return (
    <div 
      ref={mapContainer} 
      className="w-full h-full"
    />
  );
}
