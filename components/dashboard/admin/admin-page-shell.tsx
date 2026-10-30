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
    <div className="text-foreground pb-16 transition-colors duration-200">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-border dark:border-[#1C2025] pb-5 mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground dark:text-white">{title}</h1>
          <p className="text-xs text-muted-foreground dark:text-zinc-400 mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2.5 mt-2 md:mt-0">
          {actions}
          {onRefresh && (
            <button 
              onClick={onRefresh} 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card dark:bg-[#141619] hover:bg-muted dark:hover:bg-[#1A1D21] border border-border dark:border-[#2B3037] text-foreground dark:text-zinc-300 text-xs font-medium transition-colors shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Sync Data
            </button>
          )}
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </div>
  )
}
