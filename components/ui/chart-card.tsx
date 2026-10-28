"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ChartCardProps {
  title: string
  subtitle?: string
  children?: ReactNode
  data?: any
  type?: string
  color?: string
  showLegend?: boolean
  className?: string
  loading?: boolean
  headerAction?: ReactNode
}

export function ChartCard({ 
  title, 
  subtitle, 
  children, 
  className, 
  loading = false,
  headerAction 
}: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        "rounded-2xl bg-[#121417] border border-[#1E2227] p-5 sm:p-6 hover:border-zinc-700 transition-colors group",
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-wide">{title}</h3>
          {subtitle && (
            <p className="text-xs text-zinc-400 font-mono mt-0.5">{subtitle}</p>
          )}
        </div>
        {headerAction && (
          <div>{headerAction}</div>
        )}
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center">
          {children}
        </div>
      )}
    </motion.div>
  )
}
