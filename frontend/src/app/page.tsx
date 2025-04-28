'use client';

import { useState } from 'react';
import Map from '@/components/map';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <main className="flex flex-col h-screen w-full">
      {/* Header */}
      <header className="bg-white shadow-sm z-10 border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Visit Melaka 2025</h1>
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