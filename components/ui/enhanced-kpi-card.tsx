"use client"

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { TrendIndicator } from './trend-indicator'

interface EnhancedKpiCardProps {
  title: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'stable' | 'neutral'
  icon?: LucideIcon
  description?: string
  className?: string
  variant?: 'default' | 'success' | 'warning' | 'danger'
  loading?: boolean
}

export function EnhancedKpiCard({
  title,
  value,
  change,
  trend = 'neutral',
  icon: Icon,
  description,
  className = '',
  variant = 'default',
  loading = false
}: EnhancedKpiCardProps) {
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          container: 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200',
          icon: 'text-emerald-600',
          value: 'text-emerald-900',
          title: 'text-emerald-700'
        }
      case 'warning':
        return {
          container: 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200',
          icon: 'text-amber-600',
          value: 'text-amber-900',
          title: 'text-amber-700'
        }
      case 'danger':
        return {
          container: 'bg-gradient-to-br from-red-50 to-red-100 border-red-200',
          icon: 'text-red-600',
          value: 'text-red-900',
          title: 'text-red-700'
        }
      default:
        return {
          container: 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200',
          icon: 'text-slate-600',
          value: 'text-slate-900',
          title: 'text-slate-700'
        }
    }
  }

  const variantStyles = getVariantStyles()

  if (loading) {
    return (
      <div className={`rounded-xl border p-6 ${variantStyles.container} ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
          <div className="h-8 bg-slate-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-slate-200 rounded w-1/4"></div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className={`rounded-xl border p-6 shadow-sm hover:shadow-md transition-all duration-300 ${variantStyles.container} ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className={`text-sm font-medium ${variantStyles.title} mb-1`}>
            {title}
          </h3>
          <div className={`text-2xl font-bold ${variantStyles.value}`}>
            {value}
          </div>
        </div>
        {Icon && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className={`p-2 rounded-lg bg-white/50 ${variantStyles.icon}`}
          >
            <Icon className="w-5 h-5" />
          </motion.div>
        )}
      </div>
      
      {(change !== undefined || description) && (
        <div className="flex items-center justify-between">
          {change !== undefined && (
            <TrendIndicator 
              trend={trend} 
              change={change} 
              size="sm"
            />
          )}
          {description && (
            <p className={`text-xs ${variantStyles.title} opacity-75`}>
              {description}
            </p>
          )}
        </div>
      )}
    </motion.div>
  )
}
