import { redirect } from 'next/navigation'

export default function ProcurementOrdersRedirectPage() {
  redirect('/admin/inventory?tab=orders')
}
