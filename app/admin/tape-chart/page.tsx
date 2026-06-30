import React from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { canAccessAdminDashboard } from '@/lib/rbac-helpers'
import TapeChart from '@/components/dashboard/tape-chart'

export const dynamic = 'force-dynamic'

export default async function TapeChartPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  if (!canAccessAdminDashboard(session)) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-[#050309] p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-serif font-bold text-white">Tape Chart Room Assignments</h1>
        <p className="text-slate-400 text-sm">Drag and drop bookings to assign them to different rooms and dates.</p>
      </div>

      <TapeChart />
    </div>
  )
}
