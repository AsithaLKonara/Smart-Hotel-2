"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import { Calendar, Users, Clock, Loader2 } from 'lucide-react'

interface DiningBookingModalProps {
  isOpen: boolean
  onClose: () => void
  venueName: string
}

export function DiningBookingModal({ isOpen, onClose, venueName }: DiningBookingModalProps) {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    phone: '',
    guests: '2',
    bookingDate: '',
    bookingTime: '19:00',
    specialRequests: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch('/api/restaurant/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          venueName
        })
      })

      if (!res.ok) throw new Error('Failed to book table')

      toast.success(`Table reserved successfully at ${venueName}!`, {
        style: { background: '#0c0c0c', color: '#fff', border: '1px solid #c5a059' },
        icon: '🍽️'
      })
      onClose()
    } catch (error) {
      toast.error('Could not complete reservation. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0c0c0c] border-white/10 text-white max-w-md rounded-[32px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif font-bold text-white">Reserve a Table</DialogTitle>
          <DialogDescription className="text-white/40">
            Secure your spot at <span className="text-primary font-bold">{venueName}</span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-white/30 ml-1">Full Name</label>
              <Input 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})}
                required
                className="bg-white/5 border-white/10 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-white/30 ml-1">Email</label>
              <Input 
                type="email"
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})}
                required
                className="bg-white/5 border-white/10 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-white/30 ml-1">Guests</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <Input 
                  type="number"
                  min="1"
                  max="20"
                  value={formData.guests} 
                  onChange={e => setFormData({...formData, guests: e.target.value})}
                  required
                  className="bg-white/5 border-white/10 rounded-xl pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-white/30 ml-1">Phone</label>
              <Input 
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})}
                required
                placeholder="+1 234..."
                className="bg-white/5 border-white/10 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-white/30 ml-1">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <Input 
                  type="date"
                  value={formData.bookingDate} 
                  onChange={e => setFormData({...formData, bookingDate: e.target.value})}
                  required
                  className="bg-white/5 border-white/10 rounded-xl pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-white/30 ml-1">Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <Input 
                  type="time"
                  value={formData.bookingTime} 
                  onChange={e => setFormData({...formData, bookingTime: e.target.value})}
                  required
                  className="bg-white/5 border-white/10 rounded-xl pl-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-white/30 ml-1">Special Requests</label>
            <Textarea 
              value={formData.specialRequests} 
              onChange={e => setFormData({...formData, specialRequests: e.target.value})}
              placeholder="Birthdays, dietary needs, seating preference..."
              className="bg-white/5 border-white/10 rounded-xl min-h-[80px]"
            />
          </div>

          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full h-14 bg-gold-gradient text-white rounded-xl uppercase tracking-widest text-xs font-bold border-none shadow-luxury"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Reservation'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
