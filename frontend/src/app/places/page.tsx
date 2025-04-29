'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';

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

interface User {
  user_id: number;
  username: string;
  email: string;
  success: boolean;
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

export default function PlacesPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [formData, setFormData] = useState<Partial<Place>>({
    name: '',
    description: '',
    image_url: '',
    category: '',
    latitude: 0,
    longitude: 0,
  });
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

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

  // Check for existing user session on component mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('user');
        router.push('/');
      }
    } else {
      router.push('/');
    }
  }, [router]);

  // Fetch places on component mount
  useEffect(() => {
    fetchPlaces();
  }, []);

  // Fetch places from API
  const fetchPlaces = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/places');
      const data = await response.json();
      
      if (response.ok) {
        setPlaces(data.places);
      } else {
        toast.error('Failed to fetch places');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch place details including reviews
  const fetchPlaceDetails = async (placeId: number) => {
    try {
      const response = await fetch(`http://localhost:3001/api/places/${placeId}`);
      const data = await response.json();
      
      if (response.ok) {
        setSelectedPlace(data);
      } else {
        toast.error('Failed to fetch place details');
      }
    } catch {
      toast.error('Network error. Please try again.');
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'latitude' || name === 'longitude' ? parseFloat(value) : value
    }));
  };

  // Open add modal
  const openAddModal = () => {
    setFormData({
      name: '',
      description: '',
      image_url: '',
      category: '',
      latitude: 0,
      longitude: 0,
    });
    setShowAddModal(true);
  };

  // Open edit modal
  const openEditModal = (place: Place) => {
    setSelectedPlace(place);
    setFormData({
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
    
    if (!formData.name || !formData.latitude || !formData.longitude) {
      toast.error('Name and coordinates are required');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/places', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Place added successfully!');
        setShowAddModal(false);
        fetchPlaces();
      } else {
        toast.error(data.message || 'Failed to add place');
      }
    } catch {
      toast.error('Network error. Please try again.');
    }
  };

  // Update place
  const handleUpdatePlace = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlace || !formData.name || !formData.latitude || !formData.longitude) {
      toast.error('Name and coordinates are required');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/places/${selectedPlace.place_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Place updated successfully!');
        setShowEditModal(false);
        fetchPlaces();
      } else {
        toast.error(data.message || 'Failed to update place');
      }
    } catch {
      toast.error('Network error. Please try again.');
    }
  };

  // Delete place
  const handleDeletePlace = async () => {
    if (!selectedPlace) return;

    try {
      const response = await fetch(`http://localhost:3001/api/places/${selectedPlace.place_id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Place deleted successfully!');
        setShowDeleteConfirm(false);
        fetchPlaces();
      } else {
        toast.error(data.message || 'Failed to delete place');
      }
    } catch {
      toast.error('Network error. Please try again.');
    }
  };

  if (!user) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-8">
      <Toaster position="top-center" />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Places</h1>
          <p className="text-gray-600 mt-1">Add, edit, or remove tourist attractions and places in Melaka</p>
        </div>
        
        <div className="mt-4 md:mt-0">
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
      </div>

      {/* Places Grid/List */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : places.length === 0 ? (
        <div className="text-center p-12 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-medium text-gray-600">No places found</h3>
          <p className="text-gray-500 mt-2">Add your first place to get started</p>
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
                
                <div className="flex items-center text-xs text-gray-500 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{place.latitude.toFixed(6)}, {place.longitude.toFixed(6)}</span>
                </div>
                
                <div className="flex justify-end space-x-2 mt-2">
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
                  <button 
                    className="text-gray-600 hover:text-green-600 p-1"
                    onClick={() => openDetailsModal(place)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Place Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
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
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
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
                    value={formData.image_url || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    name="category"
                    value={formData.category || ''}
                    onChange={handleInputChange}
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
                    value={formData.latitude || 0}
                    onChange={handleInputChange}
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
                    value={formData.longitude || 0}
                    onChange={handleInputChange}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
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
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
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
                    value={formData.image_url || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    name="category"
                    value={formData.category || ''}
                    onChange={handleInputChange}
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
                    value={formData.latitude || 0}
                    onChange={handleInputChange}
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
                    value={formData.longitude || 0}
                    onChange={handleInputChange}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
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
                
                {/* Reviews Section - Only show if we have reviews */}
                {'reviews' in selectedPlace && selectedPlace.reviews && selectedPlace.reviews.length > 0 && (
                  <div className="border-t border-gray-200 my-4 pt-4">
                    <h3 className="text-lg font-semibold mb-3">Reviews</h3>
                    <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                      {selectedPlace.reviews.map((review: Review) => (
                        <div key={review.rating_id} className="bg-gray-50 p-3 rounded-md">
                          <div className="flex justify-between">
                            <span className="font-medium">{review.username}</span>
                            <div className="flex items-center">
                              {Array(5).fill(0).map((_, i) => (
                                <svg 
                                  key={i}
                                  className={`h-4 w-4 ${i < review.stars ? 'text-yellow-500' : 'text-gray-300'}`}
                                  xmlns="http://www.w3.org/2000/svg" 
                                  viewBox="0 0 20 20" 
                                  fill="currentColor"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{review.comment || 'No comment'}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(review.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
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

      {/* Back Button */}
      <div className="mt-8">
        <button
          className="flex items-center text-blue-600 hover:text-blue-800"
          onClick={() => router.push('/')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Map
        </button>
      </div>
    </main>
  );
} 