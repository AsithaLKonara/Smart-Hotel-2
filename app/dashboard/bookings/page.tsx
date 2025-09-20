"use client"

import { BookingAnalytics } from '@/components/dashboard/booking-analytics'

export default function BookingAnalyticsPage() {
  const handleExport = (format: 'pdf' | 'csv' | 'excel') => {
    console.log(`Exporting booking report as: ${format}`)
    
    // In a real app, this would trigger the actual export
    switch (format) {
      case 'pdf':
        // Generate PDF report with booking analytics
        break
      case 'csv':
        // Generate CSV export of booking data
        break
      case 'excel':
        // Generate Excel report with charts
        break
    }
  }

  const handleBookingClick = (bookingId: string) => {
    console.log(`Booking clicked: ${bookingId}`)
    // Navigate to booking details
    window.location.href = `/admin/bookings/${bookingId}`
  }

  return (
    <BookingAnalytics 
      onExport={handleExport}
      onBookingClick={handleBookingClick}
    />
  )
}

