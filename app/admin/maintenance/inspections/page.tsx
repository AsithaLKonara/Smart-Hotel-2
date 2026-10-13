import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function MaintenanceInspectionsRedirect() {
  redirect('/admin/housekeeping?tab=maintenance')
}
