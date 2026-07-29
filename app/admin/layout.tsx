import { SidebarProvider } from '@/lib/sidebar-context'
import { PropertyProvider } from '@/contexts/property-context'
import { AdminLayoutShell } from '@/components/dashboard/admin-layout-shell'

export const dynamic = 'force-dynamic'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PropertyProvider>
      <SidebarProvider>
        <AdminLayoutShell>
          {children}
        </AdminLayoutShell>
      </SidebarProvider>
    </PropertyProvider>
  )
}
