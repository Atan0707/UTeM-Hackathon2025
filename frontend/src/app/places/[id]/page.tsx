'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { placesApi, ratingsApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

// Define the Place interface
interface Review {
  rating_id: number;
  user_id: number;
  username: string;
  stars: number;
  comment: string;
  created_at: string;
}

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

export default function PlaceDetailsPage() {
  const { id } = useParams();
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRating, setUserRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const { user, isAuthenticated } = useAuth();
  
  // Fetch place details
  useEffect(() => {
    const fetchPlaceDetails = async () => {
      try {
        setLoading(true);
        const data = await placesApi.getPlaceById(Number(id));
        setPlace(data);
        
        // If user is logged in, find their existing rating if any
        if (isAuthenticated && user && data.reviews) {
          const userReview = data.reviews.find(review => review.user_id === user.user_id);
          if (userReview) {
            setUserRating(userReview.stars);
            setComment(userReview.comment);
          }
        }
      } catch (error) {
        console.error('Error fetching place details:', error);
        setError('Failed to load place details. Please try again later.');
        toast.error('Failed to load place details');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchPlaceDetails();
    }
  }, [id, isAuthenticated, user]);
  
  // Handle submit rating
  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated || !user) {
      toast.error('You must be logged in to submit a rating');
      return;
    }
    
    if (userRating === 0) {
      toast.error('Please select a star rating');
      return;
    }
    
    try {
      setSubmitting(true);
      
      await ratingsApi.addOrUpdateRating({
        user_id: user.user_id,
        place_id: Number(id),
        stars: userRating,
        comment
      });
      
      toast.success('Rating submitted successfully');
      
      // Refresh place data
      const updatedData = await placesApi.getPlaceById(Number(id));
      setPlace(updatedData);
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle star rating click
  const handleStarClick = (rating: number) => {
    setUserRating(rating);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (error || !place) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-red-500">
        {error || 'Place not found'}
      </div>
    );
  }
  
  const defaultImage = 'https://images.unsplash.com/photo-1580753551449-5da17abeef3d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1500&q=80';
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="relative h-64 sm:h-96 w-full">
          <Image
            src={place.image_url || defaultImage}
            alt={place.name}
            fill
            style={{ objectFit: 'cover' }}
            sizes="100vw"
            priority
          />
          {place.category && (
            <span className="absolute top-4 right-4 bg-indigo-600 text-white px-3 py-1 rounded-md">
              {place.category}
            </span>
          )}
        </div>
        
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{place.name}</h1>
          
          <div className="flex items-center mb-4">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 ${i < Math.round(place.avg_rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-sm text-gray-600 ml-2">
              {place.avg_rating.toFixed(1)} ({place.review_count} reviews)
            </span>
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">About</h2>
            <p className="text-gray-700">
              {place.description || 'No description available.'}
            </p>
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Location</h2>
            <div className="bg-gray-100 p-4 rounded-md">
              <p className="text-gray-700">
                Latitude: {place.latitude}<br />
                Longitude: {place.longitude}
              </p>
            </div>
          </div>
          
          {/* Rating form */}
          {isAuthenticated ? (
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Leave a Rating</h2>
              
              <form onSubmit={handleSubmitRating}>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Your Rating</label>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleStarClick(star)}
                        className="focus:outline-none"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-8 w-8 ${
                            star <= userRating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="comment" className="block text-gray-700 mb-2">
                    Your Comment
                  </label>
                  <textarea
                    id="comment"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-200"
                    placeholder="Share your experience..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  ></textarea>
                </div>
                
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 bg-indigo-600 text-white rounded-md ${
                    submitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'
                  }`}
                >
                  {submitting ? 'Submitting...' : 'Submit Rating'}
                </button>
              </form>
            </div>
          ) : (
            <div className="mb-8 p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-gray-700">
                Please <a href="/auth/login" className="text-indigo-600 hover:underline">log in</a> to leave a rating.
              </p>
            </div>
          )}
          
          {/* Reviews section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Reviews</h2>
            
            {place.reviews && place.reviews.length > 0 ? (
              <div className="space-y-4">
                {place.reviews.map((review) => (
                  <div key={review.rating_id} className="border-b pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-medium">{review.username}</span>
                        <div className="flex text-yellow-400 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              xmlns="http://www.w3.org/2000/svg"
                              className={`h-4 w-4 ${
                                i < review.stars ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-2 text-gray-700">{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No reviews yet. Be the first to leave a review!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 