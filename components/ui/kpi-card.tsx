"use client"

import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { motionVariants } from "@/lib/design-tokens"

interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  delta?: number
  deltaLabel?: string
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral' | React.ReactNode
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info'
  className?: string
  onClick?: () => void
}

export function KpiCard({
  title,
  value,
  subtitle,
  delta,
  deltaLabel,
  icon,
  trend,
  color = 'primary',
  className,
  onClick
}: KpiCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      return new Intl.NumberFormat('en-US').format(val)
    }
    return val
  }

  const getTrendIcon = () => {
    if (delta === undefined) return null
    
    if (delta > 0) {
      return <TrendingUp className="w-4 h-4" />
    } else if (delta < 0) {
      return <TrendingDown className="w-4 h-4" />
    } else {
      return <Minus className="w-4 h-4" />
    }
  }

  const getTrendColor = () => {
    if (delta === undefined) return 'text-gray-500'
    
    if (delta > 0) return 'text-green-600'
    if (delta < 0) return 'text-red-600'
    return 'text-gray-500'
  }

  const getColorClasses = () => {
    const colors = {
      primary: 'border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100',
      success: 'border-green-200 bg-gradient-to-br from-green-50 to-green-100',
      warning: 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100',
      error: 'border-red-200 bg-gradient-to-br from-red-50 to-red-100',
      info: 'border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100',
    }
    return colors[color]
  }

  const getIconColor = () => {
    const colors = {
      primary: 'text-amber-600',
      success: 'text-green-600',
      warning: 'text-yellow-600',
      error: 'text-red-600',
      info: 'text-blue-600',
    }
    return colors[color]
  }

  const CardComponent = onClick ? motion.button : motion.div
  const cardProps = onClick ? {
    whileHover: { scale: 1.02, y: -2 },
    whileTap: { scale: 0.98 },
    transition: { duration: 0.2, ease: 'easeOut' }
  } : {
    whileHover: { y: -2 },
    transition: { duration: 0.2, ease: 'easeOut' }
  }

  return (
    <CardComponent
      {...cardProps}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        "relative p-6 rounded-2xl border-2 shadow-sm hover:shadow-lg transition-all duration-300",
        getColorClasses(),
        onClick && "cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2",
        className
      )}
      onClick={onClick}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-current" />
        <div className="absolute bottom-4 left-4 w-8 h-8 rounded-full bg-current" />
      </div>

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {icon && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, duration: 0.3, ease: 'easeOut' }}
                className={cn("p-2 rounded-lg bg-white/50", getIconColor())}
              >
                {icon}
              </motion.div>
            )}
            <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
              {title}
            </h3>
          </div>
        </div>

        {/* Value */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3, ease: 'easeOut' }}
          className="mb-3"
        >
          <div className="text-3xl font-bold text-gray-900">
            {formatValue(value)}
          </div>
          {subtitle && (
            <div className="text-sm text-gray-600 mt-1">
              {subtitle}
            </div>
          )}
        </motion.div>

        {/* Delta */}
        {delta !== undefined && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.3, ease: 'easeOut' }}
            className="flex items-center gap-2"
          >
            <div className={cn("flex items-center gap-1", getTrendColor())}>
              {getTrendIcon()}
              <span className="text-sm font-medium">
                {Math.abs(delta)}%
              </span>
            </div>
            
            {deltaLabel && (
              <span className="text-sm text-gray-500">
                {deltaLabel}
              </span>
            )}
          </motion.div>
        )}
      </div>

      {/* Hover Effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent"
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      />
    </CardComponent>
  )
}

// Preset KPI Cards for common metrics
export function OccupancyCard({ occupancy, delta, className }: {
  occupancy: number
  delta?: number
  className?: string
}) {
  return (
    <KpiCard
      title="Occupancy Rate"
      value={`${occupancy}%`}
      delta={delta}
      deltaLabel="vs last month"
      icon={<div className="w-5 h-5">🏨</div>}
      color="primary"
      className={className}
    />
  )
}

export function RevenueCard({ revenue, delta, className }: {
  revenue: number
  delta?: number
  className?: string
}) {
  return (
    <KpiCard
      title="Daily Revenue"
      value={`$${revenue.toLocaleString()}`}
      delta={delta}
      deltaLabel="vs yesterday"
      icon={<div className="w-5 h-5">💰</div>}
      color="success"
      className={className}
    />
  )
}

export function BookingsCard({ bookings, delta, className }: {
  bookings: number
  delta?: number
  className?: string
}) {
  return (
    <KpiCard
      title="Active Bookings"
      value={bookings}
      delta={delta}
      deltaLabel="vs last week"
      icon={<div className="w-5 h-5">📅</div>}
      color="info"
      className={className}
    />
  )
}

export function TasksCard({ tasks, delta, className }: {
  tasks: number
  delta?: number
  className?: string
}) {
  return (
    <KpiCard
      title="Pending Tasks"
      value={tasks}
      delta={delta}
      deltaLabel="vs yesterday"
      icon={<div className="w-5 h-5">📋</div>}
      color={tasks > 10 ? 'warning' : 'success'}
      className={className}
    />
  )
}

