'use client'

import DashboardSidebar from '@/components/dashboard/dashboard-sidebar'
import { SessionProvider } from 'next-auth/react'
import { SidebarProvider, useSidebar } from '@/lib/sidebar-context'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

function KitchenLayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar()

  return (
    <div className="min-h-screen bg-[#090514]">
      <DashboardSidebar />
      <main className={cn(
        "transition-all duration-300 pt-16 lg:pt-0 min-h-screen",
        isCollapsed ? "lg:pl-20" : "lg:pl-64"
      )}>
        {children}
      </main>
    </div>
  )
}

export default function KitchenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <SidebarProvider>
        <KitchenLayoutContent>
          {children}
        </KitchenLayoutContent>
      </SidebarProvider>
    </SessionProvider>
  )
}
