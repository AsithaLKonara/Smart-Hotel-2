"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  LogOut,
  Key,
  UtensilsCrossed,
  MapPin,
  Clock,
  Calendar,
  CheckCircle,
  Bell,
  ShieldAlert,
  Smartphone,
  ChevronRight,
  RefreshCw,
  Gift,
  Coffee,
  Waves
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications'

import { GuestDashboardView } from '@/components/dashboard/guest/guest-dashboard-view'

export default function DashboardOrchestrator() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    // Role-based redirection for staff members to their operation centers
    if (session?.user?.role === 'ADMIN') {
      router.push('/admin/dashboard')
    } else if (session?.user?.role === 'RECEPTIONIST') {
      router.push('/admin/receptionist')
    } else if (session?.user?.role === 'HOUSEKEEPING') {
      router.push('/admin/housekeeping')
    } else if (session?.user?.role === 'KITCHEN') {
      router.push('/admin/kitchen')
    }
  }, [status, session, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <PremiumSpinner size="lg" text="Authenticating your session..." />
      </div>
    )
  }

  // Only render Guest View if specifically a guest or role-based check passes
  // Staff will be redirected above
  return (
    <div className="min-h-screen relative text-white font-sans">
      {/* Premium Cinematic Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none select-none">
        <div className="absolute inset-0 bg-[#0c0714]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0714] via-transparent to-[#0c0714]/80" />
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-primary/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <GuestDashboardView session={session} />
    </div>
  )
}
