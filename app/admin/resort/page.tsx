"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Loader2, Calendar, MapPin, Clock, User, Plus, X, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ResortPage() {
  const [facilities, setFacilities] = useState<any[]>([])
  const [guests, setGuests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    facilityId: '',
    serviceId: '',
    guestId: '',
    startTime: '',
    endTime: '',
    notes: ''
  })

  useEffect(() => {
    fetchData()
    fetchGuests()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/resort')
      const data = await res.json()
      setFacilities(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const fetchGuests = async () => {
    try {
      const res = await fetch('/api/crm/guests')
      if (res.ok) {
        const data = await res.json()
        setGuests(data)
      }
    } catch (e) {
      console.error('Failed to fetch guests:', e)
    }
  }

  const handleOpenModal = () => {
    const now = new Date()
    const startStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    const endStr = new Date(now.getTime() + 60 * 60000 - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)

    const initialFacilityId = facilities[0]?.id || ''
    const initialGuestId = guests[0]?.id || ''

    setFormData({
      facilityId: initialFacilityId,
      serviceId: '',
      guestId: initialGuestId,
      startTime: startStr,
      endTime: endStr,
      notes: ''
    })
    setIsModalOpen(true)
  }

  const handleServiceChange = (serviceId: string) => {
    const selectedFacility = facilities.find(f => f.id === formData.facilityId)
    const selectedService = selectedFacility?.services?.find((s: any) => s.id === serviceId)

    if (selectedService && formData.startTime) {
      const start = new Date(formData.startTime)
      const durationMins = selectedService.durationMins || 60
      const end = new Date(start.getTime() + durationMins * 60000)
      const endStr = new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString().slice(0, 16)

      setFormData(prev => ({
        ...prev,
        serviceId,
        endTime: endStr,
        notes: prev.notes || `${selectedService.name} ($${selectedService.price})`
      }))
    } else {
      setFormData(prev => ({ ...prev, serviceId }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.facilityId) return toast.error('Please select a facility')
    if (!formData.guestId) return toast.error('Please select a guest')
    if (!formData.startTime || !formData.endTime) return toast.error('Please select valid start and end times')

    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/resort', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facilityId: formData.facilityId,
          guestId: formData.guestId,
          startTime: new Date(formData.startTime).toISOString(),
          endTime: new Date(formData.endTime).toISOString(),
          notes: formData.notes
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create booking')
      }

      toast.success('Resort booking created successfully!')
      setIsModalOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create resort booking')
    } finally {
      setSubmitting(false)
    }
  }

  const activeFacility = facilities.find(f => f.id === formData.facilityId)

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-white" /></div>

  return (
    <div className="p-6 text-white max-w-7xl mx-auto">
      
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold font-serif mb-2">Resort & Leisure Scheduling</h1>
            <p className="text-slate-400">Manage Spa treatments, Golf tee times, and Cabana rentals.</p>
        </div>
        <Button onClick={handleOpenModal} className="bg-emerald-600 hover:bg-emerald-700 font-bold">
            <Plus className="w-4 h-4 mr-2" />
            New Booking
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {facilities.map(facility => (
              <Card key={facility.id} className="bg-[#1a1a1a] border-white/10 text-white flex flex-col">
                  <div className="p-4 border-b border-white/10 bg-black/20 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                              <MapPin className="w-5 h-5 text-indigo-400" />
                          </div>
                          <div>
                              <h2 className="text-lg font-bold">{facility.name}</h2>
                              <div className="text-xs text-slate-400 flex items-center gap-2">
                                  <Clock className="w-3 h-3" />
                                  {facility.operatingHours}
                              </div>
                          </div>
                      </div>
                      <div className="text-xs bg-white/10 px-2 py-1 rounded font-bold uppercase tracking-widest text-slate-300">
                          {facility.type}
                      </div>
                  </div>
                  <CardContent className="p-0 flex-1 flex">
                      {/* Services List */}
                      <div className="w-1/3 border-r border-white/10 p-4 bg-black/10">
                          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Menu</h3>
                          <div className="space-y-2">
                              {facility.services.map((svc: any) => (
                                  <div key={svc.id} className="bg-white/5 p-2 rounded border border-white/5">
                                      <div className="font-bold text-sm truncate">{svc.name}</div>
                                      <div className="flex justify-between text-xs text-slate-400 mt-1">
                                          <span>{svc.durationMins} min</span>
                                          <span className="text-emerald-400">${svc.price}</span>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>

                      {/* Today's Bookings */}
                      <div className="w-2/3 p-4">
                          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Today's Schedule
                          </h3>
                          <div className="space-y-3">
                              {facility.bookings.length === 0 ? (
                                  <div className="text-center p-6 border border-dashed border-white/10 rounded-lg text-slate-500 text-sm">
                                      No bookings scheduled.
                                  </div>
                              ) : (
                                  facility.bookings.map((booking: any) => (
                                      <div key={booking.id} className="flex items-center gap-4 bg-black p-3 rounded-lg border border-white/10">
                                          <div className="text-center w-20 shrink-0">
                                              <div className="text-sm font-bold text-indigo-400">
                                                  {new Date(booking.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                              </div>
                                              <div className="text-xs text-slate-500">
                                                  {new Date(booking.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                              </div>
                                          </div>
                                          <div className="w-px h-8 bg-white/10"></div>
                                          <div className="flex-1 min-w-0">
                                              <div className="font-bold text-sm truncate flex items-center gap-2">
                                                  <User className="w-4 h-4 text-slate-400" />
                                                  {booking.guest?.name || 'Unknown Guest'}
                                              </div>
                                              <div className="text-xs text-slate-400 mt-1 truncate">
                                                  {booking.notes || 'No notes'}
                                              </div>
                                          </div>
                                      </div>
                                  ))
                              )}
                          </div>
                      </div>
                  </CardContent>
              </Card>
          ))}
          {facilities.length === 0 && (
              <div className="col-span-2 text-center p-12 text-slate-500 border border-dashed border-white/10 rounded-xl">
                  No resort facilities configured. Create one in Settings.
              </div>
          )}
      </div>

      {/* New Resort / Spa Booking Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-[#121212] border-white/10 text-white max-w-lg rounded-2xl p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
              <Sparkles className="w-5 h-5 text-emerald-400" /> New Resort & Spa Booking
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-sm">
              Schedule spa treatments, cabanas, or golf tee times for hotel guests.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Facility Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Facility *
              </label>
              <select
                value={formData.facilityId}
                onChange={(e) => setFormData(prev => ({ ...prev, facilityId: e.target.value, serviceId: '' }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              >
                {facilities.map(f => (
                  <option key={f.id} value={f.id} className="bg-[#1a1a1a] text-white">
                    {f.name} ({f.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Service Selection (Optional) */}
            {activeFacility?.services?.length > 0 && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Select Service
                </label>
                <select
                  value={formData.serviceId}
                  onChange={(e) => handleServiceChange(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="" className="bg-[#1a1a1a] text-white">-- Select Service (Optional) --</option>
                  {activeFacility.services.map((s: any) => (
                    <option key={s.id} value={s.id} className="bg-[#1a1a1a] text-white">
                      {s.name} - {s.durationMins} mins (${s.price})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Guest Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Guest *
              </label>
              <select
                value={formData.guestId}
                onChange={(e) => setFormData(prev => ({ ...prev, guestId: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              >
                {guests.length === 0 ? (
                  <option value="" className="bg-[#1a1a1a] text-white">Loading guests...</option>
                ) : (
                  guests.map(g => (
                    <option key={g.id} value={g.id} className="bg-[#1a1a1a] text-white">
                      {g.name} ({g.email || 'Guest'})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Date & Times */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Start Time *
                </label>
                <Input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  End Time *
                </label>
                <Input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white text-sm"
                  required
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Notes / Special Requests
              </label>
              <Input
                placeholder="e.g. Deep Tissue Massage, Room 201 charge"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="bg-white/5 border-white/10 text-white text-sm"
              />
            </div>

            <DialogFooter className="pt-4 gap-2 border-t border-white/10">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
                className="hover:bg-white/10 text-slate-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 font-bold text-white"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Booking'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}

