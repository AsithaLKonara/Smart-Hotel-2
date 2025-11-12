import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)

  // Redirect to dashboard if authenticated, otherwise redirect to login
  if (session) {
    redirect('/admin/dashboard')
  } else {
    // Redirect to sign-in page if not authenticated
    redirect('/api/auth/signin')
  }
}

