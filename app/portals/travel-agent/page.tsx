'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plane, DollarSign, CheckCircle } from 'lucide-react'

export default function TravelAgentPortal() {
  const [iata, setIata] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [agentDetails, setAgentDetails] = useState<any>(null)
  const [bookingStatus, setBookingStatus] = useState<string | null>(null)

  const handleLogin = () => {
    if (iata) {
      setAgentDetails({
        name: 'Global Travel Partners',
        iata: iata,
        commission: 15 // 15% commission mock
      })
      setLoggedIn(true)
    }
  }

  const handleBook = () => {
    setBookingStatus('processing')
    setTimeout(() => {
      setBookingStatus('success')
    }, 1500)
  }

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-[#1a1a1a] border-white/10">
          <CardHeader className="text-center">
            <Plane className="w-12 h-12 text-primary mx-auto mb-4" />
            <CardTitle className="text-2xl text-white">Travel Agent Portal</CardTitle>
            <p className="text-white/50 text-sm">Enter your IATA number to book and earn commissions.</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Input 
              placeholder="IATA Number" 
              value={iata}
              onChange={(e) => setIata(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
            <Button onClick={handleLogin} className="bg-primary text-white font-bold h-12 w-full mt-2">
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-8 text-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/10">
          <div>
            <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
              <Plane className="w-8 h-8" /> {agentDetails.name}
            </h1>
            <p className="text-white/60 mt-1">IATA: {agentDetails.iata} | Commission Tier: <span className="text-green-400 font-bold">{agentDetails.commission}%</span></p>
          </div>
          <Button variant="outline" className="border-white/20 hover:bg-white/5 text-white" onClick={() => setLoggedIn(false)}>
            Sign Out
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Booking Form */}
          <Card className="md:col-span-2 bg-[#1a1a1a] border-white/10">
            <CardHeader>
              <CardTitle>Book Client Travel</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Client First Name" className="bg-white/5 border-white/10 text-white" />
                <Input placeholder="Client Last Name" className="bg-white/5 border-white/10 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input type="date" className="bg-white/5 border-white/10 text-white" />
                <Input type="date" className="bg-white/5 border-white/10 text-white" />
              </div>
              <Button 
                onClick={handleBook} 
                disabled={bookingStatus === 'processing'}
                className="w-full bg-primary h-12 text-white font-bold mt-4"
              >
                {bookingStatus === 'processing' ? 'Processing...' : bookingStatus === 'success' ? <><CheckCircle className="w-5 h-5 mr-2" /> Booking Confirmed!</> : 'Confirm Booking'}
              </Button>
            </CardContent>
          </Card>

          {/* Commission Tracker */}
          <div className="flex flex-col gap-4">
            <Card className="bg-[#1a1a1a] border-white/10">
              <CardContent className="p-6 text-center">
                <DollarSign className="w-12 h-12 text-green-400 mx-auto mb-2" />
                <h3 className="text-lg font-bold text-white/50">Unpaid Commissions</h3>
                <p className="text-4xl font-bold text-green-400 mt-2">$1,245.50</p>
                <Button variant="outline" className="w-full mt-6 border-white/20 text-white">Request Payout</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
