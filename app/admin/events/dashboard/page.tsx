'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CalendarDays, Users, MapPin, Plus, Hotel } from 'lucide-react'

export default function EventsDashboard() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchEvents = () => {
    fetch('/api/admin/events')
      .then(res => res.json())
      .then(data => {
        if (data.events) setEvents(data.events)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchEvents()
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
        <Button className="bg-primary text-white flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Event
        </Button>
      </div>

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
                    {event.spaceBookings[0].space.name}
                  </div>
                )}
              </div>

              {event.groupBlocks?.length > 0 && (
                <div className="mt-2 pt-4 border-t border-white/10">
                  <p className="text-xs text-white/40 mb-2 uppercase tracking-wider">Group Blocks</p>
                  {event.groupBlocks.map((block: any) => (
                    <div key={block.id} className="flex justify-between items-center bg-white/5 p-2 rounded text-sm">
                      <div className="flex items-center gap-2 text-white">
                        <Hotel className="w-4 h-4 text-primary" /> {block.roomType.name}
                      </div>
                      <div className="flex items-center gap-4 text-white/60">
                        <span>{block.blockedCount} rooms</span>
                        <span className="text-green-400">${block.contractedRate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {events.length === 0 && !loading && (
          <div className="col-span-full p-8 text-center text-white/40 border-2 border-dashed border-white/10 rounded-xl">
            No upcoming events.
          </div>
        )}
      </div>
    </div>
  )
}
