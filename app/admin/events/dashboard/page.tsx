'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CalendarDays, Users, MapPin, Plus, Hotel, BookOpen, Calculator } from 'lucide-react'

export default function EventsDashboard() {
  const [events, setEvents] = useState([])
  const [activeTab, setActiveTab] = useState('EVENTS')
  const [spaces, setSpaces] = useState([])
  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/admin/events')
      const data = await res.json()
      if (data.events) setEvents(data.events)
      setLoading(false)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchSpaces = async () => {
    try {
      const res = await fetch('/api/admin/events/spaces')
      const data = await res.json()
      if (data.spaces) setSpaces(data.spaces)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchBlocks = async () => {
    try {
      const res = await fetch('/api/admin/events/blocks')
      const data = await res.json()
      if (data.data) setBlocks(data.data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchEvents()
    fetchSpaces()
    fetchBlocks()
  }, [])

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-primary" /> Events & Banqueting
          </h1>
          <p className="text-white/60 text-sm">Manage group blocks, conferences, and event spaces.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['EVENTS', 'SPACES', 'BLOCKS'].map(tab => (
            <Button 
              key={tab}
              variant={activeTab === tab ? 'default' : 'outline'}
              onClick={() => setActiveTab(tab)}
              className={activeTab === tab ? 'bg-primary text-white' : 'bg-white/5 text-white border-white/10'}
            >
              {tab}
            </Button>
          ))}
          <Button
            variant="outline"
            className="bg-white/5 text-white border-white/10 ml-auto"
            onClick={async () => {
              const roomTypeId = prompt('Room Type ID:')
              const checkIn = prompt('Check-In (YYYY-MM-DD):')
              const checkOut = prompt('Check-Out (YYYY-MM-DD):')
              const guests = prompt('Number of Guests:', '2')
              if (!roomTypeId || !checkIn || !checkOut) return
              const res = await fetch('/api/pricing/quote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomTypeId, checkIn, checkOut, guests: parseInt(guests || '1') })
              })
              const data = await res.json()
              if (res.ok) {
                alert(`Price Quote:\n${data.quote.nights} nights · ${data.quote.ratePlanName}\nTotal: $${data.quote.totalAmount} USD`)
              } else {
                alert('Error: ' + data.error)
              }
            }}
          >
            <Calculator className="w-4 h-4 mr-2" /> Get Price Quote
          </Button>
        </div>
      </div>

      {activeTab === 'EVENTS' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event: any) => (
            <Card key={event.id} className="bg-[#1a1a1a] border-white/10 hover:border-white/30 transition-colors">
              <CardContent className="p-5 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-lg">{event.name}</h3>
                    <p className="text-sm text-white/50">{event.type}</p>
                  </div>
                  <Badge variant="outline" className={`
                    ${event.status === 'PROSPECT' ? 'text-yellow-500 border-yellow-500/30' : ''}
                    ${event.status === 'DEFINITE' ? 'text-green-500 border-green-500/30' : ''}
                  `}>
                    {event.status}
                  </Badge>
                </div>

                <div className="flex flex-col gap-2 text-sm text-white/60">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" /> 
                    {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" /> 
                    {event.expectedAttendees} Expected Attendees
                  </div>
                  {event.spaceBookings?.length > 0 && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> 
                      {event.spaceBookings[0].space?.name}
                    </div>
                  )}
                </div>

                {event.groupBlocks?.length > 0 && (
                  <div className="mt-2 pt-4 border-t border-white/10">
                    <p className="text-xs text-white/40 mb-2 uppercase tracking-wider">Group Blocks</p>
                    {event.groupBlocks.map((block: any) => (
                      <div key={block.id} className="flex justify-between items-center bg-white/5 p-2 rounded text-sm">
                        <div className="flex items-center gap-2 text-white">
                          <Hotel className="w-4 h-4 text-primary" /> {block.roomType?.name || 'Room'}
                        </div>
                        <div className="flex items-center gap-4 text-white/60">
                          <span>{block.blockedCount} rooms</span>
                          <span className="text-green-400">${block.contractedRate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 pt-4 border-t border-white/10 flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-primary border-primary/30 bg-primary/10 hover:bg-primary/20 text-xs"
                    onClick={async () => {
                      const userId = prompt('Guest User ID to book attendance:')
                      const attendees = prompt('Number of attendees:', '1')
                      if (!userId || !attendees) return
                      const res = await fetch('/api/events/book', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ eventId: event.id, userId, attendees: parseInt(attendees) })
                      })
                      const data = await res.json()
                      if (res.ok) alert(`Booking confirmed!\nRef: ${data.bookingReference}`)
                      else alert('Error: ' + data.error)
                    }}
                  >
                    <BookOpen className="w-3.5 h-3.5 mr-1" /> Book Attendance
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {events.length === 0 && !loading && (
            <div className="col-span-full p-8 text-center text-white/40 border-2 border-dashed border-white/10 rounded-xl">
              No upcoming events.
            </div>
          )}
        </div>
      )}

      {activeTab === 'SPACES' && (
        <div className="space-y-4">
          <div className="flex justify-end">
             <Button onClick={async () => {
               const name = prompt('Space Name')
               const capacity = prompt('Capacity')
               const hourlyRate = prompt('Hourly Rate')
               const dailyRate = prompt('Daily Rate')
               if (name && capacity) {
                 await fetch('/api/admin/events/spaces', {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ name, capacity, hourlyRate: hourlyRate||0, dailyRate: dailyRate||0 })
                 })
                 fetchSpaces()
               }
             }} className="bg-primary text-white"><Plus className="w-4 h-4 mr-2" /> New Space</Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
             {spaces.map((space: any) => (
               <Card key={space.id} className="bg-[#1a1a1a] border-white/10">
                 <CardContent className="p-5">
                   <h3 className="font-bold text-lg text-white">{space.name}</h3>
                   <div className="flex items-center gap-4 mt-4 text-sm text-white/60">
                     <div className="flex items-center gap-1"><Users className="w-4 h-4 text-primary" /> {space.capacity}</div>
                     <div>${space.hourlyRate}/hr</div>
                     <div>${space.dailyRate}/day</div>
                   </div>
                   <div className="mt-4 pt-4 border-t border-white/10 flex justify-end">
                     <Button variant="ghost" size="sm" onClick={async () => {
                       const res = await fetch(`/api/admin/events/spaces/${space.id}`, { method: 'DELETE' })
                       if(res.ok) fetchSpaces()
                       else alert('Cannot delete space with active bookings')
                     }} className="text-rose-400 hover:text-rose-300 hover:bg-rose-900/20">Delete Space</Button>
                   </div>
                 </CardContent>
               </Card>
             ))}
             {spaces.length === 0 && <p className="text-white/40 p-4">No spaces found.</p>}
          </div>
        </div>
      )}

      {activeTab === 'BLOCKS' && (
        <div className="space-y-4">
          <div className="flex justify-end">
             <Button onClick={async () => {
               const eventId = prompt('Event ID')
               const roomTypeId = prompt('Room Type ID')
               const blockedCount = prompt('Blocked Count')
               const contractedRate = prompt('Contracted Rate')
               if (eventId && roomTypeId && blockedCount && contractedRate) {
                 await fetch('/api/admin/events/blocks', {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ eventId, roomTypeId, blockedCount: parseInt(blockedCount), contractedRate: parseFloat(contractedRate) })
                 })
                 fetchBlocks()
               }
             }} className="bg-primary text-white"><Plus className="w-4 h-4 mr-2" /> New Block</Button>
          </div>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden">
             <table className="w-full text-left text-sm text-white">
               <thead className="bg-white/5 border-b border-white/10">
                 <tr>
                   <th className="p-4 font-medium">Event</th>
                   <th className="p-4 font-medium">Room Type</th>
                   <th className="p-4 font-medium">Blocked</th>
                   <th className="p-4 font-medium">Picked Up</th>
                   <th className="p-4 font-medium">Rate</th>
                   <th className="p-4 font-medium text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-white/10">
                 {blocks.map((block: any) => (
                   <tr key={block.id} className="hover:bg-white/5">
                     <td className="p-4">{block.event?.name}</td>
                     <td className="p-4">{block.roomType?.name}</td>
                     <td className="p-4">{block.blockedCount}</td>
                     <td className="p-4">{block.pickedUpCount}</td>
                     <td className="p-4 text-green-400">${block.contractedRate}</td>
                     <td className="p-4 text-right">
                       <Button variant="ghost" size="sm" onClick={async () => {
                         const res = await fetch(`/api/admin/events/blocks/${block.id}`, { method: 'DELETE' })
                         if(res.ok) fetchBlocks()
                         else alert('Failed to delete block')
                       }} className="text-rose-400 hover:text-rose-300">Delete</Button>
                     </td>
                   </tr>
                 ))}
                 {blocks.length === 0 && (
                   <tr><td colSpan={6} className="p-8 text-center text-white/40">No group blocks found.</td></tr>
                 )}
               </tbody>
             </table>
          </div>
        </div>
      )}
    </div>
  )
}
