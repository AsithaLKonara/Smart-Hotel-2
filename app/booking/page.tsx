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
  Shield,
  Clock,
  MapPin,
  ChevronRight,
  Wind,
  Wifi
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'
import Image from 'next/image'
import { PremiumSpinner } from '@/components/ui/premium-spinner'

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
      } else {
        toast.error(data.error || 'Failed to search rooms')
      }
    } catch (error) {
      toast.error('Failed to search rooms')
    } finally {
      setIsSearching(false)
    }
  }

  const createBooking = async () => {
    if (!selectedRoom) return
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload)
      })
      if (response.ok) setStep(4)
      else toast.error('Failed to create booking')
    } catch (error) {
      toast.error('Failed to create booking')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white text-midnight min-h-screen">
      {/* Header Section */}
      <section className="bg-midnight pt-32 pb-20">
        <div className="container mx-auto px-4 text-center space-y-6">
          <div className="flex items-center justify-center space-x-3 text-luxury uppercase tracking-[0.4em] text-[10px] font-bold">
            <div className="w-10 h-px bg-luxury" />
            <span>Reservation Flow</span>
            <div className="w-10 h-px bg-luxury" />
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white">Secure Your <span className="text-luxury italic">Stay</span></h1>
          
          {/* Progress Indicator */}
          <div className="max-w-3xl mx-auto pt-10">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-1/2 left-0 w-full h-px bg-white/10 -translate-y-1/2" />
              {[
                { s: 1, t: 'Dates', i: Calendar },
                { s: 2, t: 'Selection', i: Users },
                { s: 3, t: 'Details', i: CreditCard },
                { s: 4, t: 'Finalize', i: CheckCircle }
              ].map(({ s, t, i: Icon }) => (
                <div key={s} className="relative z-10 flex flex-col items-center space-y-3">
                  <div className={`w-12 h-12 rounded-none flex items-center justify-center transition-all duration-500 border ${
                    step >= s ? 'bg-luxury border-luxury text-midnight' : 'bg-midnight border-white/20 text-white/40'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] uppercase tracking-widest font-bold ${step >= s ? 'text-luxury' : 'text-white/20'}`}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Step 1: Search */}
            {step === 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-7 relative aspect-[4/3] overflow-hidden shadow-2xl">
                   <Image 
                    src="https://images.unsplash.com/photo-1590490359683-658d3d23f972?auto=format&fit=crop&q=80&w=1200" 
                    alt="Luxury Suite" 
                    fill 
                    className="object-cover" 
                   />
                   <div className="absolute inset-0 bg-midnight/20" />
                </div>
                <div className="lg:col-span-5 space-y-8">
                  <div className="space-y-4">
                    <h2 className="text-3xl font-serif font-bold">Plan Your Arrival</h2>
                    <p className="text-gray-500 font-light">Select your preferred dates and guest count to view our available luxury accommodations.</p>
                  </div>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Check-in</label>
                        <input 
                          type="date" 
                          className="w-full bg-gray-50 border-none px-4 py-4 text-sm focus:ring-1 focus:ring-luxury"
                          value={searchData.checkIn}
                          onChange={(e) => setSearchData({...searchData, checkIn: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Check-out</label>
                        <input 
                          type="date" 
                          className="w-full bg-gray-50 border-none px-4 py-4 text-sm focus:ring-1 focus:ring-luxury"
                          value={searchData.checkOut}
                          onChange={(e) => setSearchData({...searchData, checkOut: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Guests</label>
                      <select 
                        className="w-full bg-gray-50 border-none px-4 py-4 text-sm focus:ring-1 focus:ring-luxury"
                        value={searchData.guests}
                        onChange={(e) => setSearchData({...searchData, guests: parseInt(e.target.value)})}
                      >
                        {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} Guests</option>)}
                      </select>
                    </div>
                  </div>
                  <Button 
                    onClick={searchRooms}
                    disabled={isSearching || !searchData.checkIn || !searchData.checkOut}
                    className="w-full bg-midnight text-white h-16 rounded-none uppercase tracking-[0.2em] text-xs font-bold hover:bg-midnight/90"
                  >
                    {isSearching ? 'Curating Options...' : 'Check Availability'}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Selection */}
            {step === 2 && (
              <div className="space-y-12">
                <div className="flex justify-between items-end border-b border-gray-100 pb-8">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-serif font-bold">Select Your Suite</h2>
                    <p className="text-gray-400 text-sm">{nights} Nights | {searchData.guests} Guests</p>
                  </div>
                  <Button variant="ghost" onClick={() => setStep(1)} className="text-luxury text-[10px] uppercase tracking-widest font-bold">Modify Dates</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {availableRooms.map((room: any) => (
                    <div key={room.id} className="group flex flex-col h-full bg-gray-50 hover:bg-white hover:shadow-2xl transition-all duration-500">
                       <div className="relative aspect-video overflow-hidden">
                          <Image 
                            src={room.roomImages?.[0]?.url || "https://images.unsplash.com/photo-1590490359683-658d3d23f972?auto=format&fit=crop&q=80&w=800"} 
                            alt={room.type} 
                            fill 
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                          <div className="absolute top-4 right-4 bg-midnight/80 backdrop-blur-md px-4 py-2 text-luxury font-serif italic">
                            {formatPrice(room.totalPrice)} <span className="text-[10px] text-white/50 uppercase tracking-tighter not-italic ml-1">Total</span>
                          </div>
                       </div>
                       <div className="p-8 flex-1 flex flex-col space-y-6">
                          <div className="space-y-1">
                            <p className="text-[10px] uppercase tracking-widest text-luxury font-bold">Floor {room.floor}</p>
                            <h3 className="text-2xl font-serif font-bold">{room.type} Room</h3>
                          </div>
                          <p className="text-gray-500 text-sm font-light line-clamp-2 leading-relaxed">{room.description}</p>
                          <div className="flex gap-6 pt-4 border-t border-gray-100 mt-auto">
                            <div className="flex items-center gap-2 text-gray-400"><Users className="w-4 h-4" /><span className="text-[10px] font-bold">{room.capacity}</span></div>
                            <div className="flex items-center gap-2 text-gray-400"><Wind className="w-4 h-4" /><span className="text-[10px] font-bold">{room.size} m²</span></div>
                            <div className="flex items-center gap-2 text-gray-400"><Star className="w-4 h-4 fill-luxury text-luxury" /><span className="text-[10px] font-bold">{room.averageRating || '5.0'}</span></div>
                          </div>
                          <Button 
                            onClick={() => { setSelectedRoom(room); setStep(3); }}
                            className="w-full bg-gold-gradient text-white h-14 rounded-none uppercase tracking-[0.2em] text-xs font-bold border-none"
                          >
                            Select This Suite
                          </Button>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Details */}
            {step === 3 && selectedRoom && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-8 space-y-12">
                   <div className="space-y-8">
                     <h2 className="text-3xl font-serif font-bold">Guest Particulars</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Full Name</label>
                          <input 
                            type="text" 
                            className="w-full bg-gray-50 border-none px-6 py-4 text-sm focus:ring-1 focus:ring-luxury"
                            value={bookingData.guestName}
                            onChange={(e) => setBookingData({...bookingData, guestName: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Email Address</label>
                          <input 
                            type="email" 
                            className="w-full bg-gray-50 border-none px-6 py-4 text-sm focus:ring-1 focus:ring-luxury"
                            value={bookingData.guestEmail}
                            onChange={(e) => setBookingData({...bookingData, guestEmail: e.target.value})}
                          />
                        </div>
                     </div>
                   </div>

                   <div className="space-y-8">
                      <h2 className="text-3xl font-serif font-bold">Special Requests</h2>
                      <textarea 
                        rows={4}
                        className="w-full bg-gray-50 border-none px-6 py-4 text-sm focus:ring-1 focus:ring-luxury resize-none"
                        placeholder="Dietary requirements, floor preference, or special occasions..."
                        value={bookingData.specialRequests}
                        onChange={(e) => setBookingData({...bookingData, specialRequests: e.target.value})}
                      />
                   </div>

                   <div className="space-y-8">
                      <h2 className="text-3xl font-serif font-bold text-midnight">Payment Method</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                          { id: 'pay_later', t: 'Pay at Arrival', d: 'Secure booking with credit card guarantee.' },
                          { id: 'pay_now', t: 'Pay Securely Now', d: 'Accelerated check-in upon arrival.' }
                        ].map((m) => (
                          <div 
                            key={m.id}
                            onClick={() => setBookingData({...bookingData, paymentMethod: m.id as any})}
                            className={`p-8 border cursor-pointer transition-all ${
                              bookingData.paymentMethod === m.id ? 'border-luxury bg-luxury/5' : 'border-gray-100 hover:border-gray-300'
                            }`}
                          >
                            <h4 className="font-serif font-bold text-midnight mb-2">{m.t}</h4>
                            <p className="text-gray-400 text-xs font-light">{m.d}</p>
                          </div>
                        ))}
                      </div>
                   </div>
                </div>

                <div className="lg:col-span-4">
                  <div className="bg-midnight p-10 text-white space-y-8 sticky top-32">
                    <h3 className="text-xl font-serif font-bold border-b border-white/10 pb-4">Stay Summary</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between text-xs uppercase tracking-widest text-white/50">
                        <span>Suite</span>
                        <span className="text-white font-bold">{selectedRoom.type}</span>
                      </div>
                      <div className="flex justify-between text-xs uppercase tracking-widest text-white/50">
                        <span>Duration</span>
                        <span className="text-white font-bold">{nights} Nights</span>
                      </div>
                      <div className="flex justify-between text-xs uppercase tracking-widest text-white/50">
                        <span>Arrival</span>
                        <span className="text-white font-bold">{searchData.checkIn}</span>
                      </div>
                    </div>
                    <div className="pt-6 border-t border-white/10 space-y-6">
                      <div className="flex justify-between items-end">
                        <span className="text-luxury uppercase tracking-widest text-[10px] font-bold">Total Amount</span>
                        <span className="text-3xl font-serif font-bold text-luxury">{formatPrice(totalAmount)}</span>
                      </div>
                      <Button 
                        onClick={createBooking}
                        disabled={isLoading}
                        className="w-full bg-luxury text-midnight h-16 rounded-none uppercase tracking-[0.2em] text-xs font-bold border-none hover:bg-luxury/90"
                      >
                        {isLoading ? 'Processing...' : 'Confirm Reservation'}
                      </Button>
                      <div className="flex items-center gap-2 text-[10px] text-white/30 uppercase tracking-widest justify-center">
                        <Shield className="w-3 h-3" />
                        <span>Secure SSL Encryption</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {step === 4 && (
              <div className="text-center py-20 space-y-10">
                <div className="w-24 h-24 bg-luxury/10 flex items-center justify-center mx-auto text-luxury">
                  <CheckCircle className="w-12 h-12" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-5xl font-serif font-bold text-midnight">Reservation <span className="text-luxury italic">Confirmed</span></h2>
                  <p className="text-gray-500 font-light max-w-xl mx-auto">Your sanctuary awaits. A confirmation email with your booking details and arrival guide has been dispatched to your inbox.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                   <Button onClick={() => router.push('/my-bookings')} className="bg-midnight text-white h-14 rounded-none px-10 uppercase tracking-widest text-[10px] font-bold">Manage Booking</Button>
                   <Button variant="outline" onClick={() => router.push('/')} className="border-midnight text-midnight h-14 rounded-none px-10 uppercase tracking-widest text-[10px] font-bold">Return Home</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-midnight flex items-center justify-center">
        <PremiumSpinner size="lg" text="Preparing Your Experience..." color="text-luxury" />
      </div>
    }>
      <BookingPageContent />
    </Suspense>
  )
}