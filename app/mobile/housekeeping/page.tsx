import prisma from '@/lib/db'
import { Brush, CheckCircle, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function MobileHousekeeping() {
  const rooms = await prisma.room.findMany({
    orderBy: { number: 'asc' }
  })

  // In a real app we would use client components and server actions to mutate state
  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white">
      {/* Mobile App Header */}
      <div className="bg-brand-purple p-4 flex items-center gap-3 shadow-lg sticky top-0 z-50">
        <Brush className="w-6 h-6 text-white" />
        <h1 className="text-xl font-bold tracking-tight">Housekeeping</h1>
      </div>

      <div className="p-4 space-y-4">
        {rooms.map((room: any) => (
          <div key={room.id} className="bg-[#1a1a1a] p-4 rounded-2xl shadow-xl border border-white/5 flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-3xl font-black">{room.number}</span>
                <span className="block text-sm text-white/50">{room.type}</span>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                room.status === 'CLEAN' ? 'bg-green-500/20 text-green-400' :
                room.status === 'DIRTY' ? 'bg-red-500/20 text-red-400' :
                'bg-yellow-500/20 text-yellow-400'
              }`}>
                {room.status}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <button className="flex items-center justify-center gap-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 p-4 rounded-xl font-bold transition-colors active:scale-95">
                <CheckCircle className="w-5 h-5" />
                Clean
              </button>
              <button className="flex items-center justify-center gap-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 p-4 rounded-xl font-bold transition-colors active:scale-95">
                <Clock className="w-5 h-5" />
                Progress
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
