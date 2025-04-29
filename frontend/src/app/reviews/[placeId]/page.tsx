'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';
import ReviewCard from '@/components/ReviewCard';
import ReviewForm from '@/components/ReviewForm';

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
  reviews: Review[];
}

interface Review {
  rating_id: number;
  user_id: number;
  place_id: number;
  stars: number;
  comment: string;
  created_at: string;
  username: string;
}

interface User {
  user_id: number;
  username: string;
  email: string;
  success: boolean;
}

export default function ReviewsPage() {
  const [place, setPlace] = useState<Place | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const router = useRouter();
  const params = useParams();
  const placeId = params.placeId as string;

  // Check for existing user session on component mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch {
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Fetch place and reviews on component mount
  useEffect(() => {
    if (placeId) {
      fetchPlaceDetails(parseInt(placeId));
    }
  }, [placeId]);

  // Find user's review when user or place changes
  useEffect(() => {
    if (user && place?.reviews) {
      const review = place.reviews.find(review => review.user_id === user.user_id) || null;
      setUserReview(review);
    } else {
      setUserReview(null);
    }
  }, [user, place]);

  // Fetch place details including reviews
  const fetchPlaceDetails = async (id: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/places/${id}`);
      const data = await response.json();
      
      if (response.ok) {
        setPlace(data);
      } else {
        toast.error('Failed to fetch place details');
        router.push('/');
      }
    } catch {
      toast.error('Network error. Please try again.');
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">Place not found</h1>
        <p className="mt-2 text-gray-600">The place you are looking for does not exist.</p>
        <button
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          onClick={() => router.push('/')}
        >
          Go back to home
        </button>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-8">
      <Toaster position="top-center" />
      
      {/* Header with place info */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="w-full md:w-1/3 lg:w-1/4">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {place.image_url ? (
              <img 
                src={place.image_url} 
                alt={place.name} 
                className="w-full h-48 md:h-56 object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                }}
              />
            ) : (
              <div className="w-full h-48 md:h-56 flex items-center justify-center bg-gray-100">
                <span className="text-gray-400">No Image</span>
              </div>
            )}
            
            <div className="p-4">
              <h1 className="text-xl font-bold text-gray-900">{place.name}</h1>
              
              <div className="flex items-center mt-2">
                <div className="flex items-center text-yellow-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="ml-1 text-sm font-medium">{place.avg_rating ? place.avg_rating.toFixed(1) : '0'}</span>
                  <span className="ml-1 text-xs text-gray-500">({place.review_count || 0} reviews)</span>
                </div>
              </div>
              
              {place.category && (
                <div className="mt-2">
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    {place.category}
                  </span>
                </div>
              )}
              
              {place.description && (
                <p className="mt-3 text-sm text-gray-600 line-clamp-4">{place.description}</p>
              )}
              
              <button
                className="mt-4 w-full flex items-center justify-center text-blue-600 hover:text-blue-800"
                onClick={() => router.push('/')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to Map
              </button>
            </div>
          </div>

          {/* Login prompt for non-logged in users */}
          {!user && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800">Want to leave a review?</h3>
              <p className="text-xs text-blue-600 mt-1">You need to be logged in to share your experience.</p>
              <button
                className="mt-2 w-full text-center text-sm bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition-colors"
                onClick={() => router.push('/login')}
              >
                Log in
              </button>
            </div>
          )}
        </div>
        
        <div className="w-full md:w-2/3 lg:w-3/4">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 sm:mb-0">Reviews</h2>
            
            {place.review_count > 0 && (
              <div className="flex items-center">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg 
                      key={star}
                      className={`h-5 w-5 ${star <= Math.round(place.avg_rating || 0) ? 'text-yellow-500' : 'text-gray-200'}`}
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-600">
                  {place.avg_rating.toFixed(1)} out of 5 ({place.review_count} {place.review_count === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            )}
          </div>

          {/* Review Form for logged-in users */}
          {user && (
            <div className="mb-8">
              <ReviewForm 
                placeId={place.place_id}
                userId={user.user_id}
                onReviewSubmitted={() => fetchPlaceDetails(place.place_id)}
                existingReview={userReview ? {
                  stars: userReview.stars,
                  comment: userReview.comment
                } : undefined}
              />
            </div>
          )}
          
          {/* Reviews List */}
          {place.reviews && place.reviews.length > 0 ? (
            <div className="space-y-4">
              {place.reviews.map(review => (
                <ReviewCard key={review.rating_id} review={review} />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <h3 className="text-lg font-medium text-gray-600">No reviews yet</h3>
              <p className="text-gray-500 mt-1">Be the first to share your experience!</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 