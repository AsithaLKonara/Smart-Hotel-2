"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, MapPin, DoorOpen, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PremiumSpinner } from '@/components/ui/premium-spinner'

export function GuestStayDetails() {
  const [booking, setBooking] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchActiveBooking()
  }, [])

  const fetchActiveBooking = async () => {
    try {
      const res = await fetch('/api/bookings?active=true')
      const data = await res.json()
      // Assume the first one is the active stay
      setBooking(data[0] || null)
    } catch (error) {
      console.error('Error fetching active booking:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) return <PremiumSpinner text="Loading stay details..." />
  if (!booking) return (
    <Card className="bg-[#0c0c0c] border-white/5 p-10 rounded-[40px] text-center">
      <p className="text-white/40">No active stay found.</p>
    </Card>
  )

  const checkInDate = new Date(booking.checkIn)
  const checkOutDate = new Date(booking.checkOut)

  return (
    <Card className="bg-[#0c0c0c] border-white/5 rounded-[40px] overflow-hidden group">
      <div className="p-10 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-2xl font-serif font-bold text-white tracking-tight">Your Sanctuary</h3>
            <p className="text-xs text-white/40 font-medium">Active Stay • Room {booking.room?.number || 'TBA'}</p>
          </div>
          <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1 uppercase tracking-widest text-[10px] font-bold">
            {booking.status}
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-8 border-y border-white/5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white/20">
              <CalendarDays className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Check-In</span>
            </div>
            <p className="text-sm font-bold text-white">{checkInDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white/20">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Check-Out</span>
            </div>
            <p className="text-sm font-bold text-white">{checkOutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white/20">
              <DoorOpen className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Room Type</span>
            </div>
            <p className="text-sm font-bold text-white">{booking.room?.roomType?.name || 'Deluxe Suite'}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white/20">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Location</span>
            </div>
            <p className="text-sm font-bold text-white">Floor {booking.room?.floor || '4'}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4">
          <Button className="flex-1 h-14 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest">
            Modify Stay
          </Button>
          <Button className="flex-1 h-14 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest">
            Extend Booking
          </Button>
        </div>
      </div>
    </Card>
  )
}
