"use client"

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { canAccessReceptionistFeatures } from '@/lib/rbac-helpers'
import { Calendar, Search, Filter, DollarSign, User, Bed, Edit, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  confirmationCode?: string
  user: {
    id: string
    name: string
    email: string
  }
  room: {
    id: string
    number: string
    type: string
    price: number
  }
}

export default function AdminBookingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPayment, setFilterPayment] = useState('all')

  const fetchBookings = useCallback(async () => {
    try {
      // Bookings page: 10s timeout (may have many bookings with relations)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      const response = await fetch('/api/bookings', {
        // Be explicit to avoid any caching / SW interference
        method: 'GET',
        cache: 'no-store',
        credentials: 'include',
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (controller.signal.aborted) {
        throw new Error('Request timeout - bookings data took too long to load')
      }

      // Redirect unauthenticated users cleanly
      if (response.status === 401) {
        router.push('/auth/signin?callbackUrl=/admin/bookings')
        return
      }

      if (!response.ok) {
        console.error('Failed to fetch bookings. Status:', response.status)
        throw new Error('Failed to fetch bookings')
      }

      const data = await response.json()
      // Ensure data is always an array even if the API returns { bookings: [...] }
      const bookingsArray: Booking[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.bookings)
        ? data.bookings
        : []

      setBookings(bookingsArray)
    } catch (error: any) {
      console.error('Error fetching bookings:', error)
      // Handle timeout errors gracefully
      if (error.name === 'AbortError' || error.message?.includes('timeout')) {
        toast.error('Bookings are taking longer than expected. Please refresh the page.')
      } else {
        toast.error('Failed to load bookings')
      }
      setBookings([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (status === 'loading') return
    
    if (!canAccessReceptionistFeatures(session)) {
      router.push('/auth/signin')
      return
    }

    fetchBookings()
  }, [session, status, router, fetchBookings])

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) throw new Error('Failed to update booking')

      toast.success(`Booking ${newStatus.toLowerCase()} successfully`)
      fetchBookings()
    } catch (error) {
      console.error('Error updating booking:', error)
      toast.error('Failed to update booking')
    }
  }

  const filteredBookings = (Array.isArray(bookings) ? bookings : []).filter(booking => {
    const matchesSearch = booking.confirmationCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.room?.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || booking.status === filterStatus
    const matchesPayment = filterPayment === 'all' || booking.paymentStatus === filterPayment
    return matchesSearch && matchesStatus && matchesPayment
  })

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
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const bookingsArray = Array.isArray(bookings) ? bookings : []
  const statsData = {
    total: bookingsArray.length,
    confirmed: bookingsArray.filter(b => b.status === 'CONFIRMED').length,
    checkedIn: bookingsArray.filter(b => b.status === 'CHECKED_IN').length,
    checkedOut: bookingsArray.filter(b => b.status === 'CHECKED_OUT').length,
    pending: bookingsArray.filter(b => b.status === 'PENDING').length,
    totalRevenue: bookingsArray
      .filter(b => b.paymentStatus === 'PAID')
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0)
  }

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
        <h1 className="text-3xl font-bold mb-2">Booking Management</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage guest reservations and bookings
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Bookings</p>
                <p className="text-2xl font-bold">{statsData.total}</p>
              </div>
              <Calendar className="w-8 h-8 text-primary-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Confirmed</p>
                <p className="text-2xl font-bold text-green-600">{statsData.confirmed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Checked In</p>
                <p className="text-2xl font-bold text-blue-600">{statsData.checkedIn}</p>
              </div>
              <Bed className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-primary-600">
                  {formatPrice(statsData.totalRevenue)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-primary-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by confirmation code, room, guest..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-lg w-full focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CHECKED_IN">Checked In</option>
          <option value="CHECKED_OUT">Checked Out</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <select
          value={filterPayment}
          onChange={(e) => setFilterPayment(e.target.value)}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Payment</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
        </select>
      </div>

      {/* Bookings Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guest
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Room
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">
                        {booking.confirmationCode || booking.id.slice(-8)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {booking.guests} guest{booking.guests > 1 ? 's' : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium">{booking.user.name}</div>
                      <div className="text-xs text-gray-500">{booking.user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">Room {booking.room.number}</div>
                      <div className="text-xs text-gray-500">{booking.room.type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div>{formatDate(booking.checkIn)}</div>
                      <div className="text-gray-500">to {formatDate(booking.checkOut)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">{formatPrice(booking.totalAmount)}</div>
                      <Badge className={`${getPaymentStatusColor(booking.paymentStatus)} text-xs`}>
                        {booking.paymentStatus}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        {booking.status === 'PENDING' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(booking.id, 'CONFIRMED')}
                          >
                            Confirm
                          </Button>
                        )}
                        {booking.status === 'CONFIRMED' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(booking.id, 'CHECKED_IN')}
                          >
                            Check In
                          </Button>
                        )}
                        {booking.status === 'CHECKED_IN' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(booking.id, 'CHECKED_OUT')}
                          >
                            Check Out
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredBookings.length === 0 && (
            <div className="p-12 text-center">
              <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No bookings found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || filterStatus !== 'all' || filterPayment !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No bookings have been made yet'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}





