"use client"

import { useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Building2, Menu, X, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Rooms', href: '/rooms' },
  { name: 'Gallery', href: '/gallery' },
  { name: 'Contact', href: '/contact' },
]

export default function StickyHeader() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const { data: session } = useSession()
  const { scrollY } = useScroll()
  
  const headerBackground = useTransform(
    scrollY,
    [0, 100],
    ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.95)']
  )
  
  const headerShadow = useTransform(
    scrollY,
    [0, 100],
    ['0 0 0 rgba(0, 0, 0, 0)', '0 4px 20px rgba(0, 0, 0, 0.1)']
  )

  const progressWidth = useTransform(
    scrollY,
    [0, document.documentElement.scrollHeight - window.innerHeight],
    ['0%', '100%']
  )

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-primary-600 z-50 origin-left"
        style={{ scaleX: progressWidth }}
      />

      {/* Sticky Header */}
      <motion.header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled ? 'py-2' : 'py-4'
        }`}
        style={{
          backgroundColor: headerBackground,
          boxShadow: headerShadow,
        }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.div
              className="flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href="/" className="flex items-center space-x-2">
                <Building2 className={`w-8 h-8 ${isScrolled ? 'text-primary-600' : 'text-white'}`} />
                <span className={`text-xl font-bold ${isScrolled ? 'text-gray-900' : 'text-white'}`}>
                  SmartHotel
                </span>
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                <motion.div
                  key={item.name}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href={item.href}
                    className={`font-medium transition-colors ${
                      isScrolled 
                        ? 'text-gray-700 hover:text-primary-600' 
                        : 'text-white hover:text-gray-200'
                    }`}
                  >
                    {item.name}
                  </Link>
                </motion.div>
              ))}
            </nav>

            {/* Right side controls */}
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`p-2 rounded-full transition-colors ${
                  isScrolled 
                    ? 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700' 
                    : 'bg-white/20 hover:bg-white/30'
                }`}
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600" />
                )}
              </motion.button>

              {/* Auth Buttons */}
              {session ? (
                <div className="hidden sm:flex items-center space-x-2">
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className={isScrolled ? '' : 'border-white text-white hover:bg-white hover:text-gray-900'}
                    >
                      <Link href="/my-bookings">My Bookings</Link>
                    </Button>
                  </motion.div>
                  {session.user.roleName !== 'GUEST' && (
                    <motion.div whileHover={{ scale: 1.05 }}>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className={isScrolled ? '' : 'border-white text-white hover:bg-white hover:text-gray-900'}
                      >
                        <Link href="/admin">Admin Panel</Link>
                      </Button>
                    </motion.div>
                  )}
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => signOut()}
                      className={isScrolled ? '' : 'border-white text-white hover:bg-white hover:text-gray-900'}
                    >
                      Sign Out
                    </Button>
                  </motion.div>
                </div>
              ) : (
                <div className="hidden sm:flex items-center space-x-2">
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className={isScrolled ? '' : 'border-white text-white hover:bg-white hover:text-gray-900'}
                    >
                      <Link href="/auth/signin">Sign In</Link>
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Button 
                      size="sm"
                      className={isScrolled ? 'btn-primary' : 'btn-luxury'}
                    >
                      <Link href="/booking">Book Now</Link>
                    </Button>
                  </motion.div>
                </div>
              )}

              {/* Mobile menu button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`md:hidden p-2 rounded-full transition-colors ${
                  isScrolled 
                    ? 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700' 
                    : 'bg-white/20 hover:bg-white/30'
                }`}
              >
                {isMenuOpen ? (
                  <X className={`w-5 h-5 ${isScrolled ? 'text-gray-600' : 'text-white'}`} />
                ) : (
                  <Menu className={`w-5 h-5 ${isScrolled ? 'text-gray-600' : 'text-white'}`} />
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <motion.div
          className="md:hidden"
          initial={false}
          animate={isMenuOpen ? 'open' : 'closed'}
          variants={{
            open: { opacity: 1, height: 'auto' },
            closed: { opacity: 0, height: 0 }
          }}
          transition={{ duration: 0.3 }}
        >
          <div className={`px-4 py-4 space-y-2 ${isScrolled ? 'bg-white dark:bg-gray-900' : 'bg-black/90'}`}>
            {navigation.map((item) => (
              <motion.div
                key={item.name}
                whileHover={{ x: 10 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href={item.href}
                  className={`block py-2 font-medium transition-colors ${
                    isScrolled 
                      ? 'text-gray-700 hover:text-primary-600' 
                      : 'text-white hover:text-gray-200'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              </motion.div>
            ))}
            
            {/* Mobile Auth */}
            {session ? (
              <div className="pt-4 space-y-2 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" size="sm" className="w-full">
                  <Link href="/my-bookings">My Bookings</Link>
                </Button>
                {session.user.roleName !== 'GUEST' && (
                  <Button variant="outline" size="sm" className="w-full">
                    <Link href="/admin">Admin Panel</Link>
                  </Button>
                )}
                <Button variant="outline" size="sm" className="w-full" onClick={() => signOut()}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="pt-4 space-y-2 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" size="sm" className="w-full">
                  <Link href="/auth/signin">Sign In</Link>
                </Button>
                <Button size="sm" className="w-full btn-primary">
                  <Link href="/booking">Book Now</Link>
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.header>
    </>
  )
} 