import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

interface ReviewFormProps {
  placeId: number;
  userId: number;
  onReviewSubmitted: () => void;
  existingReview?: {
    stars: number;
    comment: string;
  };
}

export default function ReviewForm({ placeId, userId, onReviewSubmitted, existingReview }: ReviewFormProps) {
  const [reviewData, setReviewData] = useState({
    stars: existingReview?.stars || 5,
    comment: existingReview?.comment || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setReviewData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const setRating = (stars: number) => {
    setReviewData(prev => ({ ...prev, stars }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId || !placeId) {
      toast.error('You must be logged in to leave a review');
      return;
    }

    if (!reviewData.stars) {
      toast.error('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('http://localhost:3001/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          place_id: placeId,
          stars: reviewData.stars,
          comment: reviewData.comment
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(existingReview 
          ? 'Review updated successfully!' 
          : 'Review submitted successfully!');
        setReviewData({ stars: 5, comment: '' });
        onReviewSubmitted();
      } else {
        toast.error(data.message || 'Failed to submit review');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mb-4">
      <h3 className="font-medium mb-3">Leave a Review</h3>
      <form onSubmit={handleSubmit}>
        <div className="flex mb-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="focus:outline-none mr-1"
            >
              <svg 
                className={`h-6 w-6 ${star <= reviewData.stars ? 'text-yellow-400' : 'text-gray-300'}`}
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
        </div>
        <textarea
          name="comment"
          value={reviewData.comment}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 mb-3"
          placeholder="Share your experience..."
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
        >
          {isSubmitting ? 'Submitting...' : 'Leave a Review'}
        </button>
      </form>
    </div>
  );
} 