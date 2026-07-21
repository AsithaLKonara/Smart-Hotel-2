"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { canAccessManagerFeatures } from '@/lib/rbac-helpers'
import { PremiumSpinner } from '@/components/ui/premium-spinner'

export default function AccountingIndexPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    if (!canAccessManagerFeatures(session)) {
      router.replace('/auth/signin')
      return
    }
    router.replace('/admin/accounting/folios')
  }, [session, status]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <PremiumSpinner size="lg" text="Loading Accounting..." />
    </div>
  )
}
