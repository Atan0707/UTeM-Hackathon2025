'use client';

import { useState } from 'react';
import Map from '@/components/map';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <main className="flex flex-col h-screen w-full">
      {/* Header */}
      <header className="bg-white shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Visit Melaka 2025</h1>
        </div>
      </header>

      {/* Map Container - fills all remaining space */}
      <div className="flex-1 w-full">
        <Map />
      </div>
    </main>
  );
}