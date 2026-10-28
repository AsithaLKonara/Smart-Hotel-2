import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDefaultDashboardUrl } from '@/lib/rbac-utils'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (session?.user) {
    const role = (session.user as any).roleName || (session.user as any).role || 'SUPER_ADMIN'
    const dashboardUrl = getDefaultDashboardUrl(role) || '/admin/dashboard'
    redirect(dashboardUrl)
  }

  redirect('/auth/signin')
}
