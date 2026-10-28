'use client'

import { useState } from 'react'
import { useSidebar } from '@/lib/sidebar-context'
import { cn } from '@/lib/utils'
import DashboardSidebar from '@/components/dashboard/dashboard-sidebar'
import { AdminTopHeader } from '@/components/dashboard/admin-top-header'
import { CommandPalette } from '@/components/command-palette'
import { IdleTimer } from '@/components/auth/idle-timer'
import { GlobalHotkeys } from '@/components/global-hotkeys'

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar()
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#090A0C] text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-white print:bg-white">
      <div className="print:hidden">
        <DashboardSidebar />
      </div>
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300 pt-14 lg:pt-0 min-h-screen",
        isCollapsed ? "lg:pl-20" : "lg:pl-64",
        "print:pl-0 print:pt-0 print:min-h-0"
      )}>
        <AdminTopHeader onOpenCommandPalette={() => setCommandPaletteOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1560px] w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
      <IdleTimer />
      <GlobalHotkeys />
    </div>
  )
}
