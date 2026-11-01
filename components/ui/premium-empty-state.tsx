"use client"

import { motion } from 'framer-motion'
import { Sparkles, Inbox, Search, BellOff, History, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface PremiumEmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  className?: string
  variant?: 'calm' | 'alert' | 'luxury'
}

export const PremiumEmptyState = forwardRef<HTMLDivElement, PremiumEmptyStateProps>(({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className,
  variant = 'calm'
}, ref) => {
  return (
    <motion.div 
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col items-center justify-center text-center p-12 md:p-20 rounded-[48px] border border-border dark:border-white/[0.05] bg-card dark:bg-[#0c0c0c] relative overflow-hidden group shadow-sm dark:shadow-none",
        className
      )}
    >
      {/* Decorative Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/20 dark:from-white/[0.02] to-transparent pointer-events-none" />
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/5 blur-[100px] rounded-full group-hover:bg-primary/10 transition-colors duration-1000" />
      
      <div className="relative z-10 space-y-6">
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 bg-muted/40 dark:bg-white/[0.03] border border-border dark:border-white/10 rounded-3xl rotate-12 group-hover:rotate-45 transition-transform duration-700" />
          <div className="absolute inset-0 bg-muted/40 dark:bg-white/[0.03] border border-border dark:border-white/10 rounded-3xl -rotate-12 group-hover:-rotate-12 transition-transform duration-700" />
          <div className="relative p-6 bg-card dark:bg-[#0c0c0c] border border-border dark:border-white/10 rounded-2xl shadow-xl">
            <Icon className="w-8 h-8 text-muted-foreground/60 dark:text-white/20 group-hover:text-primary transition-colors duration-500" />
          </div>
          <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-primary/40 animate-pulse" />
        </div>

        <div className="space-y-2 max-w-sm mx-auto">
          <h3 className="text-2xl font-serif font-bold text-foreground dark:text-white tracking-tight">{title}</h3>
          <p className="text-sm text-muted-foreground dark:text-white/30 leading-relaxed font-medium">
            {description}
          </p>
        </div>

        {actionLabel && (
          <button 
            onClick={onAction}
            className="mt-4 px-8 py-4 bg-muted/60 dark:bg-white/5 hover:bg-muted dark:hover:bg-white/10 border border-border dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-foreground/70 dark:text-white/40 hover:text-foreground dark:hover:text-white transition-all shadow-md"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </motion.div>
  )
})

PremiumEmptyState.displayName = 'PremiumEmptyState'

export const NoResultsEmptyState = forwardRef<HTMLDivElement, { onReset?: () => void }>(({ onReset }, ref) => {
  return (
    <PremiumEmptyState 
      ref={ref}
      icon={Search}
      title="No Coordinates Found"
      description="The search parameters yielded no operational data. Please refine your query or clear active filters."
      actionLabel="Clear Filters"
      onAction={onReset}
      className="w-full"
    />
  )
})

NoResultsEmptyState.displayName = 'NoResultsEmptyState'

export function NoNotificationsEmptyState() {
  return (
    <PremiumEmptyState 
      icon={BellOff}
      title="Quiet Horizon"
      description="Your notification channel is currently clear. No pending alerts require your immediate attention."
      variant="calm"
      className="w-full"
    />
  )
}

export function NoHistoryEmptyState() {
  return (
    <PremiumEmptyState 
      icon={History}
      title="Blank Archive"
      description="No historical records found for this period. Start performing actions to populate your timeline."
      variant="luxury"
      className="w-full"
    />
  )
}
