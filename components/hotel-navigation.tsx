'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Menu, X, Phone, Mail, MapPin, LogOut, User } from 'lucide-react'

interface NavigationContact {
  name: string
  email: string
  phone: string
  address: string
  tagline: string
}

const defaultContact: NavigationContact = {
  name: 'SmartHotel Grand Palace',
  email: 'info@smarthotel.com',
  phone: '+1 (800) 555-HOTEL',
  address: '123 Grand Boulevard, City Center, Metropolitan Area, ST 10001',
  tagline: 'Luxury 5-Star Accommodation',
}

export default function HotelNavigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [contactInfo, setContactInfo] = useState<NavigationContact>(defaultContact)
  const { data: session } = useSession()

  useEffect(() => {
    let isMounted = true

    async function loadContactInfo() {
      try {
        const response = await fetch('/api/settings/contact')
        if (!response.ok) return
        const data = await response.json()
        if (isMounted) {
          setContactInfo({
            name: data.name ?? defaultContact.name,
            email: data.email ?? defaultContact.email,
            phone: data.phone ?? defaultContact.phone,
            address: data.address ?? defaultContact.address,
            tagline: data.tagline ?? defaultContact.tagline,
          })
        }
      } catch (error) {
        console.error('Failed to load contact info for navigation:', error)
      }
    }

    loadContactInfo()

    return () => {
      isMounted = false
    }
  }, [])

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Rooms', href: '/rooms' },
    { name: 'Restaurant', href: '/order' },
    { name: 'Gallery', href: '/gallery' },
    { name: 'Contact', href: '/contact' },
  ]

  return (
    <header role="banner" className="bg-white shadow-sm">
      {/* Top Bar */}
      <div className="bg-amber-800 text-white py-2">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center text-sm">
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-2 sm:mb-0">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>{contactInfo.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>{contactInfo.email}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{contactInfo.address}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="bg-white shadow-lg sticky top-0 z-50" aria-label="Primary navigation">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">GP</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{contactInfo.name}</h1>
                <p className="text-sm text-gray-600">{contactInfo.tagline}</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-700 hover:text-amber-600 font-medium transition-colors"
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Authentication & Actions */}
              {session?.user ? (
                <>
                  <Link
                    href="/my-bookings"
                    className="text-gray-700 hover:text-amber-600 font-medium transition-colors"
                  >
                    My Bookings
                  </Link>
                  {session.user.role && session.user.role !== 'GUEST' && (
                    <Link
                      href="/admin"
                      className="text-gray-700 hover:text-amber-600 font-medium transition-colors"
                    >
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={() => signOut()}
                    className="text-gray-700 hover:text-amber-600 font-medium transition-colors flex items-center gap-1"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/signin"
                  className="text-gray-700 hover:text-amber-600 font-medium transition-colors"
                >
                  Sign In
                </Link>
              )}
              
              <Link
                href="/booking"
                className="bg-amber-800 hover:bg-amber-900 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Book Now
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 hover:text-amber-600"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
              data-testid="mobile-menu-toggle"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200" data-testid="mobile-menu">
              <div className="flex flex-col space-y-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-gray-700 hover:text-amber-600 font-medium transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                
                {/* Mobile Authentication */}
                {session?.user ? (
                  <>
                    <Link
                      href="/my-bookings"
                      className="text-gray-700 hover:text-amber-600 font-medium transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Bookings
                    </Link>
                    {session.user.role && session.user.role !== 'GUEST' && (
                      <Link
                        href="/admin"
                        className="text-gray-700 hover:text-amber-600 font-medium transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Admin
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        signOut()
                        setIsMenuOpen(false)
                      }}
                      className="text-gray-700 hover:text-amber-600 font-medium transition-colors flex items-center gap-2 text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    href="/auth/signin"
                    className="text-gray-700 hover:text-amber-600 font-medium transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                )}
                
                <Link
                  href="/booking"
                  className="bg-amber-700 hover:bg-amber-800 text-white px-6 py-2 rounded-lg font-medium transition-colors text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Book Now
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}
