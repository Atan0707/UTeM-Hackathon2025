'use client';

import { useState, FormEvent, MouseEvent } from 'react';
import Map from '@/components/map';
import { toast, Toaster } from 'react-hot-toast';

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

  // Check for existing user session on component mount
  useState(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('user');
      }
    }
  });

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
      const response = await fetch('http://localhost:18080/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
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
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle registration
  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:18080/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        })
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
    } catch {
      toast.error('Network error. Please try again.');
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
                <span className="text-white font-semibold">Hi, {user.username}</span>
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

      {/* Map Container - fills all remaining space */}
      <div className="flex-1 w-full">
        <Map />
      </div>
    </main>
  );
}