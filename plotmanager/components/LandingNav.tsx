'use client'

import { useState } from 'react'
import { MapPin, Menu, X } from 'lucide-react'
import Link from 'next/link'

export function LandingNav({ companyName }: { companyName: string }) {
  const [open, setOpen] = useState(false)

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-gray-900">{companyName}</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden sm:flex items-center gap-4">
            <a href="#estates" className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors">
              Estates
            </a>
            <a href="#contact" className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors">
              Contact
            </a>
            <Link
              href="/login"
              className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              Admin
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(!open)}
            className="sm:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="sm:hidden border-t border-gray-100 bg-white animate-slide-down">
          <div className="px-4 py-3 space-y-1">
            <a
              href="#estates"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors"
            >
              Estates
            </a>
            <a
              href="#contact"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors"
            >
              Contact
            </a>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
