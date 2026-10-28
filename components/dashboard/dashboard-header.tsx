"use client"

import { motion } from 'framer-motion'
import { Sparkles, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { OperationalAlertCenter } from './operational-alert-center'

interface DashboardHeaderProps {
  title: string
  subtitle: string
  role?: string
  unreadNotifications?: number
  onMarkRead?: () => void
  firstName?: string
}

export function DashboardHeader({
  title,
  subtitle,
  role,
  unreadNotifications = 0,
  onMarkRead,
  firstName
}: DashboardHeaderProps) {
  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-[#121417] border border-[#1E2227] text-white relative overflow-hidden mb-8 group hide-on-print">
      {/* Hairline subtle accent glow */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
      <div className="absolute -right-20 -top-20 w-[300px] h-[300px] bg-blue-500/5 blur-[90px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2.5"
          >
            <div className="px-2 py-0.5 rounded bg-violet-500/10 border border-violet-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-violet-400" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-violet-400">Node: {role || 'Operational'}</span>
            </div>
            <div className="h-px w-6 bg-[#2B3037]" />
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-500">v4.0 Enterprise</span>
          </motion.div>
          
          <div className="space-y-1">
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-2xl sm:text-3xl font-black text-white tracking-tight"
            >
              {title}{firstName ? `, ${firstName}` : ''}
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-zinc-400 max-w-2xl text-xs sm:text-sm leading-relaxed"
            >
              {subtitle}
            </motion.p>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-3 shrink-0"
        >
          <OperationalAlertCenter />
          
          <button
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg border border-[#2B3037] hover:border-rose-900/40 bg-[#141619] transition-all"
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            <LogOut className="w-3.5 h-3.5" /> 
            Exit Session
          </button>
        </motion.div>
      </div>
    </div>
  )
}
