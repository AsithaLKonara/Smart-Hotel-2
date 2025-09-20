"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useRef, useEffect } from "react"
import { Search, Calendar, Users, MapPin, Filter, X } from "lucide-react"
import { PremiumButton } from "./premium-button"
import { cn } from "@/lib/utils"

interface SearchFilters {
  location: string
  checkIn: Date | null
  checkOut: Date | null
  guests: number
  roomType: string
  amenities: string[]
}

interface SearchSuggestion {
  id: string
  title: string
  subtitle: string
  type: 'location' | 'recent' | 'popular'
}

interface PremiumSearchProps {
  onSearch: (filters: SearchFilters) => void
  loading?: boolean
  suggestions?: SearchSuggestion[]
  className?: string
}

export function PremiumSearch({ 
  onSearch, 
  loading = false, 
  suggestions = [],
  className 
}: PremiumSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    location: '',
    checkIn: null,
    checkOut: null,
    guests: 2,
    roomType: '',
    amenities: []
  })
  
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [activeField, setActiveField] = useState<string | null>(null)
  
  const locationRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Sample suggestions
  const defaultSuggestions: SearchSuggestion[] = [
    {
      id: '1',
      title: 'Downtown Hotel District',
      subtitle: 'Premium hotels in city center',
      type: 'popular'
    },
    {
      id: '2',
      title: 'Beachfront Resorts',
      subtitle: 'Ocean view accommodations',
      type: 'popular'
    },
    {
      id: '3',
      title: 'Miami, FL',
      subtitle: 'Last searched location',
      type: 'recent'
    }
  ]

  const roomTypes = [
    'Standard Room',
    'Deluxe Room', 
    'Suite',
    'Presidential Suite'
  ]

  const amenities = [
    'WiFi',
    'Parking',
    'Breakfast',
    'Pool',
    'Spa',
    'Gym'
  ]

  const handleInputChange = (field: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }))
    
    if (field === 'location') {
      setShowSuggestions(true)
    }
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setFilters(prev => ({ ...prev, location: suggestion.title }))
    setShowSuggestions(false)
    setActiveField(null)
  }

  const handleSearch = () => {
    if (!filters.location || !filters.checkIn || !filters.checkOut) {
      return
    }
    onSearch(filters)
  }

  const clearFilters = () => {
    setFilters({
      location: '',
      checkIn: null,
      checkOut: null,
      guests: 2,
      roomType: '',
      amenities: []
    })
  }

  const formatDate = (date: Date | null) => {
    if (!date) return ''
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleDateChange = (field: 'checkIn' | 'checkOut', date: string) => {
    const dateObj = new Date(date)
    setFilters(prev => ({ ...prev, [field]: dateObj }))
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn("bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden", className)}
    >
      {/* Main Search Bar */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Location */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={locationRef}
                type="text"
                placeholder="Where are you going?"
                value={filters.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                onFocus={() => {
                  setActiveField('location')
                  setShowSuggestions(true)
                }}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Check-in Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Check-in
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={filters.checkIn ? filters.checkIn.toISOString().split('T')[0] : ''}
                onChange={(e) => handleDateChange('checkIn', e.target.value)}
                onFocus={() => setActiveField('checkIn')}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Check-out Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Check-out
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={filters.checkOut ? filters.checkOut.toISOString().split('T')[0] : ''}
                onChange={(e) => handleDateChange('checkOut', e.target.value)}
                onFocus={() => setActiveField('checkOut')}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Guests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Guests
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={filters.guests}
                onChange={(e) => handleInputChange('guests', parseInt(e.target.value))}
                onFocus={() => setActiveField('guests')}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all appearance-none bg-white"
              >
                {[1, 2, 3, 4, 5, 6].map(num => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'Guest' : 'Guests'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Search Button */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
            </motion.button>
            
            {(filters.roomType || filters.amenities.length > 0) && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileTap={{ scale: 0.95 }}
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
              >
                <X className="w-4 h-4" />
                Clear
              </motion.button>
            )}
          </div>

          <PremiumButton
            onClick={handleSearch}
            loading={loading}
            disabled={!filters.location || !filters.checkIn || !filters.checkOut}
            size="lg"
            icon={<Search className="w-5 h-5" />}
            className="px-8"
          >
            Search Hotels
          </PremiumButton>
        </div>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="border-t border-gray-100 overflow-hidden"
          >
            <div className="p-6 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Room Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Room Type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {roomTypes.map((type) => (
                      <motion.button
                        key={type}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleInputChange('roomType', 
                          filters.roomType === type ? '' : type
                        )}
                        className={cn(
                          "px-3 py-2 text-sm rounded-lg border transition-all",
                          filters.roomType === type
                            ? "bg-amber-500 text-white border-amber-500"
                            : "bg-white text-gray-700 border-gray-200 hover:border-amber-300"
                        )}
                      >
                        {type}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Amenities
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {amenities.map((amenity) => (
                      <motion.button
                        key={amenity}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          const newAmenities = filters.amenities.includes(amenity)
                            ? filters.amenities.filter(a => a !== amenity)
                            : [...filters.amenities, amenity]
                          handleInputChange('amenities', newAmenities)
                        }}
                        className={cn(
                          "px-3 py-2 text-sm rounded-lg border transition-all",
                          filters.amenities.includes(amenity)
                            ? "bg-amber-500 text-white border-amber-500"
                            : "bg-white text-gray-700 border-gray-200 hover:border-amber-300"
                        )}
                      >
                        {amenity}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && activeField === 'location' && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto"
          >
            {[...defaultSuggestions, ...suggestions].map((suggestion, index) => (
              <motion.button
                key={suggestion.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ backgroundColor: '#fef3c7' }}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-amber-50 transition-colors border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-gray-900">{suggestion.title}</div>
                <div className="text-sm text-gray-500">{suggestion.subtitle}</div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
