'use client';

import { useState } from 'react';
import Map from '@/components/map';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <main className="flex flex-col h-screen w-full">
      {/* Header */}
      <header className="z-10 absolute top-0 left-0 right-0 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white text-shadow-sm">Visit Melaka 2025</h1>
          </div>
          
          {/* Login Section */}
          <div className="flex items-center gap-4">
            <button
              className="text-gray-900 hover:text-blue-700 transition-colors font-medium"
              onClick={() => {/* Add login handler here */}}
            >
              Login
            </button>
            <button
              className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-md transition-colors"
              onClick={() => {/* Add signup handler here */}}
            >
              Sign Up
            </button>
          </div>
        </div>
      </header>

      {/* Map Container - fills all remaining space */}
      <div className="flex-1 w-full">
        <Map />
      </div>
    </main>
  );
}