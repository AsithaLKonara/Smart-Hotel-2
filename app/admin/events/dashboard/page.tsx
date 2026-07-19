'use client'

import { useState, useEffect } from 'react'
import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import * as Dialog from '@radix-ui/react-dialog'
import { CalendarDays, Users, MapPin, Plus, Hotel, BookOpen, Calculator, X, DollarSign, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

// ---- Shared Modal Shell ----
function ModalShell({ open, onClose, title, children }: { open: boolean, onClose: () => void, title: string, children: React.ReactNode }) {
  return (
    <Dialog.Root open={open} onOpenChange={(o: boolean) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl p-6 z-50 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function FormField({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 block">{label}</label>
      {children}
    </div>
  )
}

export default function EventsDashboard() {
  const [events, setEvents] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('EVENTS')
  const [spaces, setSpaces] = useState<any[]>([])
  const [blocks, setBlocks] = useState<any[]>([])
  const [roomTypes, setRoomTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Modal state
  const [quoteModal, setQuoteModal] = useState(false)
  const [attendanceModal, setAttendanceModal] = useState<any>(null) // holds event object
  const [newSpaceModal, setNewSpaceModal] = useState(false)
  const [newBlockModal, setNewBlockModal] = useState(false)
  const [newEventModal, setNewEventModal] = useState(false)
  const [quoteResult, setQuoteResult] = useState<any>(null)

  // Form state
  const [quoteForm, setQuoteForm] = useState({ roomTypeId: '', checkIn: '', checkOut: '', guests: '2' })
  const [attendanceForm, setAttendanceForm] = useState({ userId: '', attendees: '1' })
  const [spaceForm, setSpaceForm] = useState({ name: '', capacity: '', hourlyRate: '', dailyRate: '' })
  const [blockForm, setBlockForm] = useState({ eventId: '', roomTypeId: '', blockedCount: '', contractedRate: '' })
  const [eventForm, setEventForm] = useState({ name: '', type: 'CONFERENCE', status: 'PROSPECT', startDate: '', endDate: '', expectedAttendees: '', organizerName: '', organizerEmail: '', spaceId: '' })

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [evRes, spRes, blRes, rtRes] = await Promise.all([
        fetch('/api/admin/events'),
        fetch('/api/admin/events/spaces'),
        fetch('/api/admin/events/blocks'),
        fetch('/api/room-types')
      ])
      const [evData, spData, blData, rtData] = await Promise.all([evRes.json(), spRes.json(), blRes.json(), rtRes.json()])
      setEvents(evData.data || evData.events || [])
      setSpaces(spData.spaces || [])
      setBlocks(blData.data || [])
      setRoomTypes(Array.isArray(rtData) ? rtData : (rtData.roomTypes || []))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const handleGetQuote = async (e: React.FormEvent) => {
    e.preventDefault()
    setQuoteResult(null)
    try {
      const res = await fetch('/api/pricing/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...quoteForm, guests: parseInt(quoteForm.guests) })
      })
      const data = await res.json()
      if (res.ok) setQuoteResult(data.quote)
      else toast.error(data.error || 'Failed to get quote')
    } catch { toast.error('Error fetching quote') }
  }

  const handleBookAttendance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!attendanceModal) return
    try {
      const res = await fetch('/api/events/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: attendanceModal.id, userId: attendanceForm.userId, attendees: parseInt(attendanceForm.attendees) })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Booking confirmed! Ref: ${data.bookingReference}`)
        setAttendanceModal(null)
      } else {
        toast.error(data.error || 'Booking failed')
      }
    } catch { toast.error('Error booking attendance') }
  }

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/events/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...spaceForm, capacity: parseInt(spaceForm.capacity), hourlyRate: parseFloat(spaceForm.hourlyRate), dailyRate: parseFloat(spaceForm.dailyRate) })
      })
      if (res.ok) {
        toast.success('Event space created')
        setNewSpaceModal(false)
        setSpaceForm({ name: '', capacity: '', hourlyRate: '', dailyRate: '' })
        fetchAll()
      } else toast.error('Failed to create space')
    } catch { toast.error('Error creating space') }
  }

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/events/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...blockForm, blockedCount: parseInt(blockForm.blockedCount), contractedRate: parseFloat(blockForm.contractedRate) })
      })
      if (res.ok) {
        toast.success('Group block created')
        setNewBlockModal(false)
        setBlockForm({ eventId: '', roomTypeId: '', blockedCount: '', contractedRate: '' })
        fetchAll()
      } else toast.error('Failed to create block')
    } catch { toast.error('Error creating block') }
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...eventForm,
          startDate: new Date(eventForm.startDate).toISOString(),
          endDate: new Date(eventForm.endDate).toISOString(),
          expectedAttendees: parseInt(eventForm.expectedAttendees),
          spaceId: eventForm.spaceId || undefined
        })
      })
      if (res.ok) {
        toast.success('Event created successfully')
        setNewEventModal(false)
        setEventForm({ name: '', type: 'CONFERENCE', status: 'PROSPECT', startDate: '', endDate: '', expectedAttendees: '', organizerName: '', organizerEmail: '', spaceId: '' })
        fetchAll()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to create event')
      }
    } catch { toast.error('Error creating event') }
  }

  return (
    <AdminPageShell title="Events & Banqueting" subtitle="Manage group blocks, conferences, and event spaces." onRefresh={fetchAll}>
      
      {/* Tab Bar + Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8 justify-between">
        <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
          {['EVENTS', 'SPACES', 'BLOCKS'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setQuoteModal(true)} className="bg-white/5 border-white/10 text-white hover:bg-white/10">
            <Calculator className="w-4 h-4 mr-2" /> Price Quote
          </Button>
          {activeTab === 'EVENTS' && (
            <Button onClick={() => setNewEventModal(true)} className="bg-primary text-white">
              <Plus className="w-4 h-4 mr-2" /> New Event
            </Button>
          )}
          {activeTab === 'SPACES' && (
            <Button onClick={() => setNewSpaceModal(true)} className="bg-primary text-white">
              <Plus className="w-4 h-4 mr-2" /> New Space
            </Button>
          )}
          {activeTab === 'BLOCKS' && (
            <Button onClick={() => setNewBlockModal(true)} className="bg-primary text-white">
              <Plus className="w-4 h-4 mr-2" /> New Block
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><PremiumSpinner /></div>
      ) : (
        <>
          {/* ---- EVENTS TAB ---- */}
          {activeTab === 'EVENTS' && (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {events.map((event: any) => (
                <Card key={event.id} className="bg-white/5 border-white/10 hover:border-white/20 transition-all shadow-xl">
                  <CardContent className="p-6 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-white text-lg">{event.name}</h3>
                        <p className="text-xs text-white/50 uppercase tracking-wider mt-1">{event.type}</p>
                      </div>
                      <Badge className={`text-xs px-2 py-1 rounded-full border ${
                        event.status === 'DEFINITE' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                        event.status === 'TENTATIVE' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                        'bg-slate-500/20 text-slate-400 border-slate-500/30'
                      }`}>
                        {event.status}
                      </Badge>
                    </div>

                    <div className="flex flex-col gap-2 text-sm text-white/60 bg-[#1a1a24] p-4 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-primary/70" />
                        {new Date(event.startDate).toLocaleDateString()} → {new Date(event.endDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary/70" />
                        {event.expectedAttendees} Expected Attendees
                      </div>
                      {event.spaceBookings?.length > 0 && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary/70" />
                          {event.spaceBookings[0].space?.name}
                        </div>
                      )}
                    </div>

                    {event.groupBlocks?.length > 0 && (
                      <div>
                        <p className="text-xs text-white/40 mb-2 uppercase tracking-wider font-bold">Group Blocks</p>
                        {event.groupBlocks.map((block: any) => (
                          <div key={block.id} className="flex justify-between items-center bg-white/5 p-3 rounded-lg text-sm mb-2 border border-white/5">
                            <div className="flex items-center gap-2 text-white">
                              <Hotel className="w-4 h-4 text-primary" /> {block.roomType?.name || 'Room'}
                            </div>
                            <div className="flex items-center gap-4 text-white/60">
                              <span>{block.blockedCount} rooms</span>
                              <span className="text-emerald-400 font-bold">${block.contractedRate}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto pt-4 border-t border-white/10 flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-primary border-primary/30 bg-primary/10 hover:bg-primary/20 text-xs"
                        onClick={() => { setAttendanceForm({ userId: '', attendees: '1' }); setAttendanceModal(event) }}
                      >
                        <BookOpen className="w-3.5 h-3.5 mr-1" /> Book Attendance
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {events.length === 0 && (
                <div className="col-span-full p-12 text-center text-white/40 border-2 border-dashed border-white/10 rounded-xl">
                  No upcoming events. Click "New Event" to create one.
                </div>
              )}
            </div>
          )}

          {/* ---- SPACES TAB ---- */}
          {activeTab === 'SPACES' && (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {spaces.map((space: any) => (
                <Card key={space.id} className="bg-white/5 border-white/10 hover:border-white/20 transition-all shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-xl text-white">{space.name}</h3>
                      <Badge className={`text-xs ${space.isActive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                        {space.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-[#1a1a24] p-3 rounded-xl border border-white/5">
                        <p className="text-xs text-white/40 mb-1 uppercase">Capacity</p>
                        <p className="font-bold text-white">{space.capacity}</p>
                      </div>
                      <div className="bg-[#1a1a24] p-3 rounded-xl border border-white/5">
                        <p className="text-xs text-white/40 mb-1 uppercase">Hourly</p>
                        <p className="font-bold text-primary">${space.hourlyRate}</p>
                      </div>
                      <div className="bg-[#1a1a24] p-3 rounded-xl border border-white/5">
                        <p className="text-xs text-white/40 mb-1 uppercase">Daily</p>
                        <p className="font-bold text-primary">${space.dailyRate}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10 flex justify-end">
                      <Button variant="ghost" size="sm" onClick={async () => {
                        const res = await fetch(`/api/admin/events/spaces/${space.id}`, { method: 'DELETE' })
                        if (res.ok) { toast.success('Space deleted'); fetchAll() }
                        else toast.error('Cannot delete space with active bookings')
                      }} className="text-rose-400 hover:bg-rose-500/10 text-xs">
                        Delete Space
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {spaces.length === 0 && (
                <div className="col-span-full p-12 text-center text-white/40 border-2 border-dashed border-white/10 rounded-xl">
                  No event spaces found. Click "New Space" to create one.
                </div>
              )}
            </div>
          )}

          {/* ---- BLOCKS TAB ---- */}
          {activeTab === 'BLOCKS' && (
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm text-white">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="p-4 text-white/50 text-xs uppercase">Event</th>
                    <th className="p-4 text-white/50 text-xs uppercase">Room Type</th>
                    <th className="p-4 text-white/50 text-xs uppercase">Blocked</th>
                    <th className="p-4 text-white/50 text-xs uppercase">Picked Up</th>
                    <th className="p-4 text-white/50 text-xs uppercase">Rate</th>
                    <th className="p-4 text-right text-white/50 text-xs uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {blocks.map((block: any) => (
                    <tr key={block.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-medium">{block.event?.name}</td>
                      <td className="p-4 text-white/70">{block.roomType?.name}</td>
                      <td className="p-4 text-white/70">{block.blockedCount}</td>
                      <td className="p-4">
                        <span className={`font-bold ${block.pickedUpCount > 0 ? 'text-emerald-400' : 'text-white/40'}`}>{block.pickedUpCount}</span>
                      </td>
                      <td className="p-4 text-emerald-400 font-bold">${block.contractedRate}</td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="sm" onClick={async () => {
                          const res = await fetch(`/api/admin/events/blocks/${block.id}`, { method: 'DELETE' })
                          if (res.ok) { toast.success('Block removed'); fetchAll() }
                          else toast.error('Failed to remove block')
                        }} className="text-rose-400 hover:bg-rose-500/10 text-xs">
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {blocks.length === 0 && (
                    <tr><td colSpan={6} className="p-12 text-center text-white/40">No group blocks found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ---- PRICE QUOTE MODAL ---- */}
      <ModalShell open={quoteModal} onClose={() => { setQuoteModal(false); setQuoteResult(null) }} title="Generate Price Quote">
        <form onSubmit={handleGetQuote} className="space-y-4">
          <FormField label="Room Type">
            <select required value={quoteForm.roomTypeId} onChange={e => setQuoteForm({ ...quoteForm, roomTypeId: e.target.value })} className="w-full bg-[#1a1a24] border border-white/10 rounded-lg p-2.5 text-sm text-white">
              <option value="">Select a room type...</option>
              {roomTypes.map((rt: any) => <option key={rt.id} value={rt.id}>{rt.name} (${rt.baseRate}/night)</option>)}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Check-In">
              <Input type="date" required value={quoteForm.checkIn} onChange={e => setQuoteForm({ ...quoteForm, checkIn: e.target.value })} className="bg-[#1a1a24] border-white/10 text-white" />
            </FormField>
            <FormField label="Check-Out">
              <Input type="date" required value={quoteForm.checkOut} onChange={e => setQuoteForm({ ...quoteForm, checkOut: e.target.value })} className="bg-[#1a1a24] border-white/10 text-white" />
            </FormField>
          </div>
          <FormField label="Number of Guests">
            <Input type="number" min="1" required value={quoteForm.guests} onChange={e => setQuoteForm({ ...quoteForm, guests: e.target.value })} className="bg-[#1a1a24] border-white/10 text-white" />
          </FormField>
          <Button type="submit" className="w-full bg-primary text-white mt-2"><Calculator className="w-4 h-4 mr-2" /> Get Quote</Button>
        </form>
        {quoteResult && (
          <div className="mt-6 bg-primary/10 border border-primary/30 rounded-xl p-5 text-white">
            <p className="text-xs text-primary uppercase font-bold tracking-widest mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Quote Generated</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-white/50 text-xs">Rate Plan</p><p className="font-bold">{quoteResult.ratePlanName}</p></div>
              <div><p className="text-white/50 text-xs">Nights</p><p className="font-bold">{quoteResult.nights}</p></div>
              <div><p className="text-white/50 text-xs">Rate/Night</p><p className="font-bold">${quoteResult.ratePerNight}</p></div>
              <div><p className="text-white/50 text-xs">Total Amount</p><p className="font-bold text-primary text-xl">${quoteResult.totalAmount}</p></div>
            </div>
          </div>
        )}
      </ModalShell>

      {/* ---- BOOK ATTENDANCE MODAL ---- */}
      <ModalShell open={!!attendanceModal} onClose={() => setAttendanceModal(null)} title={`Book Attendance: ${attendanceModal?.name}`}>
        <form onSubmit={handleBookAttendance} className="space-y-4">
          <FormField label="Guest User ID">
            <Input required placeholder="Paste the Guest's User ID" value={attendanceForm.userId} onChange={e => setAttendanceForm({ ...attendanceForm, userId: e.target.value })} className="bg-[#1a1a24] border-white/10 text-white font-mono text-sm" />
          </FormField>
          <FormField label="Number of Attendees">
            <Input type="number" min="1" required value={attendanceForm.attendees} onChange={e => setAttendanceForm({ ...attendanceForm, attendees: e.target.value })} className="bg-[#1a1a24] border-white/10 text-white" />
          </FormField>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button type="button" variant="ghost" onClick={() => setAttendanceModal(null)}>Cancel</Button>
            <Button type="submit" className="bg-primary text-white"><BookOpen className="w-4 h-4 mr-2" /> Confirm Booking</Button>
          </div>
        </form>
      </ModalShell>

      {/* ---- NEW EVENT SPACE MODAL ---- */}
      <ModalShell open={newSpaceModal} onClose={() => setNewSpaceModal(false)} title="Create Event Space">
        <form onSubmit={handleCreateSpace} className="space-y-4">
          <FormField label="Space Name">
            <Input required value={spaceForm.name} onChange={e => setSpaceForm({ ...spaceForm, name: e.target.value })} className="bg-[#1a1a24] border-white/10 text-white" placeholder="e.g. Grand Ballroom" />
          </FormField>
          <FormField label="Capacity (persons)">
            <Input type="number" min="1" required value={spaceForm.capacity} onChange={e => setSpaceForm({ ...spaceForm, capacity: e.target.value })} className="bg-[#1a1a24] border-white/10 text-white" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Hourly Rate ($)">
              <Input type="number" min="0" step="0.01" required value={spaceForm.hourlyRate} onChange={e => setSpaceForm({ ...spaceForm, hourlyRate: e.target.value })} className="bg-[#1a1a24] border-white/10 text-white" />
            </FormField>
            <FormField label="Daily Rate ($)">
              <Input type="number" min="0" step="0.01" required value={spaceForm.dailyRate} onChange={e => setSpaceForm({ ...spaceForm, dailyRate: e.target.value })} className="bg-[#1a1a24] border-white/10 text-white" />
            </FormField>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button type="button" variant="ghost" onClick={() => setNewSpaceModal(false)}>Cancel</Button>
            <Button type="submit" className="bg-primary text-white">Create Space</Button>
          </div>
        </form>
      </ModalShell>

      {/* ---- NEW GROUP BLOCK MODAL ---- */}
      <ModalShell open={newBlockModal} onClose={() => setNewBlockModal(false)} title="Create Group Block">
        <form onSubmit={handleCreateBlock} className="space-y-4">
          <FormField label="Event">
            <select required value={blockForm.eventId} onChange={e => setBlockForm({ ...blockForm, eventId: e.target.value })} className="w-full bg-[#1a1a24] border border-white/10 rounded-lg p-2.5 text-sm text-white">
              <option value="">Select an event...</option>
              {events.map((ev: any) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
          </FormField>
          <FormField label="Room Type">
            <select required value={blockForm.roomTypeId} onChange={e => setBlockForm({ ...blockForm, roomTypeId: e.target.value })} className="w-full bg-[#1a1a24] border border-white/10 rounded-lg p-2.5 text-sm text-white">
              <option value="">Select a room type...</option>
              {roomTypes.map((rt: any) => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Rooms to Block">
              <Input type="number" min="1" required value={blockForm.blockedCount} onChange={e => setBlockForm({ ...blockForm, blockedCount: e.target.value })} className="bg-[#1a1a24] border-white/10 text-white" />
            </FormField>
            <FormField label="Contracted Rate ($)">
              <Input type="number" min="0" step="0.01" required value={blockForm.contractedRate} onChange={e => setBlockForm({ ...blockForm, contractedRate: e.target.value })} className="bg-[#1a1a24] border-white/10 text-white" />
            </FormField>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button type="button" variant="ghost" onClick={() => setNewBlockModal(false)}>Cancel</Button>
            <Button type="submit" className="bg-primary text-white">Create Block</Button>
          </div>
        </form>
      </ModalShell>

      {/* ---- NEW EVENT MODAL ---- */}
      <ModalShell open={newEventModal} onClose={() => setNewEventModal(false)} title="Create Banqueting Event">
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <FormField label="Event Name">
            <Input required value={eventForm.name} onChange={e => setEventForm({ ...eventForm, name: e.target.value })} className="bg-[#1a1a24] border-white/10 text-white" placeholder="e.g. Annual Corporate Gala" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Event Type">
              <select value={eventForm.type} onChange={e => setEventForm({ ...eventForm, type: e.target.value })} className="w-full bg-[#1a1a24] border border-white/10 rounded-lg p-2.5 text-sm text-white">
                <option value="CONFERENCE">Conference</option>
                <option value="WEDDING">Wedding</option>
                <option value="GALA">Gala</option>
                <option value="SEMINAR">Seminar</option>
                <option value="OTHER">Other</option>
              </select>
            </FormField>
            <FormField label="Status">
              <select value={eventForm.status} onChange={e => setEventForm({ ...eventForm, status: e.target.value })} className="w-full bg-[#1a1a24] border border-white/10 rounded-lg p-2.5 text-sm text-white">
                <option value="PROSPECT">Prospect</option>
                <option value="TENTATIVE">Tentative</option>
                <option value="DEFINITE">Definite</option>
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start Date">
              <Input type="datetime-local" required value={eventForm.startDate} onChange={e => setEventForm({ ...eventForm, startDate: e.target.value })} className="bg-[#1a1a24] border-white/10 text-white" />
            </FormField>
            <FormField label="End Date">
              <Input type="datetime-local" required value={eventForm.endDate} onChange={e => setEventForm({ ...eventForm, endDate: e.target.value })} className="bg-[#1a1a24] border-white/10 text-white" />
            </FormField>
          </div>
          <FormField label="Expected Attendees">
            <Input type="number" min="1" required value={eventForm.expectedAttendees} onChange={e => setEventForm({ ...eventForm, expectedAttendees: e.target.value })} className="bg-[#1a1a24] border-white/10 text-white" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Organizer Name">
              <Input required value={eventForm.organizerName} onChange={e => setEventForm({ ...eventForm, organizerName: e.target.value })} className="bg-[#1a1a24] border-white/10 text-white" />
            </FormField>
            <FormField label="Organizer Email">
              <Input type="email" value={eventForm.organizerEmail} onChange={e => setEventForm({ ...eventForm, organizerEmail: e.target.value })} className="bg-[#1a1a24] border-white/10 text-white" />
            </FormField>
          </div>
          <FormField label="Assign to Space (optional)">
            <select value={eventForm.spaceId} onChange={e => setEventForm({ ...eventForm, spaceId: e.target.value })} className="w-full bg-[#1a1a24] border border-white/10 rounded-lg p-2.5 text-sm text-white">
              <option value="">No space assigned</option>
              {spaces.map((sp: any) => <option key={sp.id} value={sp.id}>{sp.name} (cap. {sp.capacity})</option>)}
            </select>
          </FormField>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button type="button" variant="ghost" onClick={() => setNewEventModal(false)}>Cancel</Button>
            <Button type="submit" className="bg-primary text-white">Create Event</Button>
          </div>
        </form>
      </ModalShell>

    </AdminPageShell>
  )
}
