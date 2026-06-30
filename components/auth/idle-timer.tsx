'use client'

import { useEffect, useState } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const IDLE_TIMEOUT = 15 * 60 * 1000 // 15 minutes

export function IdleTimer() {
  const [lastActivity, setLastActivity] = useState(Date.now())
  const router = useRouter()

  useEffect(() => {
    const handleActivity = () => setLastActivity(Date.now())

    // Listen for common interaction events
    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('keydown', handleActivity)
    window.addEventListener('scroll', handleActivity)
    window.addEventListener('click', handleActivity)

    const interval = setInterval(() => {
      if (Date.now() - lastActivity > IDLE_TIMEOUT) {
        // Auto logout
        console.warn('User idle for too long, logging out.')
        signOut({ redirect: false }).then(() => {
          router.push('/login?reason=idle')
        })
      }
    }, 60000) // Check every minute

    return () => {
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      window.removeEventListener('scroll', handleActivity)
      window.removeEventListener('click', handleActivity)
      clearInterval(interval)
    }
  }, [lastActivity, router])

  return null
}
