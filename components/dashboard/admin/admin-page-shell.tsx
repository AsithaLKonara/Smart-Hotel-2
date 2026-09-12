"use client"

import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AdminPageShellProps {
  title: string
  subtitle: string
  children: React.ReactNode
  onRefresh?: () => void
  actions?: React.ReactNode
}

export function AdminPageShell({ 
  title, 
  subtitle, 
  children, 
  onRefresh,
  actions 
}: AdminPageShellProps) {
  return (
    <div className="p-6 text-foreground pb-40">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-border pb-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          {actions}
          {onRefresh && (
            <Button onClick={onRefresh} variant="outline" className="h-10 px-4 text-sm font-medium">
              <RefreshCw className="w-4 h-4 mr-2 text-muted-foreground" /> Sync Data
            </Button>
          )}
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {children}
      </motion.div>
    </div>
  )
}
