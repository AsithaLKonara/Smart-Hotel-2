"use client"

import { DashboardOverview } from '@/components/dashboard/dashboard-overview'

export default function DashboardPage() {
  const handleNavigate = (section: string) => {
    console.log(`Navigate to: ${section}`)
    // In a real app, this would navigate to the appropriate section
    switch (section) {
      case 'bookings':
        window.location.href = '/admin/bookings'
        break
      case 'orders':
        window.location.href = '/admin/kitchen'
        break
      case 'revenue':
        window.location.href = '/dashboard/revenue'
        break
      case 'tasks':
        window.location.href = '/admin/tasks'
        break
      default:
        break
    }
  }

  return (
    <DashboardOverview onNavigate={handleNavigate} />
  )
}

