'use client'

import DashboardSidebar from '@/components/dashboard/dashboard-sidebar'

import { SidebarProvider, useSidebar } from '@/lib/sidebar-context'
import { cn } from '@/lib/utils'
import { CommandPalette } from '@/components/command-palette'
import { IdleTimer } from '@/components/auth/idle-timer'
import { PropertyProvider } from '@/contexts/property-context'
import { GlobalHotkeys } from '@/components/global-hotkeys'

export const dynamic = 'force-dynamic'

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar()

  return (
    <div className="min-h-screen bg-[#0c0c0c]">
      <DashboardSidebar />
      <main className={cn(
        "transition-all duration-300 pt-16 lg:pt-0 min-h-screen",
        isCollapsed ? "lg:pl-20" : "lg:pl-64"
      )}>
        {children}
      </main>
      <CommandPalette />
      <IdleTimer />
      <GlobalHotkeys />
    </div>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PropertyProvider>
      <SidebarProvider>
        <AdminLayoutContent>
          {children}
        </AdminLayoutContent>
      </SidebarProvider>
    </PropertyProvider>
  )
}
