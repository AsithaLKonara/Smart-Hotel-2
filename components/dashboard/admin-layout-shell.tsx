'use client'

import { useSidebar } from '@/lib/sidebar-context'
import { cn } from '@/lib/utils'
import DashboardSidebar from '@/components/dashboard/dashboard-sidebar'
import { CommandPalette } from '@/components/command-palette'
import { IdleTimer } from '@/components/auth/idle-timer'
import { GlobalHotkeys } from '@/components/global-hotkeys'

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar()

  return (
    <div className="min-h-screen bg-[#0c0c0c] print:bg-white">
      <div className="print:hidden">
        <DashboardSidebar />
      </div>
      <main className={cn(
        "transition-all duration-300 pt-16 lg:pt-0 min-h-screen",
        isCollapsed ? "lg:pl-20" : "lg:pl-64",
        "print:pl-0 print:pt-0 print:min-h-0"
      )}>
        {children}
      </main>
      <CommandPalette />
      <IdleTimer />
      <GlobalHotkeys />
    </div>
  )
}
