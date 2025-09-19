import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SmartHotel - Professional Hotel Management System',
  description: 'Luxury hotel management system with booking, room management, and guest services.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}