'use client';

import { useState } from 'react';
import Map from '@/components/map';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <main className="flex flex-col h-screen w-full">
      {/* Header */}
      <header className="bg-white shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight font-sans">Visit Melaka 2025</h1>
          
          <div className="items-center justify-between md:flex md:w-auto" id="navbar-cta">
            <ul className="flex flex-col font-medium p-4 md:p-0 mt-4 md:mt-0 md:flex-row md:space-x-8 rtl:space-x-reverse">
              <li>
                <a href="#" className="block py-2 px-3 md:p-0 text-blue-700 font-medium" aria-current="page">Home</a>
              </li>
              <li>
                <a href="#" className="block py-2 px-3 md:p-0 text-gray-900 hover:text-blue-700 transition-colors">About</a>
              </li>
            </ul>
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