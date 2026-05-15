'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { Menu, X, Phone, Mail, MapPin, LogOut, User, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  const [scrolled, setScrolled] = useState(false)
  const [contactInfo, setContactInfo] = useState<NavigationContact>(defaultContact)
  const [navigation, setNavigation] = useState([
    { name: 'Home', href: '/' },
    { name: 'Rooms', href: '/rooms' },
    { name: 'Gallery', href: '/gallery' },
    { name: 'Facilities', href: '/facilities' },
    { name: 'Contact', href: '/contact' },
  ])
  const { data: session } = useSession()
  const pathname = usePathname()

  // Hide navigation on dashboard/admin routes
  const isDashboardRoute = pathname?.startsWith('/dashboard') || 
                          pathname?.startsWith('/admin') || 
                          pathname?.startsWith('/kitchen') ||
                          pathname?.startsWith('/profile') ||
                          pathname?.startsWith('/my-bookings')

  const getDashboardUrl = () => {
    if (!session?.user) return '/auth/signin'
    const role = session.user.role
    if (role === 'SUPER_ADMIN' || role === 'MANAGER') return '/admin/dashboard'
    if (role === 'RECEPTIONIST') return '/admin/bookings'
    if (role === 'KITCHEN') return '/kitchen/dashboard'
    if (role === 'HOUSEKEEPING') return '/admin/tasks'
    return '/dashboard'
  }

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadData() {
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

      try {
        const navResponse = await fetch('/api/navigation')
        if (!navResponse.ok) return
        const navData = await navResponse.json()
        const links = Array.isArray(navData) ? navData : (navData.items || [])
        if (isMounted && links.length > 0) {
          setNavigation(links.map((link: any) => ({ name: link.name, href: link.href })))
        }
      } catch (error) {
        console.error('Failed to load navigation:', error)
      }
    }

    loadData()
    return () => { isMounted = false }
  }, [])

  if (isDashboardRoute) return null

  return (
    <header
      role="banner"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-black/60 backdrop-blur-xl border-b border-white/5 shadow-2xl py-2' : 'bg-transparent py-4'
        }`}
    >
      {/* Top Bar - Hidden on scroll for cleaner look */}
      {!scrolled && (
        <div className="border-b border-white/10 text-white/70 py-2 hidden lg:block">
          <div className="max-w-7xl mx-auto px-4 flex justify-between items-center text-xs tracking-widest uppercase">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 hover:text-luxury transition-colors">
                <Phone className="w-3 h-3" />
                <span>{contactInfo.phone}</span>
              </div>
              <div className="flex items-center gap-2 hover:text-luxury transition-colors">
                <Mail className="w-3 h-3" />
                <span>{contactInfo.email}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 hover:text-luxury transition-colors">
              <MapPin className="w-3 h-3" />
              <span>{contactInfo.address}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="max-w-7xl mx-auto px-4" aria-label="Primary navigation">
        <div className="flex justify-between items-center h-20 gap-8">
          {/* Logo */}
          <Link href="/" className="group flex items-center space-x-4 flex-shrink-0">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="absolute inset-0 bg-gold-gradient rounded-full rotate-45 group-hover:rotate-180 transition-transform duration-700" />
              <span className="relative text-white font-serif font-bold text-xl">GP</span>
            </div>
            <div className="hidden sm:block">
              <div className="text-xl lg:text-2xl font-serif font-bold text-white tracking-tight">
                {contactInfo.name.split(' ')[0]} <span className="text-luxury">{contactInfo.name.split(' ').slice(1).join(' ')}</span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm font-medium tracking-wide transition-all duration-300 hover:text-luxury ${pathname === item.href ? 'text-luxury' : 'text-white'
                  }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden lg:flex items-center space-x-6">
            {session?.user ? (
              <div className="flex items-center space-x-4">
                <Link href="/my-bookings" className="text-white hover:text-luxury transition-colors">
                  <ShoppingBag className="w-5 h-5" />
                </Link>
                <div className="h-4 w-px bg-white/20" />
                <Link
                  href={getDashboardUrl()}
                  className="text-white/80 hover:text-white transition-colors flex items-center gap-2 text-sm"
                >
                  <User className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="text-white hover:text-luxury transition-colors text-sm font-medium"
              >
                Sign In
              </Link>
            )}

            <Link href="/booking">
              <Button className="bg-gold-gradient hover:opacity-90 text-white px-8 rounded-none border-none font-serif tracking-widest uppercase text-xs h-12 transition-all hover:scale-105 active:scale-95 shadow-luxury">
                Book Your Stay
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 rounded-md text-white hover:text-luxury transition-colors"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            data-testid="mobile-menu-toggle"
          >
            {isMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div
            data-testid="mobile-menu"
            className="lg:hidden fixed inset-0 top-20 bg-midnight/98 backdrop-blur-2xl p-8 z-50 animate-fade-in"
          >
            <div className="flex flex-col space-y-8 text-center">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-2xl font-serif text-white hover:text-luxury"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              <div className="h-px bg-white/10 w-24 mx-auto" />

              {session?.user ? (
                <>
                  <Link
                    href="/my-bookings"
                    className="text-xl text-white/80"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Bookings
                  </Link>
                  <Link
                    href={getDashboardUrl()}
                    onClick={() => setIsMenuOpen(false)}
                    className="text-xl text-white/80 hover:text-luxury"
                  >
                    Dashboard
                  </Link>
                </>
              ) : (
                <Link
                  href="/auth/signin"
                  className="text-xl text-white/80"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
              )}

              <Link href="/booking" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full bg-gold-gradient text-white py-8 text-lg font-serif">
                  Book Now
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
