"use client"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Calendar, Users, CreditCard, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Navigation from '@/components/navigation'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

function BookingPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session, status } = useSession() || { data: null, status: 'unauthenticated' }
  const selectedRoomId = searchParams.get('room')
  
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [bookingData, setBookingData] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1,
    roomId: selectedRoomId || '',
    specialRequests: '',
    paymentMethod: 'pay_later' as 'pay_now' | 'pay_later'
  })

  const [selectedRoom, setSelectedRoom] = useState<any>(null)
  const [nights, setNights] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)
  const [tax, setTax] = useState(0)
  const [finalTotal, setFinalTotal] = useState(0)

  // Mock rooms data - replace with API call
  const rooms = [
    {
      id: 1,
      name: "Deluxe Suite",
      type: "Suite",
      price: 299,
      image: "/images/room-deluxe.jpg"
    },
    {
      id: 2,
      name: "Executive Room",
      type: "Deluxe",
      price: 199,
      image: "/images/room-executive.jpg"
    },
    {
      id: 3,
      name: "Presidential Suite",
      type: "Presidential",
      price: 599,
      image: "/images/room-presidential.jpg"
    },
    {
      id: 4,
      name: "Standard Room",
      type: "Standard",
      price: 129,
      image: "/images/room-standard.jpg"
    }
  ]

  // Check authentication
  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      toast.error('Please sign in to make a booking')
      router.push('/auth/signin?callbackUrl=/booking')
      return
    }
  }, [session, status, router])

  useEffect(() => {
    if (selectedRoomId) {
      const room = rooms.find(r => r.id.toString() === selectedRoomId)
      setSelectedRoom(room)
    }
  }, [selectedRoomId])

  useEffect(() => {
    if (bookingData.checkIn && bookingData.checkOut) {
      const checkIn = new Date(bookingData.checkIn)
      const checkOut = new Date(bookingData.checkOut)
      const diffTime = checkOut.getTime() - checkIn.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      setNights(diffDays)
      
      if (selectedRoom && diffDays > 0) {
        const subtotal = selectedRoom.price * diffDays
        const taxAmount = subtotal * 0.1 // 10% tax
        setTotalAmount(subtotal)
        setTax(taxAmount)
        setFinalTotal(subtotal + taxAmount)
      }
    }
  }, [bookingData.checkIn, bookingData.checkOut, selectedRoom])

  const handleInputChange = (field: string, value: any) => {
    setBookingData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (step < 3) {
      setStep(step + 1)
      return
    }

    // Final booking submission
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...bookingData,
          checkIn: new Date(bookingData.checkIn).toISOString(),
          checkOut: new Date(bookingData.checkOut).toISOString(),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create booking')
      }

      if (result.booking.paymentIntent && bookingData.paymentMethod === 'pay_now') {
        // Redirect to Stripe Checkout
        const stripe = await import('@stripe/stripe-js')
        const stripeInstance = await stripe.loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
        
        if (stripeInstance) {
          const { error } = await stripeInstance.redirectToCheckout({
            sessionId: result.booking.paymentIntent.id,
          })
          
          if (error) {
            throw new Error(error.message)
          }
        }
      } else {
        // Pay later - show success message
        toast.success('Booking created successfully! You can pay later.')
        router.push('/my-bookings')
      }

    } catch (error) {
      console.error('Booking error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create booking')
    } finally {
      setIsLoading(false)
    }
  }

  const isStepValid = () => {
    switch (step) {
      case 1:
        return bookingData.checkIn && bookingData.checkOut && bookingData.guests > 0 && bookingData.roomId
      case 2:
        return true // Special requests are optional
      case 3:
        return true
      default:
        return false
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!session) {
    return null // Will redirect to sign in
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      {/* Header */}
      <section className="pt-20 pb-8 bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-3xl font-serif font-bold">Book Your Stay</h1>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-center space-x-8">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= stepNumber ? 'bg-white text-primary-600' : 'bg-white/20 text-white'
                }`}>
                  {step > stepNumber ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{stepNumber}</span>
                  )}
                </div>
                {stepNumber < 3 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step > stepNumber ? 'bg-white' : 'bg-white/20'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Booking Form */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <form onSubmit={handleSubmit}>
                {/* Step 1: Dates and Guests */}
                {step === 1 && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold mb-6">Select Dates & Guests</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">Check-in Date</label>
                        <input
                          type="date"
                          value={bookingData.checkIn}
                          onChange={(e) => handleInputChange('checkIn', e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="input-field"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Check-out Date</label>
                        <input
                          type="date"
                          value={bookingData.checkOut}
                          onChange={(e) => handleInputChange('checkOut', e.target.value)}
                          min={bookingData.checkIn || new Date().toISOString().split('T')[0]}
                          className="input-field"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Number of Guests</label>
                      <select
                        value={bookingData.guests}
                        onChange={(e) => handleInputChange('guests', parseInt(e.target.value))}
                        className="input-field"
                      >
                        {[1, 2, 3, 4, 5, 6].map(num => (
                          <option key={num} value={num}>{num} Guest{num > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>

                    {!selectedRoomId && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Select Room Type</label>
                        <select
                          value={bookingData.roomId}
                          onChange={(e) => handleInputChange('roomId', e.target.value)}
                          className="input-field"
                          required
                        >
                          <option value="">Select a room</option>
                          {rooms.map(room => (
                            <option key={room.id} value={room.id}>
                              {room.name} - {formatPrice(room.price)}/night
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Special Requests */}
                {step === 2 && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold mb-6">Special Requests</h2>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Special Requests (Optional)</label>
                      <textarea
                        value={bookingData.specialRequests}
                        onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                        className="input-field min-h-[100px]"
                        placeholder="Any special requests or preferences..."
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Payment */}
                {step === 3 && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold mb-6">Payment</h2>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Payment Method</label>
                      <div className="space-y-3">
                        <label className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="pay_later"
                            checked={bookingData.paymentMethod === 'pay_later'}
                            onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                            className="text-primary-600"
                          />
                          <span>Pay Later (at check-in)</span>
                        </label>
                        <label className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="pay_now"
                            checked={bookingData.paymentMethod === 'pay_now'}
                            onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                            className="text-primary-600"
                          />
                          <span>Pay Now (secure online payment)</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8">
                  {step > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(step - 1)}
                    >
                      Previous
                    </Button>
                  )}
                  
                  <Button
                    type={step === 3 ? 'submit' : 'button'}
                    onClick={step < 3 ? () => setStep(step + 1) : undefined}
                    disabled={!isStepValid() || isLoading}
                    className="ml-auto"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : step === 3 ? (
                      <CreditCard className="w-4 h-4 mr-2" />
                    ) : (
                      <Calendar className="w-4 h-4 mr-2" />
                    )}
                    {step === 3 ? (isLoading ? 'Processing...' : 'Complete Booking') : 'Next'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-8">
              <h3 className="text-xl font-bold mb-4">Booking Summary</h3>
              
              {selectedRoom && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{selectedRoom.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{selectedRoom.type}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Check-in:</span>
                      <span>{bookingData.checkIn || 'Not selected'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Check-out:</span>
                      <span>{bookingData.checkOut || 'Not selected'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Nights:</span>
                      <span>{nights}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Guests:</span>
                      <span>{bookingData.guests}</span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Room Rate</span>
                        <span>{formatPrice(selectedRoom.price)}/night</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span>Subtotal</span>
                        <span>{formatPrice(totalAmount)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span>Tax (10%)</span>
                        <span>{formatPrice(tax)}</span>
                      </div>
                      
                      <hr className="my-2" />
                      
                      <div className="flex justify-between items-center font-bold text-lg">
                        <span>Total</span>
                        <span>{formatPrice(finalTotal)}</span>
                      </div>
                    </div>
                    
                    {step === 3 && (
                      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Payment Method: <span className="font-medium capitalize">
                            {bookingData.paymentMethod === 'pay_now' ? 'Pay Now' : 'Pay Later'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BookingPageContent />
    </Suspense>
  )
} 