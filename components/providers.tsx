"use client"

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from '@/components/theme-provider'
import { CinematicProvider } from '@/components/cinematic-context'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CinematicProvider>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
      </CinematicProvider>
    </SessionProvider>
  )
}

