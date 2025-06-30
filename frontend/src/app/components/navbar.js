'use client';
import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-gray-900 text-white px-6 py-4">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold">
          DisasterApp
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex space-x-6">
          <Link href="/" className="hover:text-blue-400">Disasters</Link>
          {/* <Link href="/reports" className="hover:text-blue-400">Reports</Link> */}
          <Link href="/resources" className="hover:text-blue-400">Resources</Link>
          <Link href="/social-media" className="hover:text-blue-400">Social Media</Link>
          <Link href="/updates" className="hover:text-blue-400">Updates</Link>
          <Link href="/verify" className="hover:text-blue-400">Verify</Link>
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)} className="text-xl focus:outline-none">
            ☰
          </button>
        </div>
      </div>

      {/* Mobile Slide-In Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-2/3 sm:w-1/3 bg-gray-800 text-white transform transition-transform duration-300 ease-in-out z-50
        ${isOpen ? 'translate-x-0' : 'translate-x-full'} md:hidden`}
      >
        <div className="flex justify-end p-4">
          <button onClick={() => setIsOpen(false)} className="text-2xl">×</button>
        </div>
        <div className="flex flex-col items-end space-y-6 p-6">
          <Link href="/disasters" className="hover:text-blue-400" onClick={() => setIsOpen(false)}>Disasters</Link>
          {/* <Link href="/reports" className="hover:text-blue-400" onClick={() => setIsOpen(false)}>Reports</Link> */}
          <Link href="/resources" className="hover:text-blue-400" onClick={() => setIsOpen(false)}>Resources</Link>
          <Link href="/social-media" className="hover:text-blue-400" onClick={() => setIsOpen(false)}>Social Media</Link>
          <Link href="/updates" className="hover:text-blue-400" onClick={() => setIsOpen(false)}>Updates</Link>
          <Link href="/verify" className="hover:text-blue-400" onClick={() => setIsOpen(false)}>Verify</Link>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </nav>
  );
}

