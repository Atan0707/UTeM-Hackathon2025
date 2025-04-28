'use client';

import { useState } from 'react';
import Map from '@/components/map';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">UTeM Campus Map</h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 text-white px-4 py-1 rounded-md hover:bg-blue-600">
              Search
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <Map />
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-gray-900">Find Building</h3>
            <p className="text-sm text-gray-500">Locate specific buildings on campus</p>
          </button>
          <button className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-gray-900">Parking Areas</h3>
            <p className="text-sm text-gray-500">View available parking spaces</p>
          </button>
          <button className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-gray-900">Emergency</h3>
            <p className="text-sm text-gray-500">Locate emergency services</p>
          </button>
        </div>
      </div>
    </main>
  );
}