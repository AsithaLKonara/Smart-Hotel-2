'use client'
import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export default function RoomSelector({ selectedRoom, onSelectRoom }: { selectedRoom: any, onSelectRoom: (room: any) => void }) {
  const [rooms, setRooms] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/pos')
      .then(res => res.json())
      .then(data => {
        // Filter rooms to only those with active bookings and folios
        const activeRooms = data.rooms?.filter((r: any) => r.stays?.length > 0) || []
        // Alternatively use activeBookings to extract rooms
        let combinedRooms = activeRooms.map((r: any) => {
          const stay = r.stays[0]
          return {
            id: r.id,
            number: r.number,
            guestName: stay.booking.primaryGuest.name,
            folioId: data.activeBookings?.find((b: any) => b.id === stay.booking.id)?.folio?.id,
            bookingId: stay.booking.id,
            guestId: stay.booking.primaryGuest.id,
          }
        })
        setRooms(combinedRooms)
        setLoading(false)
      })
  }, [])

  const filteredRooms = rooms.filter(r => r.number.toLowerCase().includes(search.toLowerCase()) || r.guestName.toLowerCase().includes(search.toLowerCase()))

  return (
    <Card className="flex flex-col flex-1 bg-[#1a1325] border-purple-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-purple-100 uppercase tracking-wider">Select Room</CardTitle>
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input 
            placeholder="Search room or guest..." 
            className="pl-9 bg-black/50 border-gray-800 text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
        {loading ? (
          <div className="text-sm text-gray-400 text-center py-4">Loading rooms...</div>
        ) : filteredRooms.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-4">No active rooms found.</div>
        ) : (
          filteredRooms.map(room => (
            <div 
              key={room.id}
              onClick={() => onSelectRoom(room)}
              className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                selectedRoom?.id === room.id 
                  ? 'bg-purple-600/20 border-purple-500' 
                  : 'bg-black/30 border-transparent hover:border-purple-500/50 hover:bg-black/50'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-white">Room {room.number}</span>
                {!room.folioId && <span className="text-xs text-red-400">No Open Folio</span>}
              </div>
              <div className="text-sm text-gray-400 truncate">{room.guestName}</div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
