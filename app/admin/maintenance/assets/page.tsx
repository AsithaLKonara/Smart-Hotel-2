import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function MaintenanceAssetsRedirect() {
  redirect('/admin/housekeeping?tab=maintenance')
}
