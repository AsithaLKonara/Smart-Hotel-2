import { Users, Search, Plus, Calendar, Settings } from 'lucide-react'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function GroupsPage() {
  const groups = await prisma.groupBlock.findMany({
    orderBy: { startDate: 'asc' }
  })

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-brand-purple" />
            Group Master Folios
          </h1>
          <p className="text-white/60 mt-2">Manage room blocks, allotments, and master accounts.</p>
        </div>
        <button className="bg-brand-purple hover:bg-brand-purple/90 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors">
          <Plus size={18} />
          New Group Block
        </button>
      </div>

      <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/10 bg-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input 
              type="text" 
              placeholder="Search groups..." 
              className="w-full bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-brand-purple transition-colors"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-sm text-white hover:bg-white/5 transition-colors">
              Active Blocks
            </button>
            <button className="flex-1 sm:flex-none px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors">
              Past Blocks
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/40 border-b border-white/10 text-xs uppercase tracking-wider text-white/50">
                <th className="p-4 font-medium">Group Name</th>
                <th className="p-4 font-medium">Dates</th>
                <th className="p-4 font-medium">Allotment</th>
                <th className="p-4 font-medium">Picked Up</th>
                <th className="p-4 font-medium">Master Folio Balance</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {groups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-white/50">
                    No active group blocks found.
                  </td>
                </tr>
              ) : (
                groups.map((group: any) => (
                  <tr key={group.id} className="hover:bg-white/5 transition-colors group/row">
                    <td className="p-4">
                      <div className="font-medium text-white">{group.name}</div>
                      <div className="text-xs text-white/40">{group.code}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-white/80">
                        <Calendar className="w-4 h-4 text-white/40" />
                        {new Date(group.startDate).toLocaleDateString()} - {new Date(group.endDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-white/80">{group.totalRooms} Rooms</td>
                    <td className="p-4 text-sm text-white/80">
                      <div className="w-full bg-white/10 rounded-full h-1.5 mb-1 mt-1">
                        <div 
                          className="bg-brand-purple h-1.5 rounded-full" 
                          style={{ width: `${Math.min(100, (group.pickedUpRooms / group.totalRooms) * 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-white/40">{group.pickedUpRooms} / {group.totalRooms} Picked</span>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-white">${group.masterFolioBalance.toFixed(2)}</div>
                    </td>
                    <td className="p-4 text-right">
                      <button className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                        <Settings className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
