import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Book Your Stay | SmartHotel OS',
  description: 'Reserve your luxury suite at SmartHotel Grand Palace. Secure booking, flexible options, and bespoke guest experiences await.',
}

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
