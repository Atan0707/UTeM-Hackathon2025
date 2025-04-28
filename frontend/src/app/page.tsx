'use client';

import { useState } from 'react';
import Map from '@/components/map';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  // Handler to switch to signup modal
  const openSignup = () => {
    setShowLogin(false);
    setShowSignup(true);
  };
  // Handler to switch to login modal
  const openLogin = () => {
    setShowSignup(false);
    setShowLogin(true);
  };

  return (
    <main className="flex flex-col h-screen w-full">
      {/* Header */}
      <header className="z-10 absolute top-0 left-0 right-0 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-900 via-blue-500 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg tracking-wide font-sans transition-all duration-300">Visit Melaka 2025</h1>
          </div>
          
          {/* Login Section */}
          <div className="flex items-center gap-4">
            <button
              className="px-6 py-2 rounded-full bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-400 text-white font-semibold shadow-lg hover:scale-105 hover:from-blue-800 hover:to-cyan-500 transition-all duration-200 border-2 border-white/30 focus:outline-none"
              onClick={() => setShowLogin(true)}
            >
              <span className="drop-shadow-sm tracking-wide">Login</span>
            </button>
          </div>
        </div>
      </header>

      {/* Login Modal Popup */}
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Blurry Overlay */}
          <div className="absolute inset-0 bg-opacity-30 backdrop-blur-md transition-opacity" onClick={() => setShowLogin(false)} />
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-auto z-10 flex flex-col items-center animate-fadeIn">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl font-bold focus:outline-none"
              onClick={() => setShowLogin(false)}
              aria-label="Close login"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold mb-4 text-blue-900">Login</h2>
            <form className="w-full flex flex-col gap-4">
              <input
                type="email"
                placeholder="Email"
                className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-black placeholder-gray-400"
                required
              />
              <input
                type="password"
                placeholder="Password"
                className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-black placeholder-gray-400"
                required
              />
              <button
                type="submit"
                className="bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-md py-2 mt-2 transition-colors"
              >
                Login
              </button>
            </form>
            <p className="text-xs text-gray-500 mt-4">Don't have an account? <span className="text-blue-700 cursor-pointer hover:underline" onClick={openSignup}>Sign up</span></p>
          </div>
        </div>
      )}

      {/* Signup Modal Popup */}
      {showSignup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Blurry Overlay */}
          <div className="absolute inset-0 bg-opacity-30 backdrop-blur-md transition-opacity" onClick={() => setShowSignup(false)} />
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-auto z-10 flex flex-col items-center animate-fadeIn">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl font-bold focus:outline-none"
              onClick={() => setShowSignup(false)}
              aria-label="Close signup"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold mb-4 text-blue-900">Sign Up</h2>
            <form className="w-full flex flex-col gap-4">
              <input
                type="text"
                placeholder="Username"
                className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-black placeholder-gray-400"
                required
              />
              <input
                type="email"
                placeholder="Email"
                className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-black placeholder-gray-400"
                required
              />
              <input
                type="password"
                placeholder="Password"
                className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-black placeholder-gray-400"
                required
              />
              <button
                type="submit"
                className="bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-md py-2 mt-2 transition-colors"
              >
                Sign Up
              </button>
            </form>
            <p className="text-xs text-gray-500 mt-4">Already have an account? <span className="text-blue-700 cursor-pointer hover:underline" onClick={openLogin}>Login</span></p>
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