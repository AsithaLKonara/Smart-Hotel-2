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
 const res = await fetch('/api/bookings?status=CONFIRMED')
 if (res.ok) {
 const data = await res.json()
 // Assume the first confirmed booking is the active/upcoming stay
 setBooking(data.bookings?.[0] || null)
 }
 } catch (error) {
 console.error('Error fetching active booking:', error)
 } finally {
 setIsLoading(false)
 }
 }

 if (isLoading) return <PremiumSpinner text="Loading stay details..." />
 if (!booking) return (
 <Card className="bg-card border-border p-10 rounded-xl text-center">
 <p className="text-muted-foreground">No active stay found.</p>
 </Card>
 )

 const checkInDate = new Date(booking.checkIn)
 const checkOutDate = new Date(booking.checkOut)

 return (
 <Card className="bg-card border-border rounded-xl overflow-hidden group">
 <div className="p-10 space-y-8">
 <div className="flex items-center justify-between">
 <div className="space-y-1">
 <h3 className="text-2xl font-serif font-bold text-white tracking-tight">Your Sanctuary</h3>
 <p className="text-xs text-muted-foreground font-medium">Active Stay • Room {booking.room?.number || 'TBA'}</p>
 </div>
 <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1 text-xs font-bold">
 {booking.status}
 </Badge>
 </div>

 <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-8 border-y border-border">
 <div className="space-y-2">
 <div className="flex items-center gap-2 text-muted-foreground">
 <CalendarDays className="w-3.5 h-3.5" />
 <span className="text-xs font-bold ">Check-In</span>
 </div>
 <p className="text-sm font-bold text-white">{checkInDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
 </div>
 <div className="space-y-2">
 <div className="flex items-center gap-2 text-muted-foreground">
 <Clock className="w-3.5 h-3.5" />
 <span className="text-xs font-bold ">Check-Out</span>
 </div>
 <p className="text-sm font-bold text-white">{checkOutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
 </div>
 <div className="space-y-2">
 <div className="flex items-center gap-2 text-muted-foreground">
 <DoorOpen className="w-3.5 h-3.5" />
 <span className="text-xs font-bold ">Room Type</span>
 </div>
 <p className="text-sm font-bold text-white">{booking.room?.roomType?.name || 'Deluxe Suite'}</p>
 </div>
 <div className="space-y-2">
 <div className="flex items-center gap-2 text-muted-foreground">
 <MapPin className="w-3.5 h-3.5" />
 <span className="text-xs font-bold ">Location</span>
 </div>
 <p className="text-sm font-bold text-white">Floor {booking.room?.floor || '4'}</p>
 </div>
 </div>

 <div className="flex items-center gap-4 pt-4">
 <Button className="flex-1 h-14 bg-muted/50 hover:bg-white/10 border border-border rounded-lg text-xs font-bold ">
 Modify Stay
 </Button>
 <Button className="flex-1 h-14 bg-muted/50 hover:bg-white/10 border border-border rounded-lg text-xs font-bold ">
 Extend Booking
 </Button>
 </div>
 </div>
 </Card>
 )
}
