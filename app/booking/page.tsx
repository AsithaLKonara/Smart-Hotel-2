"use client"

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  Calendar, Users, CreditCard, CheckCircle, ArrowLeft, ArrowRight,
  Star, Shield, Clock, MapPin, Wind, Wifi, Phone, LogIn, ChevronLeft, ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'
import Image from 'next/image'
import Link from 'next/link'
import { PremiumSpinner } from '@/components/ui/premium-spinner'

function BookingPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const carouselRef = useRef<HTMLDivElement>(null)

   const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [searchData, setSearchData] = useState({ checkIn: '', checkOut: '', guests: 2, roomType: 'all' })
  const [availableRooms, setAvailableRooms] = useState<any[]>([])
  const [selectedRoom, setSelectedRoom] = useState<any>(null)
  const [bookingData, setBookingData] = useState({
    roomId: '', specialRequests: '',
    paymentMethod: 'pay_later' as 'pay_now' | 'pay_later',
    guestName: '', guestEmail: '', guestPhone: ''
  })
  const [nights, setNights] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const [carouselIdx, setCarouselIdx] = useState(0)

  // Load cached details from localStorage if present after redirect/login
  useEffect(() => {
    try {
      const cached = localStorage.getItem('smarthotel_booking_cache')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed.searchData) setSearchData(parsed.searchData)
        if (parsed.selectedRoom) setSelectedRoom(parsed.selectedRoom)
        if (parsed.bookingData) setBookingData(parsed.bookingData)
        if (parsed.step) setStep(parsed.step)
        // Auto-populate available rooms list if a room was selected
        if (parsed.selectedRoom) {
          setAvailableRooms([parsed.selectedRoom])
        }
        localStorage.removeItem('smarthotel_booking_cache')
      }
    } catch (e) {
      console.error('Failed to load booking cache', e)
    }
  }, [])

  useEffect(() => {
    if (searchData.checkIn && searchData.checkOut) {
      const diff = Math.abs(new Date(searchData.checkOut).getTime() - new Date(searchData.checkIn).getTime())
      setNights(Math.ceil(diff / (1000 * 60 * 60 * 24)))
    }
  }, [searchData.checkIn, searchData.checkOut])

  useEffect(() => {
    if (selectedRoom && nights > 0) {
      setTotalAmount(selectedRoom.totalPrice)
      setBookingData(prev => ({ ...prev, roomId: selectedRoom.id }))
    }
  }, [selectedRoom, nights])

  const searchRooms = async () => {
    if (!searchData.checkIn || !searchData.checkOut) { toast.error('Please select dates'); return }
    setIsSearching(true)
    try {
      const params = new URLSearchParams({ checkin: searchData.checkIn, checkout: searchData.checkOut, guests: searchData.guests.toString(), type: searchData.roomType })
      const res = await fetch(`/api/rooms/availability?${params}`)
      const data = await res.json()
      if (res.ok) { setAvailableRooms(data.availableRooms); setStep(2); setCarouselIdx(0) }
      else toast.error(data.error || 'Failed to search rooms')
    } catch { toast.error('Failed to search rooms') }
    finally { setIsSearching(false) }
  }

  const handleAuthRedirect = () => {
    try {
      const cacheData = {
        searchData,
        selectedRoom,
        bookingData,
        step: 3
      }
      localStorage.setItem('smarthotel_booking_cache', JSON.stringify(cacheData))
    } catch (e) {
      console.error('Failed to save booking cache', e)
    }
    router.push(`/auth/signin?callbackUrl=/booking`)
  }

  const createBooking = async () => {
    if (!selectedRoom) return
    if (!session?.user) {
      toast.error('Authentication required to book. Redirecting to login...')
      handleAuthRedirect()
      return
    }
    setIsLoading(true)
    try {
      const payload = {
        roomId: selectedRoom.id, 
        checkIn: new Date(searchData.checkIn).toISOString(), 
        checkOut: new Date(searchData.checkOut).toISOString(),
        guests: searchData.guests, totalAmount, specialRequests: bookingData.specialRequests,
        paymentMethod: bookingData.paymentMethod,
        ...(session ? {} : { guestName: bookingData.guestName, guestEmail: bookingData.guestEmail, guestPhone: bookingData.guestPhone })
      }
      const res = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) setStep(4)
      else toast.error('Failed to create booking')
    } catch { toast.error('Failed to create booking') }
    finally { setIsLoading(false) }
  }

  const inputClass = "w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 px-5 py-4 rounded-xl text-sm focus:ring-1 focus:ring-primary transition-all"
  const labelClass = "text-[10px] uppercase tracking-widest font-bold text-white/40"

  const scrollCarousel = (dir: 'prev' | 'next') => {
    const newIdx = dir === 'next'
      ? Math.min(carouselIdx + 1, availableRooms.length - 1)
      : Math.max(carouselIdx - 1, 0)
    setCarouselIdx(newIdx)
    const card = carouselRef.current?.children[newIdx] as HTMLElement
    card?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }

  return (
    <div className="bg-transparent text-white min-h-screen">
      {/* Header */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50" />
        <div className="relative z-10 container mx-auto px-4 text-center space-y-6">
          <div className="flex items-center justify-center space-x-3 text-primary uppercase tracking-[0.4em] text-[10px] font-bold">
            <div className="w-10 h-px bg-primary" />
            <span>Reservation Flow</span>
            <div className="w-10 h-px bg-primary" />
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white">Secure Your <span className="text-primary italic">Stay</span></h1>
          
          {/* Progress */}
          <div className="max-w-2xl mx-auto pt-8">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-6 left-0 w-full h-px bg-white/10" />
              {[{ s: 1, t: 'Dates', i: Calendar }, { s: 2, t: 'Select', i: Users }, { s: 3, t: 'Details', i: CreditCard }, { s: 4, t: 'Done', i: CheckCircle }].map(({ s, t, i: Icon }) => (
                <div key={s} className="relative z-10 flex flex-col items-center space-y-2">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 border ${step >= s ? 'bg-gold-gradient border-primary/50 text-white shadow-luxury' : 'bg-white/5 border-white/10 text-white/30'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[9px] uppercase tracking-widest font-bold ${step >= s ? 'text-primary' : 'text-white/20'}`}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-6xl">

          {/* Step 1: Dates */}
          {step === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 relative aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl">
                <Image src="https://images.unsplash.com/photo-1590490359683-658d3d23f972?auto=format&fit=crop&q=80&w=1200" alt="Luxury Suite" fill className="object-cover" />
                <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
              <div className="lg:col-span-6 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 lg:p-12 shadow-2xl space-y-8">
                <div className="space-y-3">
                  <h2 className="text-3xl font-serif font-bold text-white">Plan Your Arrival</h2>
                  <p className="text-white/40 font-light text-sm">Select your preferred dates and guest count to view available luxury accommodations.</p>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className={labelClass}>Check-in</label>
                      <input type="date" className={inputClass} value={searchData.checkIn} onChange={e => setSearchData({...searchData, checkIn: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className={labelClass}>Check-out</label>
                      <input type="date" className={inputClass} value={searchData.checkOut} onChange={e => setSearchData({...searchData, checkOut: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className={labelClass}>Guests</label>
                    <select className={inputClass} value={searchData.guests} onChange={e => setSearchData({...searchData, guests: parseInt(e.target.value)})}>
                      {[1,2,3,4,5,6].map(n => <option key={n} value={n} className="bg-midnight">{n} {n === 1 ? 'Guest' : 'Guests'}</option>)}
                    </select>
                  </div>
                </div>
                <Button onClick={searchRooms} disabled={isSearching || !searchData.checkIn || !searchData.checkOut} className="w-full bg-gold-gradient text-white h-14 rounded-xl uppercase tracking-[0.2em] text-xs font-bold border-none shadow-luxury hover:opacity-90">
                  {isSearching ? 'Curating Options...' : 'Check Availability'}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Carousel Room Selection */}
          {step === 2 && (
            <div className="space-y-10">
              <div className="flex justify-between items-end border-b border-white/10 pb-6">
                <div className="space-y-1">
                  <h2 className="text-3xl font-serif font-bold text-white">Select Your Suite</h2>
                  <p className="text-white/40 text-sm">{nights} Night{nights !== 1 ? 's' : ''} · {searchData.guests} Guest{searchData.guests !== 1 ? 's' : ''}</p>
                </div>
                <Button variant="ghost" onClick={() => setStep(1)} className="text-primary text-[10px] uppercase tracking-widest font-bold hover:text-primary/80">
                  ← Modify Dates
                </Button>
              </div>

              {availableRooms.length === 0 ? (
                <div className="text-center py-20 space-y-4">
                  <h3 className="text-2xl font-serif text-white/40">No suites available for these dates.</h3>
                  <Button onClick={() => setStep(1)} className="bg-gold-gradient text-white rounded-xl px-8 h-12 uppercase tracking-widest text-xs font-bold border-none">Try Different Dates</Button>
                </div>
              ) : (
                <div className="relative">
                  {/* Carousel arrows */}
                  {carouselIdx > 0 && (
                    <button onClick={() => scrollCarousel('prev')} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 z-20 w-12 h-12 bg-black/60 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:border-primary/40 hover:text-primary transition-all">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}
                  {carouselIdx < availableRooms.length - 1 && (
                    <button onClick={() => scrollCarousel('next')} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 z-20 w-12 h-12 bg-black/60 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:border-primary/40 hover:text-primary transition-all">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}

                  {/* Carousel Track */}
                  <div ref={carouselRef} className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4">
                    {availableRooms.map((room: any, idx: number) => (
                      <div key={room.id} className={`flex-none w-[85%] md:w-[48%] snap-center group bg-white/5 backdrop-blur-md border rounded-2xl overflow-hidden transition-all duration-300 ${idx === carouselIdx ? 'border-primary/30 shadow-luxury' : 'border-white/10'}`}>
                        <div className="relative aspect-video overflow-hidden">
                          <Image
                            src={room.roomImages?.[0]?.url || "https://images.unsplash.com/photo-1590490359683-658d3d23f972?auto=format&fit=crop&q=80&w=800"}
                            alt={room.type} fill className="object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                          <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-primary/20">
                            <span className="text-primary font-serif italic text-sm">{formatPrice(room.totalPrice)}</span>
                            <span className="text-white/40 text-[9px] uppercase ml-1">Total</span>
                          </div>
                          <div className="absolute bottom-4 left-4 flex gap-0.5">
                            {[...Array(5)].map((_, i) => <Star key={i} className="w-2.5 h-2.5 fill-primary text-primary" />)}
                          </div>
                        </div>
                        <div className="p-6 space-y-5">
                          <div className="space-y-1">
                            <p className="text-[9px] uppercase tracking-widest text-primary font-bold">Floor {room.floor}</p>
                            <h3 className="text-xl font-serif font-bold text-white">{room.type} Suite</h3>
                          </div>
                          <p className="text-white/50 text-sm font-light line-clamp-2 leading-relaxed">{room.description}</p>
                          <div className="flex gap-4 text-white/40 text-[10px] uppercase tracking-wider font-bold">
                            <div className="flex items-center gap-1"><Users className="w-3 h-3" />{room.capacity}</div>
                            <div className="flex items-center gap-1"><Wind className="w-3 h-3" />{room.size} m²</div>
                            <div className="flex items-center gap-1"><Wifi className="w-3 h-3" />WiFi</div>
                          </div>
                          <div className="flex gap-3 pt-2">
                            <Link href={`/rooms/${room.id}`} target="_blank" className="flex-1">
                              <Button variant="outline" className="w-full border-white/20 text-white rounded-xl h-11 uppercase tracking-widest text-[9px] font-bold hover:bg-white/10 transition-all">
                                View Details
                              </Button>
                            </Link>
                            <Button onClick={() => { setSelectedRoom(room); setStep(3) }} className="flex-1 bg-gold-gradient text-white rounded-xl h-11 uppercase tracking-[0.15em] text-[9px] font-bold border-none shadow-luxury">
                              Select Suite
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Dot indicators */}
                  <div className="flex justify-center gap-2 mt-6">
                    {availableRooms.map((_, idx) => (
                      <button key={idx} onClick={() => { setCarouselIdx(idx); scrollCarousel(idx > carouselIdx ? 'next' : 'prev') }}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === carouselIdx ? 'bg-primary w-6' : 'bg-white/20'}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Guest Details */}
          {step === 3 && selectedRoom && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-8 space-y-10">

                {/* Auth guard */}
                {!session?.user && (
                  <div className="bg-primary/10 border border-primary/20 rounded-2xl p-8 space-y-4">
                    <div className="flex items-center gap-3">
                      <LogIn className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-serif font-bold text-white">Authentication Required</h3>
                    </div>
                    <p className="text-white/50 text-sm font-light">You must sign in or create an account to finalize your reservation. Your selected dates and suite will be saved.</p>
                    <Button onClick={handleAuthRedirect} className="bg-gold-gradient text-white rounded-xl px-8 h-12 uppercase tracking-widest text-xs font-bold border-none shadow-luxury">
                      Sign In to Book
                    </Button>
                  </div>
                )}

                {/* Guest particulars */}
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 space-y-6">
                  <h2 className="text-2xl font-serif font-bold text-white">Guest Particulars</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className={labelClass}>Full Name</label>
                      <input type="text" className={inputClass} placeholder={session?.user?.name || 'Your full name'}
                        value={session?.user?.name || bookingData.guestName}
                        onChange={e => setBookingData({...bookingData, guestName: e.target.value})}
                        readOnly={!!session?.user?.name}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className={labelClass}>Email Address</label>
                      <input type="email" className={inputClass} placeholder={session?.user?.email || 'your@email.com'}
                        value={session?.user?.email || bookingData.guestEmail}
                        onChange={e => setBookingData({...bookingData, guestEmail: e.target.value})}
                        readOnly={!!session?.user?.email}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className={labelClass}><Phone className="inline w-3 h-3 mr-1" />Contact Number</label>
                      <input type="tel" className={inputClass} placeholder="+1 (000) 000-0000"
                        value={bookingData.guestPhone}
                        onChange={e => setBookingData({...bookingData, guestPhone: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Special Requests */}
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 space-y-4">
                  <h2 className="text-2xl font-serif font-bold text-white">Special Requests</h2>
                  <textarea rows={4} className={`${inputClass} resize-none`} placeholder="Dietary requirements, floor preference, special occasions..."
                    value={bookingData.specialRequests} onChange={e => setBookingData({...bookingData, specialRequests: e.target.value})}
                  />
                </div>

                {/* Payment */}
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 space-y-6">
                  <h2 className="text-2xl font-serif font-bold text-white">Payment Method</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[{ id: 'pay_later', t: 'Pay at Arrival', d: 'Secure booking with credit card guarantee.' }, { id: 'pay_now', t: 'Pay Securely Now', d: 'Accelerated check-in upon arrival.' }].map(m => (
                      <div key={m.id} onClick={() => setBookingData({...bookingData, paymentMethod: m.id as any})}
                        className={`p-6 border rounded-xl cursor-pointer transition-all ${bookingData.paymentMethod === m.id ? 'border-primary/40 bg-primary/10' : 'border-white/10 hover:border-white/20 bg-white/5'}`}
                      >
                        <h4 className="font-serif font-bold text-white mb-1">{m.t}</h4>
                        <p className="text-white/40 text-xs font-light">{m.d}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Summary sidebar */}
              <div className="lg:col-span-4">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 sticky top-28 space-y-6">
                  <h3 className="text-xl font-serif font-bold text-white border-b border-white/10 pb-4">Stay Summary</h3>
                  <div className="space-y-3 text-xs uppercase tracking-widest">
                    {[
                      { l: 'Suite', v: selectedRoom.type },
                      { l: 'Duration', v: `${nights} Night${nights !== 1 ? 's' : ''}` },
                      { l: 'Arrival', v: searchData.checkIn },
                      { l: 'Departure', v: searchData.checkOut },
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="text-white/30">{item.l}</span>
                        <span className="text-white font-bold">{item.v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-white/10 space-y-5">
                    <div className="flex justify-between items-end">
                      <span className="text-primary uppercase tracking-widest text-[9px] font-bold">Total</span>
                      <span className="text-3xl font-serif font-bold text-primary">{formatPrice(totalAmount)}</span>
                    </div>
                    <Button onClick={createBooking} disabled={isLoading} className="w-full bg-gold-gradient text-white h-14 rounded-xl uppercase tracking-[0.2em] text-xs font-bold border-none shadow-luxury hover:opacity-90">
                      {isLoading ? 'Processing...' : (!session?.user ? 'Sign In to Confirm' : 'Confirm Reservation')}
                    </Button>
                    <div className="flex items-center gap-2 text-[9px] text-white/20 uppercase tracking-widest justify-center">
                      <Shield className="w-3 h-3" /><span>Secure SSL Encryption</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && (
            <div className="text-center py-20 space-y-10">
              <div className="w-24 h-24 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto text-primary">
                <CheckCircle className="w-12 h-12" />
              </div>
              <div className="space-y-4">
                <h2 className="text-5xl font-serif font-bold text-white">Reservation <span className="text-primary italic">Confirmed</span></h2>
                <p className="text-white/40 font-light max-w-xl mx-auto">Your sanctuary awaits. A confirmation with your booking details has been sent to your inbox.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => router.push('/my-bookings')} className="bg-gold-gradient text-white h-14 rounded-xl px-10 uppercase tracking-widest text-[10px] font-bold border-none shadow-luxury">
                  Manage Booking
                </Button>
                <Button variant="outline" onClick={() => router.push('/')} className="border-white/20 text-white h-14 rounded-xl px-10 uppercase tracking-widest text-[10px] font-bold hover:bg-white/10">
                  Return Home
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <PremiumSpinner size="lg" text="Preparing Your Experience..." color="text-primary" />
      </div>
    }>
      <BookingPageContent />
    </Suspense>
  )
}