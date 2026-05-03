'use client'

import AdminSidebar from '@/components/admin/admin-sidebar'
import { SessionProvider } from 'next-auth/react'
import { SidebarProvider, useSidebar } from '@/lib/sidebar-context'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar()
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar />
      <main className={cn(
        "transition-all duration-300 pt-16 lg:pt-0",
        isCollapsed ? "lg:pl-20" : "lg:pl-64"
      )}>
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <SidebarProvider>
        <AdminLayoutContent>
          {children}
        </AdminLayoutContent>
      </SidebarProvider>
    </SessionProvider>
  )
}
