"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Calendar, MapPin, Clock, User, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ResortPage() {
  const [facilities, setFacilities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
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

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-white" /></div>

  return (
    <div className="p-6 text-white max-w-7xl mx-auto">
      
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold font-serif mb-2">Resort & Leisure Scheduling</h1>
            <p className="text-slate-400">Manage Spa treatments, Golf tee times, and Cabana rentals.</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 font-bold">
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

    </div>
  )
}
