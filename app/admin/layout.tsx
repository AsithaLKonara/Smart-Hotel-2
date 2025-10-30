'use client'

import AdminSidebar from '@/components/admin/admin-sidebar'
import { SessionProvider } from 'next-auth/react'

export const dynamic = 'force-dynamic'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AdminSidebar />
        <main className="lg:pl-64 pt-16 lg:pt-0">
          <div className="min-h-screen">
            {children}
          </div>
        </main>
      </div>
    </SessionProvider>
  )
}
