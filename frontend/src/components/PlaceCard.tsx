import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface PlaceCardProps {
  place: {
    place_id: number;
    name: string;
    description: string;
    image_url: string;
    category: string;
    latitude: number;
    longitude: number;
    avg_rating?: number;
    average_rating?: number; // For top-rated endpoint
    review_count?: number;
    distance?: number; // For nearby places
  };
}

export default function PlaceCard({ place }: PlaceCardProps) {
  const rating = place.avg_rating || place.average_rating || 0;
  const defaultImage = 'https://images.unsplash.com/photo-1580753551449-5da17abeef3d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1500&q=80';
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className="relative h-48 w-full">
        <Image
          src={place.image_url || defaultImage}
          alt={place.name}
          fill
          style={{ objectFit: 'cover' }}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {place.category && (
          <span className="absolute top-2 right-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded-md">
            {place.category}
          </span>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-1 truncate">{place.name}</h3>
        
        <div className="flex items-center mb-2">
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 ${i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-xs text-gray-600 ml-1">
            {rating.toFixed(1)} ({place.review_count || 0} reviews)
          </span>
        </div>
        
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {place.description || 'No description available.'}
        </p>
        
        {place.distance !== undefined && (
          <p className="text-xs text-gray-500 mb-3">
            Distance: {place.distance.toFixed(2)} km
          </p>
        )}
        
        <Link 
          href={`/places/${place.place_id}`}
          className="block text-center bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors"
        >
          View Details
        </Link>
      </div>
    </div>
  );
} 