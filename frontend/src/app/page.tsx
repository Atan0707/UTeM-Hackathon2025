'use client';

import { useState, FormEvent, MouseEvent, useEffect } from 'react';
import Map from '@/components/map';
import { toast, Toaster } from 'react-hot-toast';
import ReviewCard from '@/components/ReviewCard';
import ReviewForm from '@/components/ReviewForm';

interface FormData {
  username?: string;
  email: string;
  password: string;
}

interface User {
  user_id: number;
  username: string;
  email: string;
  success: boolean;
}

interface Place {
  place_id: number;
  name: string;
  description: string;
  image_url: string;
  category: string;
  latitude: number;
  longitude: number;
  avg_rating?: number;
  review_count?: number;
  reviews?: Review[];
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

export default function Home() {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
  });
  const [user, setUser] = useState<User | null>(null);

  // Places management state
  const [showPlacesModal, setShowPlacesModal] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [placeFormData, setPlaceFormData] = useState<Partial<Place>>({
    name: '',
    description: '',
    image_url: '',
    category: '',
    latitude: 0,
    longitude: 0,
  });

  const categories = [
    'Historical',
    'Cultural',
    'Nature',
    'Food',
    'Shopping',
    'Entertainment',
    'Accommodation',
    'Other'
  ];

  // Inside the component where you're displaying place details in the popup
  // Add state for reviews and user review
  const [selectedPlaceReviews, setSelectedPlaceReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  // Check for existing user session on component mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Fetch places when modal opens
  useEffect(() => {
    const controller = new AbortController();
    
    if (showPlacesModal) {
      const fetchData = async () => {
        try {
          setIsLoadingPlaces(true);
          const response = await fetch('http://localhost:3001/api/places', {
            signal: controller.signal
          });
          const data = await response.json();
          
          if (response.ok) {
            setPlaces(data.places);
          } else {
            toast.error('Failed to fetch places');
          }
        } catch (error) {
          if (error instanceof Error && error.name !== 'AbortError') {
            toast.error('Network error. Please try again.');
          }
        } finally {
          setIsLoadingPlaces(false);
        }
      };
      
      fetchData();
    }
    
    return () => {
      controller.abort();
    };
  }, [showPlacesModal]);

  // Fetch place details including reviews
  const fetchPlaceDetails = async (placeId: number) => {
    const controller = new AbortController();
    try {
      const response = await fetch(`http://localhost:3001/api/places/${placeId}`, {
        signal: controller.signal
      });
      const data = await response.json();
      
      if (response.ok) {
        setSelectedPlace(data);
      } else {
        toast.error('Failed to fetch place details');
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        toast.error('Network error. Please try again.');
      }
    }
    
    return controller;
  };

  // Handle place form input changes
  const handlePlaceInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPlaceFormData(prev => ({
      ...prev,
      [name]: name === 'latitude' || name === 'longitude' ? parseFloat(value) : value
    }));
  };

  // Open add place modal
  const openAddModal = () => {
    setPlaceFormData({
      name: '',
      description: '',
      image_url: '',
      category: '',
      latitude: 0,
      longitude: 0,
    });
    setShowAddModal(true);
  };

  // Open edit place modal
  const openEditModal = (place: Place) => {
    setSelectedPlace(place);
    setPlaceFormData({
      name: place.name,
      description: place.description,
      image_url: place.image_url,
      category: place.category,
      latitude: place.latitude,
      longitude: place.longitude,
    });
    setShowEditModal(true);
  };

  // Open delete confirmation
  const openDeleteConfirm = (place: Place) => {
    setSelectedPlace(place);
    setShowDeleteConfirm(true);
  };

  // Open details view modal
  const openDetailsModal = (place: Place) => {
    setSelectedPlace(place);
    setShowDetailsModal(true);
    // Fetch additional details like reviews if needed
    fetchPlaceDetails(place.place_id);
  };

  // Add new place
  const handleAddPlace = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!placeFormData.name || !placeFormData.latitude || !placeFormData.longitude) {
      toast.error('Name and coordinates are required');
      return;
    }

    try {
      const controller = new AbortController();
      const response = await fetch('http://localhost:3001/api/places', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(placeFormData),
        signal: controller.signal
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Place added successfully!');
        setShowAddModal(false);
        // Refresh places list
        if (showPlacesModal) {
          // Trigger the useEffect that loads places
          setShowPlacesModal(false);
          setTimeout(() => setShowPlacesModal(true), 10);
        }
      } else {
        toast.error(data.message || 'Failed to add place');
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        toast.error('Network error. Please try again.');
      }
    }
  };

  // Update place
  const handleUpdatePlace = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlace || !placeFormData.name || !placeFormData.latitude || !placeFormData.longitude) {
      toast.error('Name and coordinates are required');
      return;
    }

    try {
      const controller = new AbortController();
      const response = await fetch(`http://localhost:3001/api/places/${selectedPlace.place_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(placeFormData),
        signal: controller.signal
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Place updated successfully!');
        setShowEditModal(false);
        // Refresh places list
        if (showPlacesModal) {
          // Trigger the useEffect that loads places
          setShowPlacesModal(false);
          setTimeout(() => setShowPlacesModal(true), 10);
        }
      } else {
        toast.error(data.message || 'Failed to update place');
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        toast.error('Network error. Please try again.');
      }
    }
  };

  // Delete place
  const handleDeletePlace = async () => {
    if (!selectedPlace) return;

    try {
      const controller = new AbortController();
      const response = await fetch(`http://localhost:3001/api/places/${selectedPlace.place_id}`, {
        method: 'DELETE',
        signal: controller.signal
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Place deleted successfully!');
        setShowDeleteConfirm(false);
        // Refresh places list
        if (showPlacesModal) {
          // Trigger the useEffect that loads places
          setShowPlacesModal(false);
          setTimeout(() => setShowPlacesModal(true), 10);
        }
      } else {
        toast.error(data.message || 'Failed to delete place');
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        toast.error('Network error. Please try again.');
      }
    }
  };

  // Handler to switch to signup modal
  const openSignup = (e?: MouseEvent<HTMLSpanElement>) => {
    e?.preventDefault();
    setShowLogin(false);
    setShowSignup(true);
  };
  
  // Handler to switch to login modal
  const openLogin = (e?: MouseEvent<HTMLSpanElement>) => {
    e?.preventDefault();
    setShowSignup(false);
    setShowLogin(true);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle login
  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const controller = new AbortController();
      const response = await fetch('http://localhost:3001/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
        signal: controller.signal
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(data));
        setUser(data);
        setShowLogin(false);
        toast.success('Logged in successfully!');
        // Reset form
        setFormData({ username: '', email: '', password: '' });
      } else {
        toast.error(data.message || 'Login failed');
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        toast.error('Network error. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle registration
  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const controller = new AbortController();
      const response = await fetch('http://localhost:3001/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        }),
        signal: controller.signal
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Registration successful! Please log in.');
        setShowSignup(false);
        setShowLogin(true);
        // Reset form
        setFormData({ username: '', email: '', password: '' });
      } else {
        toast.error(data.message || 'Registration failed');
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        toast.error('Network error. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully!');
  };

  // Function to fetch place reviews
  const fetchPlaceReviews = async (placeId: number) => {
    setIsLoadingReviews(true);
    const controller = new AbortController();
    try {
      const response = await fetch(`http://localhost:3001/api/places/${placeId}`, {
        signal: controller.signal
      });
      const data = await response.json();
      
      if (response.ok) {
        setSelectedPlaceReviews(data.reviews || []);
        
        // If user is logged in, find their review
        if (user) {
          const review = data.reviews?.find((r: Review) => r.user_id === user.user_id) || null;
          setUserReview(review);
        }
      } else {
        toast.error('Failed to fetch reviews');
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error fetching reviews:', error);
        toast.error('Network error. Please try again.');
      }
    } finally {
      setIsLoadingReviews(false);
    }
    
    return controller;
  };

  // When a place is selected, fetch its reviews
  useEffect(() => {
    const controller = new AbortController();
    
    if (selectedPlace && showDetailsModal) {
      const fetchData = async () => {
        try {
          setIsLoadingReviews(true);
          const response = await fetch(`http://localhost:3001/api/places/${selectedPlace.place_id}`, {
            signal: controller.signal
          });
          const data = await response.json();
          
          if (response.ok) {
            setSelectedPlaceReviews(data.reviews || []);
            
            // If user is logged in, find their review
            if (user) {
              const review = data.reviews?.find((r: Review) => r.user_id === user.user_id) || null;
              setUserReview(review);
            }
          } else {
            toast.error('Failed to fetch reviews');
          }
        } catch (error) {
          if (error instanceof Error && error.name !== 'AbortError') {
            console.error('Error fetching reviews:', error);
            toast.error('Network error. Please try again.');
          }
        } finally {
          setIsLoadingReviews(false);
        }
      };
      
      fetchData();
    } else {
      setSelectedPlaceReviews([]);
      setUserReview(null);
    }
    
    return () => {
      controller.abort();
    };
  }, [selectedPlace, showDetailsModal, user]);

  return (
    <main className="flex flex-col h-screen w-full">
      <Toaster position="top-center" />
      
      {/* Header */}
      <header className="z-10 absolute top-0 left-0 right-0 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white text-shadow-sm">Visit Melaka 2025</h1>
          </div>
          
          {/* Login/User Section */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="bg-blue-600 text-white px-4 py-2 rounded-md font-bold">
                  {user.username}
                </span>
                {user.email === 'atan@gmail.com' && (
                  <button 
                    className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-md transition-colors"
                    onClick={() => setShowPlacesModal(true)}
                  >
                    Manage Places
                  </button>
                )}
                <button
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-md transition-colors"
                onClick={() => setShowLogin(true)}
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modal Container */}
      {(showLogin || showSignup) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-opacity-50 backdrop-blur-sm" 
            onClick={() => {
              setShowLogin(false);
              setShowSignup(false);
            }} 
          />

          {/* Login Modal */}
          {showLogin && (
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-auto z-10 flex flex-col items-center">
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl font-bold focus:outline-none"
                onClick={() => setShowLogin(false)}
                aria-label="Close login"
              >
                ×
              </button>
              <h2 className="text-2xl font-bold mb-4 text-blue-900">Login</h2>
              <form className="w-full flex flex-col gap-4" onSubmit={handleLogin}>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Email"
                  className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-black placeholder-gray-400"
                  required
                />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Password"
                  className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-black placeholder-gray-400"
                  required
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-md py-2 mt-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </button>
              </form>
              <p className="text-xs text-gray-500 mt-4">Don&apos;t have an account? <span className="text-blue-700 cursor-pointer hover:underline" onClick={openSignup}>Sign up</span></p>
            </div>
          )}

          {/* Signup Modal */}
          {showSignup && (
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-auto z-10 flex flex-col items-center">
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl font-bold focus:outline-none"
                onClick={() => setShowSignup(false)}
                aria-label="Close signup"
              >
                ×
              </button>
              <h2 className="text-2xl font-bold mb-4 text-blue-900">Sign Up</h2>
              <form className="w-full flex flex-col gap-4" onSubmit={handleSignup}>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Username"
                  className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-black placeholder-gray-400"
                  required
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Email"
                  className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-black placeholder-gray-400"
                  required
                />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Password"
                  className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-black placeholder-gray-400"
                  required
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-md py-2 mt-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Signing up...' : 'Sign Up'}
                </button>
              </form>
              <p className="text-xs text-gray-500 mt-4">Already have an account? <span className="text-blue-700 cursor-pointer hover:underline" onClick={openLogin}>Login</span></p>
            </div>
          )}
        </div>
      )}

      {/* Places Management Modal */}
      {showPlacesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={() => setShowPlacesModal(false)}
          />
          <div className="relative bg-white rounded-lg w-full max-w-6xl mx-4 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl font-bold"
              onClick={() => setShowPlacesModal(false)}
            >
              ×
            </button>
            
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Manage Places</h2>
              <button 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
                onClick={openAddModal}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add New Place
              </button>
            </div>
            
            {/* Places List */}
            {isLoadingPlaces ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : places.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-600">No places found. Add your first place.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {places.map((place) => (
                  <div key={place.place_id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                    <div className="h-40 bg-gray-200 relative">
                      {place.image_url ? (
                        <img 
                          src={place.image_url} 
                          alt={place.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <span className="text-gray-400">No Image</span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded text-xs font-medium">
                        {place.category || 'Uncategorized'}
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{place.name}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{place.description}</p>
                      
                      <div className="flex items-center mb-3">
                        <div className="flex items-center text-yellow-500 mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-sm font-medium">{place.avg_rating ? place.avg_rating.toFixed(1) : '0'}</span>
                        </div>
                        <span className="text-xs text-gray-500">({place.review_count || 0} reviews)</span>
                      </div>
                      
                      <div className="flex justify-end space-x-2 mt-2">
                        <button 
                          className="text-gray-600 hover:text-green-600 p-1"
                          onClick={() => openDetailsModal(place)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button 
                          className="text-gray-600 hover:text-blue-600 p-1"
                          onClick={() => openEditModal(place)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          className="text-gray-600 hover:text-red-600 p-1"
                          onClick={() => openDeleteConfirm(place)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Place Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          />
          <div className="relative bg-white rounded-lg w-full max-w-xl mx-4 p-6 shadow-xl">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl font-bold"
              onClick={() => setShowAddModal(false)}
            >
              ×
            </button>
            <h2 className="text-2xl font-semibold mb-4">Add New Place</h2>
            <form onSubmit={handleAddPlace} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name*</label>
                <input
                  type="text"
                  name="name"
                  value={placeFormData.name || ''}
                  onChange={handlePlaceInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={placeFormData.description || ''}
                  onChange={handlePlaceInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input
                    type="text"
                    name="image_url"
                    value={placeFormData.image_url || ''}
                    onChange={handlePlaceInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    name="category"
                    value={placeFormData.category || ''}
                    onChange={handlePlaceInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude*</label>
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={placeFormData.latitude || 0}
                    onChange={handlePlaceInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude*</label>
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={placeFormData.longitude || 0}
                    onChange={handlePlaceInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Place
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Place Modal */}
      {showEditModal && selectedPlace && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={() => setShowEditModal(false)}
          />
          <div className="relative bg-white rounded-lg w-full max-w-xl mx-4 p-6 shadow-xl">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl font-bold"
              onClick={() => setShowEditModal(false)}
            >
              ×
            </button>
            <h2 className="text-2xl font-semibold mb-4">Edit Place</h2>
            <form onSubmit={handleUpdatePlace} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name*</label>
                <input
                  type="text"
                  name="name"
                  value={placeFormData.name || ''}
                  onChange={handlePlaceInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={placeFormData.description || ''}
                  onChange={handlePlaceInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input
                    type="text"
                    name="image_url"
                    value={placeFormData.image_url || ''}
                    onChange={handlePlaceInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    name="category"
                    value={placeFormData.category || ''}
                    onChange={handlePlaceInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude*</label>
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={placeFormData.latitude || 0}
                    onChange={handlePlaceInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude*</label>
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={placeFormData.longitude || 0}
                    onChange={handlePlaceInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Update Place
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedPlace && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative bg-white rounded-lg w-full max-w-md mx-4 p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-4">Confirm Deletion</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-medium">{selectedPlace.name}</span>? This action cannot be undone and will also remove all associated ratings and reviews.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                onClick={handleDeletePlace}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Place Details Modal */}
      {showDetailsModal && selectedPlace && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={() => setShowDetailsModal(false)}
          />
          <div className="relative bg-white rounded-lg w-full max-w-4xl mx-4 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl font-bold"
              onClick={() => setShowDetailsModal(false)}
            >
              ×
            </button>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Image Section */}
              <div className="w-full md:w-2/5 bg-gray-100 rounded-lg">
                {selectedPlace.image_url ? (
                  <img 
                    src={selectedPlace.image_url} 
                    alt={selectedPlace.name} 
                    className="w-full h-64 md:h-full object-cover rounded-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://via.placeholder.com/600x400?text=No+Image';
                    }}
                  />
                ) : (
                  <div className="w-full h-64 md:h-full min-h-[300px] flex items-center justify-center bg-gray-100 rounded-lg">
                    <span className="text-gray-400">No Image</span>
                  </div>
                )}
              </div>
              
              {/* Details Section */}
              <div className="w-full md:w-3/5">
                <div className="flex justify-between items-start">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedPlace.name}</h2>
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    {selectedPlace.category || 'Uncategorized'}
                  </span>
                </div>
                
                <div className="flex items-center mt-2 mb-4">
                  <div className="flex items-center text-yellow-500 mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm font-medium">{selectedPlace.avg_rating ? selectedPlace.avg_rating.toFixed(1) : '0'}</span>
                  </div>
                  <span className="text-xs text-gray-500">({selectedPlace.review_count || 0} reviews)</span>
                </div>
                
                <div className="border-t border-gray-200 my-4 pt-4">
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-gray-600 mb-4">{selectedPlace.description || 'No description available.'}</p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-md mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">Location</h3>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{selectedPlace.latitude.toFixed(6)}, {selectedPlace.longitude.toFixed(6)}</span>
                  </div>
                </div>
                
                {/* Reviews Section */}
                <div className="mt-4 pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center">
                      <h3 className="text-lg font-bold mr-2">User Reviews</h3>
                      <div className="flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                        <span className="font-medium mr-1">{selectedPlace.avg_rating ? selectedPlace.avg_rating.toFixed(1) : '0'}</span>
                        <span>({selectedPlace.review_count || 0} reviews)</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Login prompt for non-logged in users */}
                  {!user && (
                    <div className="mt-4 mb-6">
                      <button
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                        onClick={() => {
                          setShowDetailsModal(false);
                          setShowLogin(true);
                        }}
                      >
                        Leave a Review
                      </button>
                    </div>
                  )}
                  
                  {/* Add Review Form for logged-in users */}
                  {user && (
                    <ReviewForm 
                      placeId={selectedPlace.place_id}
                      userId={user.user_id}
                      onReviewSubmitted={() => fetchPlaceReviews(selectedPlace.place_id)}
                      existingReview={userReview ? {
                        stars: userReview.stars,
                        comment: userReview.comment
                      } : undefined}
                    />
                  )}
                  
                  {/* Reviews List */}
                  {isLoadingReviews ? (
                    <div className="flex justify-center p-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : selectedPlaceReviews.length > 0 ? (
                    <div className="max-h-[400px] overflow-y-auto pr-1">
                      {selectedPlaceReviews.map((review) => (
                        <ReviewCard key={review.rating_id} review={review} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-500">No reviews yet. Be the first to leave a review!</p>
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    onClick={() => setShowDetailsModal(false)}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    onClick={() => {
                      setShowDetailsModal(false);
                      openEditModal(selectedPlace);
                    }}
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Container - fills all remaining space */}
      <div className="flex-1 w-full">
        <Map />
      </div>
    </main>
  );
}