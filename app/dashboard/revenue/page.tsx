"use client"

import { RevenueAnalytics } from '@/components/dashboard/revenue-analytics'

export default function RevenueAnalyticsPage() {
  const handleExport = (format: 'pdf' | 'csv' | 'excel') => {
    console.log(`Exporting report as: ${format}`)
    
    // In a real app, this would trigger the actual export
    switch (format) {
      case 'pdf':
        // Generate PDF report
        break
      case 'csv':
        // Generate CSV export
        break
      case 'excel':
        // Generate Excel export
        break
    }
  }

  return (
    <RevenueAnalytics onExport={handleExport} />
  )
}

