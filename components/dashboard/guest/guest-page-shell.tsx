"use client"

import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { motion } from 'framer-motion'

interface GuestPageShellProps {
  title: string
  subtitle: string
  children: React.ReactNode
  firstName?: string
}

export function GuestPageShell({ title, subtitle, children, firstName }: GuestPageShellProps) {
  return (
    <div className="p-6 text-white pb-40">
      <DashboardHeader 
        title={title}
        firstName={firstName}
        subtitle={subtitle}
        role="Signature Elite"
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-12"
      >
        {children}
      </motion.div>
    </div>
  )
}
