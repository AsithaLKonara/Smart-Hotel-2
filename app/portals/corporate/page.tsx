'use client'

import { useState, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Building2, Key, CheckCircle, Search } from 'lucide-react'

export default function CorporatePortal() {
  const [companyId, setCompanyId] = useState('')
  const [accessCode, setAccessCode] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [companyDetails, setCompanyDetails] = useState<any>(null)
  const [recentBookings, setRecentBookings] = useState<any[]>([])
  const [employeeName, setEmployeeName] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [bookingStatus, setBookingStatus] = useState<string | null>(null)

  const handleLogin = async () => {
    setError(null)
    if (companyId && accessCode) {
      try {
        const res = await fetch('/api/portals/corporate/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyId, accessCode })
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'Login failed')
          return
        }
        setCompanyDetails({ name: data.name, rate: data.rate })
        setRecentBookings(data.recentBookings || [])
        setLoggedIn(true)
      } catch (err) {
        setError('Network error')
      }
    } else {
      setError('Missing credentials')
    }
  }

  const handleBook = async () => {
    if (!employeeName || !checkIn || !checkOut) {
      alert('Please fill in all fields')
      return
    }
    setBookingStatus('processing')
    try {
      const res = await fetch('/api/portals/b2b/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          clientName: employeeName,
          checkIn,
          checkOut,
          // Assuming a default room type id for demo purposes. 
          // In reality, we'd have a dropdown to select roomTypeId.
          roomTypeId: 'demo-room-type-id' 
        })
      })
      
      if (!res.ok) {
        setBookingStatus('error')
        alert('Booking failed')
        return
      }
      
      setBookingStatus('success')
    } catch (err) {
      setBookingStatus('error')
    }
  }

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-[#1a1a1a] border-white/10">
          <CardHeader className="text-center">
            <Building2 className="w-12 h-12 text-primary mx-auto mb-4" />
            <CardTitle className="text-2xl text-white">Corporate Portal</CardTitle>
            <p className="text-white/50 text-sm">Log in to access your negotiated B2B rates.</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Input 
              placeholder="Corporate ID or Company Name" 
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
            <Input 
              type="password"
              placeholder="Access Code" 
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
            <Button onClick={handleLogin} className="bg-primary text-white font-bold h-12 w-full mt-2">
              Access Portal
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Loading Portal...</div>}>
      <div className="min-h-screen bg-black p-8 text-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/10">
          <div>
            <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
              <Building2 className="w-8 h-8" /> {companyDetails.name}
            </h1>
            <p className="text-white/60 mt-1">Your Corporate Discount: <span className="text-green-400 font-bold">{companyDetails.rate}% OFF Best Available Rate</span></p>
          </div>
          <Button variant="outline" className="border-white/20 hover:bg-white/5 text-white" onClick={() => setLoggedIn(false)}>
            Sign Out
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="bg-[#1a1a1a] border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Search className="w-5 h-5" /> Quick Book Employee Travel</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Input placeholder="Employee Name" className="bg-white/5 border-white/10 text-white" />
              <div className="grid grid-cols-2 gap-4">
                <Input type="date" className="bg-white/5 border-white/10 text-white" />
                <Input type="date" className="bg-white/5 border-white/10 text-white" />
              </div>
              <Button 
                onClick={handleBook} 
                disabled={bookingStatus === 'processing'}
                className="w-full bg-primary h-12 text-white font-bold mt-4"
              >
                {bookingStatus === 'processing' ? 'Confirming...' : bookingStatus === 'success' ? <><CheckCircle className="w-5 h-5 mr-2" /> Booking Confirmed!</> : 'Book with Corporate Rate'}
              </Button>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-bold mb-2">Recent Bookings</h2>
            {recentBookings.length === 0 ? (
              <div className="text-white/50 text-sm">No recent bookings found.</div>
            ) : (
              recentBookings.map((b: any) => (
                <div key={b.id} className="bg-[#1a1a1a] p-4 rounded-xl border border-white/10 flex justify-between items-center">
                  <div>
                    <p className="font-bold">{b.guestName}</p>
                    <p className="text-sm text-white/50">{new Date(b.checkIn).toLocaleDateString()} - {new Date(b.checkOut).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-bold">${b.totalAmount.toFixed(2)}</p>
                    <p className="text-xs text-white/40">Corporate Rate Applied</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        </div>
      </div>
    </Suspense>
  )
}
