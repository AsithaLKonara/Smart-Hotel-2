'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Brush, CheckCircle, AlertTriangle, Play, RefreshCw, User } from 'lucide-react'

export default function HousekeepingBoard() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchRooms = () => {
    fetch('/api/admin/housekeeping/rooms')
      .then(res => res.json())
      .then(data => {
        if (data.rooms) setRooms(data.rooms)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchRooms()
  }, [])

  const updateStatus = (roomId: string, newStatus: string) => {
    fetch('/api/admin/housekeeping/rooms', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, newStatus })
    }).then(() => fetchRooms())
  }

  const columns = [
    { title: 'Dirty', status: 'DIRTY', icon: Brush, color: 'text-red-500' },
    { title: 'Cleaning', status: 'CLEANING', icon: Play, color: 'text-blue-500' },
    { title: 'Inspection Pending', status: 'INSPECTION_PENDING', icon: AlertTriangle, color: 'text-yellow-500' },
    { title: 'Clean & Available', status: 'AVAILABLE', icon: CheckCircle, color: 'text-green-500' }
  ]

  return (
    <div className="p-6 h-[calc(100vh-80px)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Housekeeping Board</h1>
          <p className="text-white/60 text-sm">Manage room statuses and monitor cleaning progress.</p>
        </div>
        <button onClick={fetchRooms} className="text-white/50 hover:text-white flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="flex gap-6 flex-1 overflow-x-auto pb-4 custom-scrollbar">
        {columns.map(col => {
          const colRooms = rooms.filter((r: any) => r.status === col.status)
          return (
            <div key={col.status} className="flex-1 min-w-[300px] flex flex-col bg-[#1a1a1a] rounded-xl border border-white/10 p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className={`font-bold flex items-center gap-2 ${col.color}`}>
                  <col.icon className="w-5 h-5" /> {col.title}
                </h2>
                <Badge variant="outline" className="bg-white/5 text-white/50">{colRooms.length}</Badge>
              </div>
              <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar flex-1">
                {colRooms.map((room: any) => (
                  <Card key={room.id} className="bg-black/40 border-white/10 hover:border-white/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xl font-black text-white">{room.number}</span>
                        <Badge variant="secondary" className="text-[10px] uppercase">
                          {room.roomType.name}
                        </Badge>
                      </div>
                      
                      {room.bookings && room.bookings.length > 0 ? (
                        <div className="flex items-center gap-1 text-xs text-white/60 mb-3 bg-primary/10 text-primary p-1 rounded px-2 w-fit">
                          <User className="w-3 h-3" /> Occupied
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-white/40 mb-3 p-1">
                          Vacant
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-white/5">
                        {col.status === 'DIRTY' && (
                          <button onClick={() => updateStatus(room.id, 'CLEANING')} className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded hover:bg-blue-500/30 flex-1">Start Cleaning</button>
                        )}
                        {col.status === 'CLEANING' && (
                          <button onClick={() => updateStatus(room.id, 'INSPECTION_PENDING')} className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded hover:bg-yellow-500/30 flex-1">Ready for Inspect</button>
                        )}
                        {col.status === 'INSPECTION_PENDING' && (
                          <button onClick={() => updateStatus(room.id, 'AVAILABLE')} className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded hover:bg-green-500/30 flex-1">Pass Inspection</button>
                        )}
                        {col.status !== 'DIRTY' && (
                          <button onClick={() => updateStatus(room.id, 'DIRTY')} className="text-xs border border-white/10 text-white/40 px-2 py-1 rounded hover:bg-white/5">Mark Dirty</button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
