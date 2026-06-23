"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { canAccessReceptionistFeatures } from '@/lib/rbac-helpers'
import { Search, UserCheck, UserX, Calendar, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Booking {
  id: string
  checkIn: string
  checkOut: string
  guests: number
  status: string
  guest: {
    id: string
    name: string
    email: string
    phone?: string
  }
  room: {
    id: string
    number: string
    type: string
  }
}

export default function CheckInCheckOutPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'checkin' | 'checkout'>('checkin')
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!canAccessReceptionistFeatures(session)) {
      router.push('/auth/signin')
      return
    }

    fetchBookings()
  }, [session, status, router])

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/bookings')
      if (!response.ok) throw new Error('Failed to fetch bookings')
      const data = await response.json()
      // Ensure data is always an array
      setBookings(Array.isArray(data) ? data : (data.bookings || []))
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast.error('Failed to load bookings')
      setBookings([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async (bookingId: string) => {
    setProcessing(bookingId)
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CHECKED_IN' })
      })

      if (!response.ok) throw new Error('Failed to check in')

      toast.success('Guest checked in successfully')
      fetchBookings()
    } catch (error) {
      console.error('Error checking in:', error)
      toast.error('Failed to check in guest')
    } finally {
      setProcessing(null)
    }
  }

  const handleCheckOut = async (bookingId: string) => {
    setProcessing(bookingId)
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CHECKED_OUT' })
      })

      if (!response.ok) throw new Error('Failed to check out')

      toast.success('Guest checked out successfully')
      fetchBookings()
    } catch (error) {
      console.error('Error checking out:', error)
      toast.error('Failed to check out guest')
    } finally {
      setProcessing(null)
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const bookingsArray = Array.isArray(bookings) ? bookings : []
  const checkInBookings = bookingsArray.filter(booking => {
    if (!booking.checkIn) return false
    const checkInDate = new Date(booking.checkIn)
    checkInDate.setHours(0, 0, 0, 0)
    return booking.status === 'CONFIRMED' && checkInDate.getTime() === today.getTime()
  })

  const checkOutBookings = bookingsArray.filter(booking => {
    if (!booking.checkOut) return false
    const checkOutDate = new Date(booking.checkOut)
    checkOutDate.setHours(0, 0, 0, 0)
    return booking.status === 'CHECKED_IN' && checkOutDate.getTime() === today.getTime()
  })

  const filteredBookings = (activeTab === 'checkin' ? checkInBookings : checkOutBookings).filter(booking => {
    const searchLower = searchTerm.toLowerCase()
    return (
      booking.guest?.name?.toLowerCase().includes(searchLower) ||
      booking.guest?.email?.toLowerCase().includes(searchLower) ||
      booking.roomAssignments?.[0]?.room?.number?.toLowerCase().includes(searchLower)
    )
  })

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Check-In / Check-Out</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Process guest arrivals and departures
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Check-Ins</p>
                <p className="text-3xl font-bold">{checkInBookings.length}</p>
                <p className="text-sm text-gray-500 mt-1">Arrivals today</p>
              </div>
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <UserCheck className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Check-Outs</p>
                <p className="text-3xl font-bold">{checkOutBookings.length}</p>
                <p className="text-sm text-gray-500 mt-1">Departures today</p>
              </div>
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <UserX className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'checkin' ? 'default' : 'outline'}
          onClick={() => setActiveTab('checkin')}
          className="flex-1 md:flex-none"
        >
          <UserCheck className="w-4 h-4 mr-2" />
          Check-In ({checkInBookings.length})
        </Button>
        <Button
          variant={activeTab === 'checkout' ? 'default' : 'outline'}
          onClick={() => setActiveTab('checkout')}
          className="flex-1 md:flex-none"
        >
          <UserX className="w-4 h-4 mr-2" />
          Check-Out ({checkOutBookings.length})
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by guest name, email, or room number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-lg w-full focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Guest List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBookings.map((booking) => (
          <Card key={booking.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{booking.guest.name}</CardTitle>
                <Badge>Room {booking.roomAssignments?.[0]?.room?.number || 'TBD'}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm space-y-1">
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Email:</span> {booking.guest.email}
                  </p>
                  {booking.guest.phone && (
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Phone:</span> {booking.guest.phone}
                    </p>
                  )}
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Room Type:</span> {booking.roomAssignments?.[0]?.room?.roomType?.name || 'TBD'}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Guests:</span> {booking.guests}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  {activeTab === 'checkin' ? (
                    <span>Check-in: {formatDate(booking.checkIn)}</span>
                  ) : (
                    <span>Check-out: {formatDate(booking.checkOut)}</span>
                  )}
                </div>

                <Button
                  className="w-full"
                  onClick={() => activeTab === 'checkin' ? handleCheckIn(booking.id) : handleCheckOut(booking.id)}
                  disabled={processing === booking.id}
                >
                  {processing === booking.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : activeTab === 'checkin' ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Complete Check-In
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Complete Check-Out
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBookings.length === 0 && (
        <Card className="p-12 text-center">
          {activeTab === 'checkin' ? (
            <UserCheck className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          ) : (
            <UserX className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          )}
          <h3 className="text-xl font-semibold mb-2">
            {activeTab === 'checkin' ? 'No pending check-ins' : 'No pending check-outs'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm 
              ? 'Try adjusting your search'
              : `No ${activeTab === 'checkin' ? 'arrivals' : 'departures'} scheduled for today`
            }
          </p>
        </Card>
      )}
    </div>
  )
}









