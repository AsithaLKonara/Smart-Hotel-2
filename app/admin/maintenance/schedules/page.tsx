import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function MaintenanceSchedulesRedirect() {
  redirect('/admin/housekeeping?tab=maintenance')
}
