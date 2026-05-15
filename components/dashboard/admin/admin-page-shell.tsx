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
    <div className="p-6 text-white pb-40">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/5 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white">{title}</h1>
          <p className="text-slate-400 text-sm mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          {actions}
          {onRefresh && (
            <Button onClick={onRefresh} variant="outline" className="bg-white/5 border-white/10 h-10 px-4 text-xs font-bold uppercase tracking-widest">
              <RefreshCw className="w-4 h-4 mr-2" /> Sync Data
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
