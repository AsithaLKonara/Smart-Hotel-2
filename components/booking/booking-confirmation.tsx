"use client"

import { motion } from "framer-motion"
import { CheckCircle, Download, Share2, Calendar, MapPin, Users, CreditCard, Gift } from "lucide-react"
import { PremiumButton } from "../ui/premium-button"
import { PriceBreakdown } from "../ui/price-breakdown"

interface BookingConfirmationProps {
  bookingData: {
    id: string
    room: {
      type: string
      number: string
      floor: number
    }
    dates: {
      checkIn: Date
      checkOut: Date
    }
    guests: number
    location: string
    extras: {
      breakfast: boolean
      lateCheckout: boolean
      airportShuttle: boolean
      spaAccess: boolean
    }
    total: number
    guestInfo: {
      firstName: string
      lastName: string
      email: string
      phone: string
    }
  }
  onDownload?: () => void
  onShare?: () => void
  onNewBooking?: () => void
}

export function BookingConfirmation({ 
  bookingData, 
  onDownload, 
  onShare, 
  onNewBooking 
}: BookingConfirmationProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const calculateNights = () => {
    const diffTime = Math.abs(bookingData.dates.checkOut.getTime() - bookingData.dates.checkIn.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const nights = calculateNights()

  // Confetti animation
  const confettiColors = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6']

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-amber-50">
      {/* Confetti Animation */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              backgroundColor: confettiColors[i % confettiColors.length],
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            initial={{ 
              y: -100, 
              x: Math.random() * window.innerWidth,
              rotate: 0,
              opacity: 1 
            }}
            animate={{ 
              y: window.innerHeight + 100,
              rotate: 360,
              opacity: 0
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              delay: Math.random() * 2,
              ease: "easeOut"
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="max-w-4xl mx-auto"
        >
          {/* Success Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5, ease: 'easeOut' }}
              className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-12 h-12 text-green-600" />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
            >
              Booking Confirmed!
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-xl text-gray-600 max-w-2xl mx-auto"
            >
              Welcome to SmartHotel! Your reservation has been confirmed and you'll receive a confirmation email shortly.
            </motion.p>
          </div>

          {/* Booking Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Booking #{bookingData.id}</h2>
                  <p className="text-amber-100">Confirmed on {new Date().toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{bookingData.room.type}</div>
                  <div className="text-amber-100">Room {bookingData.room.number}</div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Stay Details */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-amber-600" />
                      Stay Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Check-in</span>
                        <span className="font-medium">{formatDate(bookingData.dates.checkIn)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Check-out</span>
                        <span className="font-medium">{formatDate(bookingData.dates.checkOut)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration</span>
                        <span className="font-medium">{nights} {nights === 1 ? 'Night' : 'Nights'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Guests</span>
                        <span className="font-medium">{bookingData.guests} {bookingData.guests === 1 ? 'Guest' : 'Guests'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-amber-600" />
                      Location
                    </h3>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="font-medium text-gray-900">{bookingData.location}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        SmartHotel • Room {bookingData.room.number} • Floor {bookingData.room.floor}
                      </div>
                    </div>
                  </div>

                  {/* Guest Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-amber-600" />
                      Guest Information
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name</span>
                        <span className="font-medium">
                          {bookingData.guestInfo.firstName} {bookingData.guestInfo.lastName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email</span>
                        <span className="font-medium">{bookingData.guestInfo.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone</span>
                        <span className="font-medium">{bookingData.guestInfo.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Extras */}
                  {Object.values(bookingData.extras).some(Boolean) && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Gift className="w-5 h-5 text-amber-600" />
                        Added Extras
                      </h3>
                      <div className="space-y-2">
                        {bookingData.extras.breakfast && (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span>Daily Breakfast</span>
                          </div>
                        )}
                        {bookingData.extras.lateCheckout && (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span>Late Checkout</span>
                          </div>
                        )}
                        {bookingData.extras.airportShuttle && (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span>Airport Shuttle</span>
                          </div>
                        )}
                        {bookingData.extras.spaAccess && (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span>Spa Access</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Price Breakdown */}
                  <PriceBreakdown
                    items={[
                      { label: `${bookingData.room.type} × ${nights} nights`, amount: bookingData.total * 0.8, type: 'base' },
                      ...(bookingData.extras.breakfast ? [{ label: 'Daily Breakfast', amount: 25 * nights, type: 'extra' as const }] : []),
                      ...(bookingData.extras.lateCheckout ? [{ label: 'Late Checkout', amount: 50, type: 'extra' as const }] : []),
                      ...(bookingData.extras.airportShuttle ? [{ label: 'Airport Shuttle', amount: 75, type: 'extra' as const }] : []),
                      ...(bookingData.extras.spaAccess ? [{ label: 'Spa Access', amount: 100, type: 'extra' as const }] : []),
                      { label: 'Taxes & Fees', amount: bookingData.total * 0.15, type: 'tax' as const }
                    ]}
                    total={bookingData.total}
                    showBreakdown={true}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <PremiumButton
              variant="primary"
              size="lg"
              icon={<Download className="w-5 h-5" />}
              onClick={onDownload}
              className="px-8"
            >
              Download Receipt
            </PremiumButton>
            
            <PremiumButton
              variant="secondary"
              size="lg"
              icon={<Share2 className="w-5 h-5" />}
              onClick={onShare}
              className="px-8"
            >
              Share Booking
            </PremiumButton>
            
            <PremiumButton
              variant="outline"
              size="lg"
              onClick={onNewBooking}
              className="px-8"
            >
              Make Another Booking
            </PremiumButton>
          </motion.div>

          {/* Next Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="mt-12 bg-blue-50 border border-blue-200 rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold text-blue-900 mb-3">What's Next?</h3>
            <div className="space-y-2 text-blue-800">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>You'll receive a confirmation email within 5 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Check-in instructions will be sent 24 hours before arrival</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Download our mobile app for easy check-in and services</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
