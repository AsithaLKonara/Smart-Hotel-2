import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function MaintenanceTicketsRedirect() {
  redirect('/admin/housekeeping?tab=maintenance')
}
