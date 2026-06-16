"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { canAccessManagerFeatures } from '@/lib/rbac-helpers'
import { PremiumSpinner } from '@/components/ui/premium-spinner'

export default function MaintenanceIndexPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    if (!canAccessManagerFeatures(session)) {
      router.replace('/auth/signin')
      return
    }
    router.replace('/admin/maintenance/tickets')
  }, [session, status, router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <PremiumSpinner size="lg" text="Loading Maintenance..." />
    </div>
  )
}
