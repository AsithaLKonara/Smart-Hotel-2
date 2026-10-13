import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function TapeChartRedirect() {
  redirect('/admin/receptionist?view=tape-chart')
}
