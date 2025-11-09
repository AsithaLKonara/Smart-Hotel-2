"use client"

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  Calendar, 
  Users, 
  CreditCard, 
  CheckCircle, 
  ArrowLeft, 
  Loader2, 
  Star,
  Wifi,
  Car,
  Utensils,
  Waves,
  Shield,
  Clock,
  MapPin,
  Phone,
  Mail
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

function BookingPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [searchData, setSearchData] = useState({
    checkIn: '',
    checkOut: '',
    guests: 2,
    roomType: 'all'
  })
  
  const [availableRooms, setAvailableRooms] = useState([])
  const [selectedRoom, setSelectedRoom] = useState<any>(null)
  const [bookingData, setBookingData] = useState({
    roomId: '',
    specialRequests: '',
    paymentMethod: 'pay_later' as 'pay_now' | 'pay_later',
    guestName: '',
    guestEmail: '',
    guestPhone: ''
  })

  const [nights, setNights] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)
  const [isSearching, setIsSearching] = useState(false)

  // Calculate dates and pricing
  useEffect(() => {
    if (searchData.checkIn && searchData.checkOut) {
      const checkIn = new Date(searchData.checkIn)
      const checkOut = new Date(searchData.checkOut)
      const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      setNights(diffDays)
    }
  }, [searchData.checkIn, searchData.checkOut])

  useEffect(() => {
    if (selectedRoom && nights > 0) {
      setTotalAmount(selectedRoom.totalPrice)
      setBookingData(prev => ({ ...prev, roomId: selectedRoom.id }))
    }
  }, [selectedRoom, nights])

  // Search for available rooms
  const searchRooms = async () => {
    if (!searchData.checkIn || !searchData.checkOut) {
      toast.error('Please select check-in and check-out dates')
      return
    }

    setIsSearching(true)
    try {
      const params = new URLSearchParams({
        checkin: searchData.checkIn,
        checkout: searchData.checkOut,
        guests: searchData.guests.toString(),
        type: searchData.roomType
      })

      const response = await fetch(`/api/rooms/availability?${params}`)
      const data = await response.json()

      if (response.ok) {
        setAvailableRooms(data.availableRooms)
        setStep(2)
        toast.success(`Found ${data.availableRooms.length} available rooms`)
      } else {
        toast.error(data.error || 'Failed to search rooms')
      }
    } catch (error) {
      toast.error('Failed to search rooms')
    } finally {
      setIsSearching(false)
    }
  }

  // Create booking
  const createBooking = async () => {
    if (!selectedRoom) {
      toast.error('Please select a room')
      return
    }

    if (!session && (!bookingData.guestName || !bookingData.guestEmail)) {
      toast.error('Please provide guest information')
      return
    }

    setIsLoading(true)
    try {
      const bookingPayload = {
        roomId: selectedRoom.id,
        checkIn: searchData.checkIn,
        checkOut: searchData.checkOut,
        guests: searchData.guests,
        totalAmount,
        specialRequests: bookingData.specialRequests,
        paymentMethod: bookingData.paymentMethod,
        ...(session ? {} : {
          guestName: bookingData.guestName,
          guestEmail: bookingData.guestEmail,
          guestPhone: bookingData.guestPhone
        })
      }

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingPayload)
      })

      const data = await response.json()

      if (response.ok) {
        setStep(4)
        toast.success('Booking created successfully!')
      } else {
        toast.error(data.error || 'Failed to create booking')
      }
    } catch (error) {
      toast.error('Failed to create booking')
    } finally {
      setIsLoading(false)
    }
  }

  const getRoomTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'standard': return 'bg-blue-100 text-blue-800'
      case 'deluxe': return 'bg-purple-100 text-purple-800'
      case 'suite': return 'bg-amber-100 text-amber-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Book Your Stay</h1>
          <p className="text-gray-600 mt-2">Find and book your perfect room at Grand Palace Hotel</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            {[
              { step: 1, title: 'Search', icon: Calendar },
              { step: 2, title: 'Select Room', icon: Users },
              { step: 3, title: 'Guest Info', icon: CreditCard },
              { step: 4, title: 'Confirmation', icon: CheckCircle }
            ].map(({ step: stepNumber, title, icon: Icon }) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step >= stepNumber ? 'bg-amber-700 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`ml-2 font-medium ${
                  step >= stepNumber ? 'text-amber-800' : 'text-gray-600'
                }`}>
                  {title}
                </span>
                {stepNumber < 4 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    step > stepNumber ? 'bg-amber-700' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Search */}
        {step === 1 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Search Available Rooms</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <label htmlFor="check-in-date" className="block text-sm font-medium text-gray-700 mb-2">
                  Check-in Date
                </label>
                <input
                  id="check-in-date"
                  type="date"
                  value={searchData.checkIn}
                  onChange={(e) => setSearchData(prev => ({ ...prev, checkIn: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label htmlFor="check-out-date" className="block text-sm font-medium text-gray-700 mb-2">
                  Check-out Date
                </label>
                <input
                  id="check-out-date"
                  type="date"
                  value={searchData.checkOut}
                  onChange={(e) => setSearchData(prev => ({ ...prev, checkOut: e.target.value }))}
                  min={searchData.checkIn || new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label htmlFor="guests-count" className="block text-sm font-medium text-gray-700 mb-2">
                  Guests
                </label>
                <select
                  id="guests-count"
                  value={searchData.guests}
                  onChange={(e) => setSearchData(prev => ({ ...prev, guests: parseInt(e.target.value) }))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="room-type" className="block text-sm font-medium text-gray-700 mb-2">
                  Room Type
                </label>
                <select
                  id="room-type"
                  value={searchData.roomType}
                  onChange={(e) => setSearchData(prev => ({ ...prev, roomType: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="all">All Types</option>
                  <option value="STANDARD">Standard</option>
                  <option value="DELUXE">Deluxe</option>
                  <option value="SUITE">Suite</option>
                </select>
              </div>
            </div>
            <Button
              onClick={searchRooms}
              disabled={isSearching || !searchData.checkIn || !searchData.checkOut}
              className="w-full"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                'Search Available Rooms'
              )}
            </Button>
          </Card>
        )}

        {/* Step 2: Select Room */}
        {step === 2 && (
          <div>
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Available Rooms</h2>
              <p className="text-gray-600 mb-6">
                {nights} {nights === 1 ? 'night' : 'nights'} • {searchData.guests} {searchData.guests === 1 ? 'guest' : 'guests'}
              </p>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {availableRooms.map((room: any) => (
                <Card key={room.id} className="overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold">{room.type} Room</h3>
                        <p className="text-gray-600">Room {room.number}</p>
                        <Badge className={`mt-2 ${getRoomTypeColor(room.type)}`}>
                          {room.type}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-amber-800">
                          ${room.totalPrice}
                        </div>
                        <div className="text-sm text-gray-500">
                          ${room.price}/night
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-2" />
                        {room.capacity} guests
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        Floor {room.floor}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Star className="w-4 h-4 mr-2" />
                        {room.averageRating || 'New'} ({room.reviewCount} reviews)
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        {room.size} sq ft
                      </div>
                    </div>

                    <p className="text-gray-600 mb-4">{room.description}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {room.amenities.slice(0, 4).map((amenity: string) => (
                        <Badge key={amenity} variant="outline" className="text-xs">
                          {amenity}
                        </Badge>
                      ))}
                      {room.amenities.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{room.amenities.length - 4} more
                        </Badge>
                      )}
                    </div>

                    <Button
                      onClick={() => {
                        setSelectedRoom(room)
                        setStep(3)
                      }}
                      className="w-full"
                    >
                      Select This Room
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {availableRooms.length === 0 && (
              <Card className="p-6 text-center">
                <h3 className="text-lg font-semibold mb-2">No rooms available</h3>
                <p className="text-gray-600 mb-4">
                  No rooms are available for your selected dates and criteria.
                </p>
                <Button onClick={() => setStep(1)} variant="outline">
                  Modify Search
                </Button>
              </Card>
            )}
          </div>
        )}

        {/* Step 3: Guest Information */}
        {step === 3 && selectedRoom && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6">Guest Information</h2>
                
                {!session && (
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={bookingData.guestName}
                        onChange={(e) => setBookingData(prev => ({ ...prev, guestName: e.target.value }))}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={bookingData.guestEmail}
                        onChange={(e) => setBookingData(prev => ({ ...prev, guestEmail: e.target.value }))}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Enter your email address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={bookingData.guestPhone}
                        onChange={(e) => setBookingData(prev => ({ ...prev, guestPhone: e.target.value }))}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Requests
                    </label>
                    <textarea
                      value={bookingData.specialRequests}
                      onChange={(e) => setBookingData(prev => ({ ...prev, specialRequests: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Any special requests or preferences?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="pay_later"
                          checked={bookingData.paymentMethod === 'pay_later'}
                          onChange={(e) => setBookingData(prev => ({ ...prev, paymentMethod: e.target.value as 'pay_now' | 'pay_later' }))}
                          className="mr-3"
                        />
                        Pay at hotel
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="pay_now"
                          checked={bookingData.paymentMethod === 'pay_now'}
                          onChange={(e) => setBookingData(prev => ({ ...prev, paymentMethod: e.target.value as 'pay_now' | 'pay_later' }))}
                          className="mr-3"
                        />
                        Pay now (secure payment)
                      </label>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div>
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Booking Summary</h3>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Room</span>
                    <span>{selectedRoom.type} Room</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nights</span>
                    <span>{nights}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Guests</span>
                    <span>{searchData.guests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Room rate</span>
                    <span>${selectedRoom.price}/night</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>${selectedRoom.price * nights}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Taxes & fees</span>
                    <span>$0</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>${totalAmount}</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={createBooking}
                  disabled={isLoading || (!session && (!bookingData.guestName || !bookingData.guestEmail))}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Booking...
                    </>
                  ) : (
                    'Confirm Booking'
                  )}
                </Button>

                <div className="mt-4 flex items-center text-sm text-gray-600">
                  <Shield className="w-4 h-4 mr-2" />
                  Secure booking with confirmation
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <Card className="p-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-4">Booking Confirmed!</h2>
            <p className="text-gray-600 mb-6">
              Your booking has been successfully created. You will receive a confirmation email shortly.
            </p>
            <div className="space-x-4">
              <Button onClick={() => router.push('/my-bookings')}>
                View My Bookings
              </Button>
              <Button variant="outline" onClick={() => router.push('/')}>
                Return Home
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking page...</p>
        </div>
      </div>
    }>
      <BookingPageContent />
    </Suspense>
  )
}