import { SidebarProvider } from '@/lib/sidebar-context'
import { PropertyProvider } from '@/contexts/property-context'
import { AdminLayoutShell } from '@/components/dashboard/admin-layout-shell'
import { RealtimeProvider } from '@/components/realtime-provider'
import { SWRProvider } from '@/components/swr-provider'

export const dynamic = 'force-dynamic'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PropertyProvider>
      <SWRProvider>
        <RealtimeProvider>
          <SidebarProvider>
            <AdminLayoutShell>
              {children}
            </AdminLayoutShell>
          </SidebarProvider>
        </RealtimeProvider>
      </SWRProvider>
    </PropertyProvider>
  )
}
