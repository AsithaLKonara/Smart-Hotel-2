"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight, Check, Calendar, Users, MapPin, CreditCard, Gift } from "lucide-react"
import { BookingStepper } from "../ui/stepper"
import { PremiumButton } from "../ui/premium-button"
import { BookingCard } from "../ui/booking-card"
import { PremiumSearch } from "../ui/premium-search"
import { ToastProvider, useToast } from "../ui/toast"
import { BookingConfirmation } from "./booking-confirmation"
import { cn } from "@/lib/utils"
import { searchRooms, createBooking, calculateBookingTotal, validateBookingData } from "@/lib/booking-api"

// Types
interface Room {
  id: string
  number: string
  type: string
  price: number
  capacity: number
  amenities: string[]
  images: string[]
  description: string | null
  floor: number | null
  status: string
}

interface BookingFilters {
  location: string
  checkIn: Date | null
  checkOut: Date | null
  guests: number
  roomType: string
  amenities: string[]
}

interface BookingExtras {
  breakfast: boolean
  lateCheckout: boolean
  airportShuttle: boolean
  spaAccess: boolean
}

interface BookingData {
  room: Room | null
  filters: BookingFilters
  extras: BookingExtras
  guestInfo: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  paymentMethod: 'card' | 'paypal' | 'apple'
}

// Step 1: Enhanced Search
function BookingStep1({ 
  filters, 
  onFiltersChange, 
  onNext 
}: {
  filters: BookingFilters
  onFiltersChange: (filters: BookingFilters) => void
  onNext: () => void
}) {
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    setIsValid(!!(filters.location && filters.checkIn && filters.checkOut))
  }, [filters])

  const handleSearch = (searchFilters: BookingFilters) => {
    onFiltersChange(searchFilters)
    onNext()
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="max-w-4xl mx-auto"
    >
      {/* Hero Section */}
      <div className="text-center mb-8">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
        >
          Find Your Perfect
          <span className="text-amber-600"> Getaway</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-gray-600 max-w-2xl mx-auto"
        >
          Discover luxury accommodations tailored to your preferences. 
          Start your journey with our smart search.
        </motion.p>
      </div>

      {/* Search Component */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <PremiumSearch
          onSearch={handleSearch}
          className="shadow-2xl"
        />
      </motion.div>

      {/* Quick Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Destinations</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Beach Resorts', icon: '🏖️', location: 'Miami Beach' },
            { name: 'City Hotels', icon: '🏙️', location: 'Downtown District' },
            { name: 'Mountain Lodges', icon: '🏔️', location: 'Aspen, CO' },
            { name: 'Spa Retreats', icon: '🧘', location: 'Sedona, AZ' }
          ].map((destination, index) => (
            <motion.button
              key={destination.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const today = new Date()
                const tomorrow = new Date(today)
                tomorrow.setDate(tomorrow.getDate() + 1)
                const dayAfter = new Date(today)
                dayAfter.setDate(dayAfter.getDate() + 2)
                
                onFiltersChange({
                  ...filters,
                  location: destination.location,
                  checkIn: today,
                  checkOut: tomorrow
                })
              }}
              className="p-4 bg-white rounded-xl border border-gray-100 hover:border-amber-300 hover:shadow-lg transition-all duration-200 text-left"
            >
              <div className="text-2xl mb-2">{destination.icon}</div>
              <div className="font-medium text-gray-900">{destination.name}</div>
              <div className="text-sm text-gray-500">{destination.location}</div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

// Step 2: Room Selection
function BookingStep2({ 
  filters, 
  selectedRoom, 
  onRoomSelect, 
  onNext, 
  onBack 
}: {
  filters: BookingFilters
  selectedRoom: Room | null
  onRoomSelect: (room: Room) => void
  onNext: () => void
  onBack: () => void
}) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  // Fetch rooms from API
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true)
        const availableRooms = await searchRooms({
          ...filters,
          checkIn: filters.checkIn || new Date(),
          checkOut: filters.checkOut || new Date(Date.now() + 24 * 60 * 60 * 1000)
        })
        setRooms(availableRooms)
      } catch (error) {
        console.error('Error fetching rooms:', error)
        // Fallback to mock data if API fails
        const mockRooms: Room[] = [
          {
            id: '1',
            number: '101',
            type: 'Deluxe Ocean View',
            price: 299,
            capacity: 2,
            amenities: ['wifi', 'breakfast', 'parking'],
            images: ['/images/rooms/deluxe-1.jpg', '/images/rooms/deluxe-2.jpg'],
            description: 'Spacious room with stunning ocean views and premium amenities',
            floor: 1,
            status: 'AVAILABLE'
          },
          {
            id: '2',
            number: '201',
            type: 'Presidential Suite',
            price: 599,
            capacity: 4,
            amenities: ['wifi', 'breakfast', 'parking', 'spa'],
            images: ['/images/rooms/presidential-1.jpg', '/images/rooms/presidential-2.jpg'],
            description: 'Luxurious suite with private balcony and butler service',
            floor: 2,
            status: 'AVAILABLE'
          },
          {
            id: '3',
            number: '301',
            type: 'Standard Room',
            price: 199,
            capacity: 2,
            amenities: ['wifi'],
            images: ['/images/rooms/standard-1.jpg'],
            description: 'Comfortable room with modern amenities',
            floor: 3,
            status: 'AVAILABLE'
          }
        ]
        setRooms(mockRooms)
      } finally {
        setLoading(false)
      }
    }

    if (filters.location && filters.checkIn && filters.checkOut) {
      fetchRooms()
    }
  }, [filters])

  const handleFavorite = (roomId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(roomId)) {
        newFavorites.delete(roomId)
      } else {
        newFavorites.add(roomId)
      }
      return newFavorites
    })
  }

  const calculateNights = () => {
    if (!filters.checkIn || !filters.checkOut) return 1
    const diffTime = Math.abs(filters.checkOut.getTime() - filters.checkIn.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const nights = calculateNights()

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="max-w-6xl mx-auto"
    >
      {/* Header */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Select Your Room</h2>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {filters.location}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {filters.checkIn?.toLocaleDateString()} - {filters.checkOut?.toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {filters.guests} {filters.guests === 1 ? 'Guest' : 'Guests'}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-500">Total Stay</div>
            <div className="text-2xl font-bold text-amber-600">{nights} {nights === 1 ? 'Night' : 'Nights'}</div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2 mb-6"
        >
          {['All Rooms', 'Deluxe', 'Suite', 'Standard'].map((filter) => (
            <motion.button
              key={filter}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 rounded-full border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-all"
            >
              {filter}
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <AnimatePresence>
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-200 rounded-2xl h-96 animate-pulse"
              />
            ))
          ) : (
            rooms.map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "relative",
                  selectedRoom?.id === room.id && "ring-2 ring-amber-500 rounded-2xl"
                )}
              >
                <BookingCard
                  room={room}
                  onSelect={onRoomSelect}
                  onFavorite={handleFavorite}
                  isFavorite={favorites.has(room.id)}
                  className={selectedRoom?.id === room.id ? "shadow-xl" : ""}
                />
                
                {selectedRoom?.id === room.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center"
                  >
                    <Check className="w-5 h-5 text-white" />
                  </motion.div>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <PremiumButton
          variant="outline"
          onClick={onBack}
          icon={<ArrowLeft className="w-4 h-4" />}
          iconPosition="left"
        >
          Back to Search
        </PremiumButton>
        
        <PremiumButton
          variant="primary"
          onClick={onNext}
          disabled={!selectedRoom}
          icon={<ArrowRight className="w-4 h-4" />}
          iconPosition="right"
        >
          Continue to Extras
        </PremiumButton>
      </div>
    </motion.div>
  )
}

// Step 3: Checkout & Extras
function BookingStep3({ 
  bookingData, 
  onExtrasChange, 
  onGuestInfoChange, 
  onPaymentMethodChange,
  onComplete, 
  onBack 
}: {
  bookingData: BookingData
  onExtrasChange: (extras: BookingExtras) => void
  onGuestInfoChange: (guestInfo: any) => void
  onPaymentMethodChange: (method: string) => void
  onComplete: () => void
  onBack: () => void
}) {
  const { success } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)

  const calculateTotal = () => {
    if (!bookingData.room) return 0
    
    const nights = bookingData.filters.checkIn && bookingData.filters.checkOut
      ? Math.ceil((bookingData.filters.checkOut.getTime() - bookingData.filters.checkIn.getTime()) / (1000 * 60 * 60 * 24))
      : 1
    
    let total = bookingData.room.price * nights
    
    if (bookingData.extras.breakfast) total += 25 * nights
    if (bookingData.extras.lateCheckout) total += 50
    if (bookingData.extras.airportShuttle) total += 75
    if (bookingData.extras.spaAccess) total += 100
    
    return total
  }

  const handleComplete = async () => {
    setIsProcessing(true)
    
    try {
      // Validate booking data
      const errors = validateBookingData({
        roomId: bookingData.room?.id,
        userId: 'current-user-id', // This would come from auth context
        checkIn: bookingData.filters.checkIn || new Date(),
        checkOut: bookingData.filters.checkOut || new Date(Date.now() + 24 * 60 * 60 * 1000),
        guests: bookingData.filters.guests,
        guestInfo: bookingData.guestInfo,
        extras: bookingData.extras
      })

      if (errors.length > 0) {
        throw new Error(errors.join(', '))
      }

      // Calculate total
      const nights = bookingData.filters.checkIn && bookingData.filters.checkOut
        ? Math.ceil((bookingData.filters.checkOut.getTime() - bookingData.filters.checkIn.getTime()) / (1000 * 60 * 60 * 24))
        : 1

      const totalAmount = calculateBookingTotal(
        bookingData.room!.price,
        nights,
        bookingData.extras
      )

      // Create booking
      const bookingRequest = {
        roomId: bookingData.room!.id,
        userId: 'current-user-id', // This would come from auth context
        checkIn: bookingData.filters.checkIn!,
        checkOut: bookingData.filters.checkOut!,
        guests: bookingData.filters.guests,
        totalAmount,
        extras: bookingData.extras,
        guestInfo: bookingData.guestInfo
      }

      const result = await createBooking(bookingRequest)
      
      if (result.success) {
        success("Booking Confirmed!", "Welcome to SmartHotel! Check your email for details.")
        onComplete()
      } else {
        throw new Error(result.error || 'Failed to create booking')
      }
    } catch (error) {
      console.error('Booking error:', error)
      // Handle error - show toast or error message
      throw error
    } finally {
      setIsProcessing(false)
    }
  }

  const total = calculateTotal()
  const nights = bookingData.filters.checkIn && bookingData.filters.checkOut
    ? Math.ceil((bookingData.filters.checkOut.getTime() - bookingData.filters.checkIn.getTime()) / (1000 * 60 * 60 * 24))
    : 1

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="max-w-4xl mx-auto"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Booking</h2>
        <p className="text-gray-600">Add extras and provide your information to finalize your stay</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Extras Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 border border-gray-100"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-600" />
              Add Extras to Your Stay
            </h3>
            
            <div className="space-y-4">
              {[
                { key: 'breakfast', title: 'Daily Breakfast', description: 'Continental breakfast for 2', price: 25, icon: '🥐' },
                { key: 'lateCheckout', title: 'Late Checkout', description: 'Checkout until 2 PM', price: 50, icon: '⏰' },
                { key: 'airportShuttle', title: 'Airport Shuttle', description: 'Round-trip airport transfer', price: 75, icon: '🚐' },
                { key: 'spaAccess', title: 'Spa Access', description: 'Full spa facilities access', price: 100, icon: '🧘' }
              ].map((extra, index) => (
                <motion.div
                  key={extra.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer",
                    bookingData.extras[extra.key as keyof BookingExtras]
                      ? "border-amber-500 bg-amber-50"
                      : "border-gray-200 hover:border-amber-300"
                  )}
                  onClick={() => {
                    onExtrasChange({
                      ...bookingData.extras,
                      [extra.key]: !bookingData.extras[extra.key as keyof BookingExtras]
                    })
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">{extra.icon}</div>
                    <div>
                      <div className="font-medium text-gray-900">{extra.title}</div>
                      <div className="text-sm text-gray-500">{extra.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-semibold text-gray-900">
                      ${extra.price}{extra.key === 'breakfast' ? '/night' : ''}
                    </div>
                    <div className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                      bookingData.extras[extra.key as keyof BookingExtras]
                        ? "border-amber-500 bg-amber-500"
                        : "border-gray-300"
                    )}>
                      {bookingData.extras[extra.key as keyof BookingExtras] && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Guest Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 border border-gray-100"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Guest Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  value={bookingData.guestInfo.firstName}
                  onChange={(e) => onGuestInfoChange({ ...bookingData.guestInfo, firstName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  value={bookingData.guestInfo.lastName}
                  onChange={(e) => onGuestInfoChange({ ...bookingData.guestInfo, lastName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Enter your last name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={bookingData.guestInfo.email}
                  onChange={(e) => onGuestInfoChange({ ...bookingData.guestInfo, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={bookingData.guestInfo.phone}
                  onChange={(e) => onGuestInfoChange({ ...bookingData.guestInfo, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>
          </motion.div>

          {/* Payment Method */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 border border-gray-100"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-600" />
              Payment Method
            </h3>
            
            <div className="space-y-3">
              {[
                { key: 'card', title: 'Credit/Debit Card', description: 'Visa, Mastercard, American Express', icon: '💳' },
                { key: 'paypal', title: 'PayPal', description: 'Pay securely with PayPal', icon: '🅿️' },
                { key: 'apple', title: 'Apple Pay', description: 'Pay with Touch ID or Face ID', icon: '🍎' }
              ].map((method) => (
                <motion.div
                  key={method.key}
                  whileHover={{ scale: 1.02 }}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer",
                    bookingData.paymentMethod === method.key
                      ? "border-amber-500 bg-amber-50"
                      : "border-gray-200 hover:border-amber-300"
                  )}
                  onClick={() => onPaymentMethodChange(method.key)}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">{method.icon}</div>
                    <div>
                      <div className="font-medium text-gray-900">{method.title}</div>
                      <div className="text-sm text-gray-500">{method.description}</div>
                    </div>
                  </div>
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                    bookingData.paymentMethod === method.key
                      ? "border-amber-500 bg-amber-500"
                      : "border-gray-300"
                  )}>
                    {bookingData.paymentMethod === method.key && (
                      <Check className="w-4 h-4 text-white" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Booking Summary */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-1"
        >
          <div className="bg-white rounded-2xl p-6 border border-gray-100 sticky top-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Booking Summary</h3>
            
            {bookingData.room && (
              <div className="space-y-4">
                <div className="border-b border-gray-100 pb-4">
                  <div className="font-medium text-gray-900">{bookingData.room.type}</div>
                  <div className="text-sm text-gray-500">Room {bookingData.room.number} • Floor {bookingData.room.floor}</div>
                  <div className="text-sm text-gray-500">{bookingData.filters.location}</div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>${bookingData.room.price} × {nights} nights</span>
                    <span>${bookingData.room.price * nights}</span>
                  </div>
                  
                  {bookingData.extras.breakfast && (
                    <div className="flex justify-between">
                      <span>Daily Breakfast</span>
                      <span>${25 * nights}</span>
                    </div>
                  )}
                  
                  {bookingData.extras.lateCheckout && (
                    <div className="flex justify-between">
                      <span>Late Checkout</span>
                      <span>$50</span>
                    </div>
                  )}
                  
                  {bookingData.extras.airportShuttle && (
                    <div className="flex justify-between">
                      <span>Airport Shuttle</span>
                      <span>$75</span>
                    </div>
                  )}
                  
                  {bookingData.extras.spaAccess && (
                    <div className="flex justify-between">
                      <span>Spa Access</span>
                      <span>$100</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span>Taxes & Fees</span>
                    <span>${Math.round(total * 0.15)}</span>
                  </div>
                </div>
                
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span className="text-amber-600">${total + Math.round(total * 0.15)}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-6 space-y-3">
              <PremiumButton
                variant="outline"
                onClick={onBack}
                className="w-full"
                icon={<ArrowLeft className="w-4 h-4" />}
                iconPosition="left"
              >
                Back to Room Selection
              </PremiumButton>
              
              <PremiumButton
                variant="primary"
                onClick={handleComplete}
                loading={isProcessing}
                disabled={!bookingData.guestInfo.firstName || !bookingData.guestInfo.lastName || !bookingData.guestInfo.email}
                className="w-full"
                icon={<Check className="w-4 h-4" />}
                iconPosition="right"
              >
                Complete Booking
              </PremiumButton>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

// Main Booking Flow Component
function BookingFlowContent() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [bookingData, setBookingData] = useState<BookingData>({
    room: null,
    filters: {
      location: '',
      checkIn: null,
      checkOut: null,
      guests: 2,
      roomType: '',
      amenities: []
    },
    extras: {
      breakfast: false,
      lateCheckout: false,
      airportShuttle: false,
      spaAccess: false
    },
    guestInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    },
    paymentMethod: 'card'
  })

  const steps = [
    'Search',
    'Select Room',
    'Complete Booking'
  ]

  const handleFiltersChange = (filters: BookingFilters) => {
    setBookingData(prev => ({ ...prev, filters }))
  }

  const handleRoomSelect = (room: Room) => {
    setBookingData(prev => ({ ...prev, room }))
  }

  const handleExtrasChange = (extras: BookingExtras) => {
    setBookingData(prev => ({ ...prev, extras }))
  }

  const handleGuestInfoChange = (guestInfo: any) => {
    setBookingData(prev => ({ ...prev, guestInfo }))
  }

  const handlePaymentMethodChange = (method: string) => {
    setBookingData(prev => ({ ...prev, paymentMethod: method as any }))
  }

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0))

  const handleBookingComplete = () => {
    setIsCompleted(true)
  }

  const handleNewBooking = () => {
    setIsCompleted(false)
    setCurrentStep(0)
    setBookingData({
      room: null,
      filters: {
        location: '',
        checkIn: null,
        checkOut: null,
        guests: 2,
        roomType: '',
        amenities: []
      },
      extras: {
        breakfast: false,
        lateCheckout: false,
        airportShuttle: false,
        spaAccess: false
      },
      guestInfo: {
        firstName: '',
        lastName: '',
        email: '',
        phone: ''
      },
      paymentMethod: 'card'
    })
  }

  // Show confirmation page if completed
  if (isCompleted) {
    return (
      <BookingConfirmation
        bookingData={{
          id: 'BK' + Math.random().toString(36).substr(2, 9).toUpperCase(),
          room: {
            type: bookingData.room?.type || '',
            number: bookingData.room?.number || '',
            floor: bookingData.room?.floor || 0
          },
          dates: {
            checkIn: bookingData.filters.checkIn || new Date(),
            checkOut: bookingData.filters.checkOut || new Date()
          },
          guests: bookingData.filters.guests,
          location: bookingData.filters.location,
          extras: bookingData.extras,
          total: calculateBookingTotal(
            bookingData.room?.price || 0,
            bookingData.filters.checkIn && bookingData.filters.checkOut
              ? Math.ceil((bookingData.filters.checkOut.getTime() - bookingData.filters.checkIn.getTime()) / (1000 * 60 * 60 * 24))
              : 1,
            bookingData.extras
          ),
          guestInfo: bookingData.guestInfo
        }}
        onNewBooking={handleNewBooking}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-teal-50">
      <div className="container mx-auto px-4 py-8">
        {/* Progress Stepper */}
        <div className="mb-12">
          <BookingStepper
            currentStep={currentStep}
            onStepClick={setCurrentStep}
            className="max-w-2xl mx-auto"
          />
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <BookingStep1
              key="step-1"
              filters={bookingData.filters}
              onFiltersChange={handleFiltersChange}
              onNext={nextStep}
            />
          )}
          
          {currentStep === 1 && (
            <BookingStep2
              key="step-2"
              filters={bookingData.filters}
              selectedRoom={bookingData.room}
              onRoomSelect={handleRoomSelect}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}
          
          {currentStep === 2 && (
            <BookingStep3
              key="step-3"
              bookingData={bookingData}
              onExtrasChange={handleExtrasChange}
              onGuestInfoChange={handleGuestInfoChange}
              onPaymentMethodChange={handlePaymentMethodChange}
              onComplete={handleBookingComplete}
              onBack={prevStep}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Export with Toast Provider
export function BookingFlow() {
  return (
    <ToastProvider>
      <BookingFlowContent />
    </ToastProvider>
  )
}
