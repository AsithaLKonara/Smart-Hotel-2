"use client"

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Calendar, Users, DollarSign, CheckCircle, XCircle, Clock, Eye, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
// Navigation is handled by layout.tsx
import { formatPrice, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Booking {
  id: string
  checkIn: string
  checkOut: string
  guests: number
  totalAmount: number
  status: string
  paymentStatus: string
  specialRequests?: string
  room: {
    id: string
    number: string
    type: string
    price: number
  }
  invoice?: {
    id: string
    total: number
    status: string
  }
}

export default function MyBookingsPage() {
  const { data: session, status } = useSession() || { data: null, status: 'unauthenticated' }
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [cancellingBooking, setCancellingBooking] = useState<string | null>(null)
  const userId = session?.user?.id
    
  const fetchBookings = useCallback(async () => {
    if (!userId) {
      return
    }
    try {
      const response = await fetch('/api/bookings?userId=' + userId)
      if (!response.ok) {
        throw new Error('Failed to fetch bookings')
      }
      const data = await response.json()
      // API returns { bookings: [...] } but we need an array
      const bookingsArray = Array.isArray(data) ? data : (Array.isArray(data?.bookings) ? data.bookings : [])
      setBookings(bookingsArray)
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/signin?callbackUrl=/my-bookings')
      return
    }

    fetchBookings()
  }, [session, status, router, fetchBookings])

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return
    }

    setCancellingBooking(bookingId)
    
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })

      if (!response.ok) {
        throw new Error('Failed to cancel booking')
      }

      toast.success('Booking cancelled successfully')
      await fetchBookings() // Refresh the list
    } catch (error) {
      console.error('Error cancelling booking:', error)
      toast.error('Failed to cancel booking')
    } finally {
      setCancellingBooking(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'CHECKED_IN':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'CHECKED_OUT':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'FAILED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'REFUNDED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const canCancelBooking = (booking: Booking) => {
    return ['PENDING', 'CONFIRMED'].includes(booking.status) && 
           new Date(booking.checkIn) > new Date()
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Bookings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your hotel reservations and view booking details
          </p>
        </div>

        {bookings.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No bookings found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You haven't made any bookings yet.
              </p>
              <Button onClick={() => router.push('/booking')}>
                Book a Room
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {bookings.map((booking) => (
              <Card key={booking.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Room {booking.room.number} - {booking.room.type}
                      </CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Booking ID: {booking.id}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={getPaymentStatusColor(booking.paymentStatus)}>
                        {booking.paymentStatus}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Check-in</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(booking.checkIn)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Check-out</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(booking.checkOut)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Guests</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {booking.guests}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">
                        {formatPrice(booking.totalAmount)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedBooking(booking)
                          setShowDetailsModal(true)
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Details
                      </Button>
                      
                      {canCancelBooking(booking) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelBooking(booking.id)}
                          disabled={cancellingBooking === booking.id}
                        >
                          {cancellingBooking === booking.id ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 mr-1" />
                          )}
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Booking Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetailsModal(false)}
              >
                <XCircle className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Room</p>
                <p>Room {selectedBooking.room.number} - {selectedBooking.room.type}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Dates</p>
                <p>{formatDate(selectedBooking.checkIn)} - {formatDate(selectedBooking.checkOut)}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Guests</p>
                <p>{selectedBooking.guests} guest{selectedBooking.guests > 1 ? 's' : ''}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</p>
                <p className="font-semibold">{formatPrice(selectedBooking.totalAmount)}</p>
              </div>
              
              {selectedBooking.specialRequests && (
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Special Requests</p>
                  <p className="text-sm">{selectedBooking.specialRequests}</p>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(selectedBooking.status)}>
                  {selectedBooking.status.replace('_', ' ')}
                </Badge>
                <Badge className={getPaymentStatusColor(selectedBooking.paymentStatus)}>
                  {selectedBooking.paymentStatus}
                </Badge>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 