"use client"
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { hasRole, isAuthenticated, UserRole } from '@/lib/rbac-helpers'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  redirectTo?: string
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles = ['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST'] as UserRole[], 
  redirectTo = '/auth/signin' 
}: ProtectedRouteProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (!isAuthenticated(session)) {
      router.push(redirectTo)
      return
    }

    if (allowedRoles.length > 0 && !hasRole(session, allowedRoles)) {
      router.push('/')
      return
    }
  }, [session, status, router, allowedRoles, redirectTo])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated(session) || (allowedRoles.length > 0 && !hasRole(session, allowedRoles))) {
    return null
  }

  return <>{children}</>
} 