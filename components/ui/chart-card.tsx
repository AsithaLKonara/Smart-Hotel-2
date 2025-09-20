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
}

export function ChartCard({ title, subtitle, children, data, type, color, showLegend, className, loading = false }: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        "bg-white rounded-2xl shadow-sm border border-gray-100 p-6",
        className
      )}
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
      </div>
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center">
          {children}
        </div>
      )}
    </motion.div>
  )
}
