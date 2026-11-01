import { Users, Search, Plus, Calendar, Settings } from 'lucide-react'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function GroupsPage() {
  const rawBlocks = await prisma.groupBlock.findMany({
    include: {
      event: true,
      roomType: true,
      bookings: true
    },
    orderBy: { createdAt: 'desc' }
  })

  const groups = rawBlocks.map((b: any) => ({
    id: b.id,
    name: b.event?.name || 'Group Block',
    code: b.event?.id ? `GRP-${b.event.id.slice(0, 6).toUpperCase()}` : 'GRP-STANDARD',
    startDate: b.event?.startDate ? new Date(b.event.startDate).toISOString() : new Date(b.createdAt).toISOString(),
    endDate: b.event?.endDate ? new Date(b.event.endDate).toISOString() : new Date(b.createdAt).toISOString(),
    totalRooms: b.blockedCount || 0,
    pickedUpRooms: b.bookings?.length || 0,
    masterFolioBalance: Number(b.contractedRate || 0) * (b.blockedCount || 0)
  }))

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground dark:text-white tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            Group Master Folios
          </h1>
          <p className="text-muted-foreground dark:text-white/60 mt-2">Manage room blocks, allotments, and master accounts.</p>
        </div>
        <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors shadow-sm">
          <Plus size={18} />
          New Group Block
        </button>
      </div>

      <div className="bg-card dark:bg-[#111] border border-border dark:border-white/10 rounded-xl overflow-hidden shadow-md">
        <div className="p-4 border-b border-border dark:border-white/10 bg-muted/40 dark:bg-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground dark:text-white/40" />
            <input 
              type="text" 
              placeholder="Search groups..." 
              className="w-full bg-background dark:bg-black/50 border border-input dark:border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-foreground dark:text-white placeholder:text-muted-foreground/60 dark:placeholder-white/40 focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none px-3 py-2 bg-primary/10 dark:bg-black/50 border border-primary/30 dark:border-white/10 rounded-lg text-sm text-primary dark:text-white font-medium hover:bg-primary/20 dark:hover:bg-white/5 transition-colors">
              Active Blocks
            </button>
            <button className="flex-1 sm:flex-none px-3 py-2 bg-muted/40 dark:bg-black/50 border border-border dark:border-white/10 rounded-lg text-sm text-muted-foreground dark:text-white/50 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-white/5 transition-colors">
              Past Blocks
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/60 dark:bg-black/40 border-b border-border dark:border-white/10 text-xs uppercase tracking-wider text-muted-foreground dark:text-white/50">
                <th className="p-4 font-medium">Group Name</th>
                <th className="p-4 font-medium">Dates</th>
                <th className="p-4 font-medium">Allotment</th>
                <th className="p-4 font-medium">Picked Up</th>
                <th className="p-4 font-medium">Master Folio Balance</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-white/5">
              {groups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground dark:text-white/50">
                    No active group blocks found.
                  </td>
                </tr>
              ) : (
                groups.map((group: any) => (
                  <tr key={group.id} className="hover:bg-muted/30 dark:hover:bg-white/5 transition-colors group/row">
                    <td className="p-4">
                      <div className="font-medium text-foreground dark:text-white">{group.name}</div>
                      <div className="text-xs text-muted-foreground dark:text-white/40">{group.code}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-foreground/80 dark:text-white/80">
                        <Calendar className="w-4 h-4 text-muted-foreground dark:text-white/40" />
                        {new Date(group.startDate).toLocaleDateString()} - {new Date(group.endDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-foreground/80 dark:text-white/80">{group.totalRooms} Rooms</td>
                    <td className="p-4 text-sm text-foreground/80 dark:text-white/80">
                      <div className="w-full bg-muted dark:bg-white/10 rounded-full h-1.5 mb-1 mt-1">
                        <div 
                          className="bg-primary h-1.5 rounded-full" 
                          style={{ width: `${Math.min(100, (group.pickedUpRooms / (group.totalRooms || 1)) * 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-muted-foreground dark:text-white/40">{group.pickedUpRooms} / {group.totalRooms} Picked</span>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-foreground dark:text-white">${Number(group.masterFolioBalance || 0).toFixed(2)}</div>
                    </td>
                    <td className="p-4 text-right">
                      <button className="p-2 text-muted-foreground dark:text-white/40 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-white/10 rounded-lg transition-colors">
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
