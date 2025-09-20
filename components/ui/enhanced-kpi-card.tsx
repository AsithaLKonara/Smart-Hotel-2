"use client"

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, ArrowUpRight, DollarSign, Users, Calendar, Star } from 'lucide-react'
import { TrendIndicator } from './trend-indicator'

interface EnhancedKpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  change: number
  trend: 'up' | 'down' | 'stable' | 'neutral'
  icon: React.ReactNode
  color: string
  onClick?: () => void
  loading?: boolean
  className?: string
}

export function EnhancedKpiCard({ 
  title, 
  value, 
  subtitle,
  change, 
  trend, 
  icon, 
  color, 
  onClick,
  loading = false,
  className = '' 
}: EnhancedKpiCardProps) {
  
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`
      }
      return val.toLocaleString()
    }
    return val
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded-full w-16"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-32 mb-3"></div>
          <div className="flex justify-between items-center">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-4"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      className={`group bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100 ${className}`}
      onClick={onClick}
    >
      {/* Header with Icon */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${color}`}>
            {icon}
          </div>
          <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
            {title}
          </h3>
        </div>
        
        <TrendIndicator trend={trend} change={change} />
      </div>
      
      {/* Main Value */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
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
      
      {/* Trend and Action */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">vs last month</span>
        <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
      </div>
      
      {/* Progress Bar */}
      <div className="mt-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(Math.abs(change) * 2, 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-2 rounded-full ${
              trend === 'up' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' :
              trend === 'down' ? 'bg-gradient-to-r from-red-500 to-red-600' :
              'bg-gradient-to-r from-gray-400 to-gray-500'
            }`}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {Math.min(Math.abs(change) * 2, 100).toFixed(0)}% of target
        </div>
      </div>
    </motion.div>
  )
}

// Predefined KPI Card Variants
export function RevenueKpiCard({ 
  value, 
  change, 
  trend, 
  onClick,
  loading = false 
}: {
  value: number
  change: number
  trend: 'up' | 'down' | 'stable' | 'neutral'
  onClick?: () => void
  loading?: boolean
}) {
  return (
    <EnhancedKpiCard
      title="Total Revenue"
      value={value}
      subtitle="This month"
      change={change}
      trend={trend}
      icon={<DollarSign className="w-6 h-6 text-white" />}
      color="bg-gradient-to-br from-emerald-500 to-teal-600"
      onClick={onClick}
      loading={loading}
    />
  )
}

export function OccupancyKpiCard({ 
  value, 
  change, 
  trend, 
  onClick,
  loading = false 
}: {
  value: number
  change: number
  trend: 'up' | 'down' | 'stable' | 'neutral'
  onClick?: () => void
  loading?: boolean
}) {
  return (
    <EnhancedKpiCard
      title="Occupancy Rate"
      value={`${value}%`}
      subtitle="Current"
      change={change}
      trend={trend}
      icon={<Users className="w-6 h-6 text-white" />}
      color="bg-gradient-to-br from-blue-500 to-indigo-600"
      onClick={onClick}
      loading={loading}
    />
  )
}

export function BookingsKpiCard({ 
  value, 
  change, 
  trend, 
  onClick,
  loading = false 
}: {
  value: number
  change: number
  trend: 'up' | 'down' | 'stable' | 'neutral'
  onClick?: () => void
  loading?: boolean
}) {
  return (
    <EnhancedKpiCard
      title="Active Bookings"
      value={value}
      subtitle="Today"
      change={change}
      trend={trend}
      icon={<Calendar className="w-6 h-6 text-white" />}
      color="bg-gradient-to-br from-purple-500 to-pink-600"
      onClick={onClick}
      loading={loading}
    />
  )
}

export function RatingKpiCard({ 
  value, 
  change, 
  trend, 
  onClick,
  loading = false 
}: {
  value: number
  change: number
  trend: 'up' | 'down' | 'stable' | 'neutral'
  onClick?: () => void
  loading?: boolean
}) {
  return (
    <EnhancedKpiCard
      title="Guest Rating"
      value={value.toFixed(1)}
      subtitle="Average"
      change={change}
      trend={trend}
      icon={<Star className="w-6 h-6 text-white" />}
      color="bg-gradient-to-br from-amber-500 to-orange-600"
      onClick={onClick}
      loading={loading}
    />
  )
}

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, ArrowUpRight, DollarSign, Users, Calendar, Star } from 'lucide-react'
import { TrendIndicator } from './trend-indicator'

interface EnhancedKpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  change: number
  trend: 'up' | 'down' | 'stable' | 'neutral'
  icon: React.ReactNode
  color: string
  onClick?: () => void
  loading?: boolean
  className?: string
}

export function EnhancedKpiCard({ 
  title, 
  value, 
  subtitle,
  change, 
  trend, 
  icon, 
  color, 
  onClick,
  loading = false,
  className = '' 
}: EnhancedKpiCardProps) {
  
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`
      }
      return val.toLocaleString()
    }
    return val
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded-full w-16"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-32 mb-3"></div>
          <div className="flex justify-between items-center">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-4"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      className={`group bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100 ${className}`}
      onClick={onClick}
    >
      {/* Header with Icon */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${color}`}>
            {icon}
          </div>
          <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
            {title}
          </h3>
        </div>
        
        <TrendIndicator trend={trend} change={change} />
      </div>
      
      {/* Main Value */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
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
      
      {/* Trend and Action */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">vs last month</span>
        <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
      </div>
      
      {/* Progress Bar */}
      <div className="mt-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(Math.abs(change) * 2, 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-2 rounded-full ${
              trend === 'up' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' :
              trend === 'down' ? 'bg-gradient-to-r from-red-500 to-red-600' :
              'bg-gradient-to-r from-gray-400 to-gray-500'
            }`}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {Math.min(Math.abs(change) * 2, 100).toFixed(0)}% of target
        </div>
      </div>
    </motion.div>
  )
}

// Predefined KPI Card Variants
export function RevenueKpiCard({ 
  value, 
  change, 
  trend, 
  onClick,
  loading = false 
}: {
  value: number
  change: number
  trend: 'up' | 'down' | 'stable' | 'neutral'
  onClick?: () => void
  loading?: boolean
}) {
  return (
    <EnhancedKpiCard
      title="Total Revenue"
      value={value}
      subtitle="This month"
      change={change}
      trend={trend}
      icon={<DollarSign className="w-6 h-6 text-white" />}
      color="bg-gradient-to-br from-emerald-500 to-teal-600"
      onClick={onClick}
      loading={loading}
    />
  )
}

export function OccupancyKpiCard({ 
  value, 
  change, 
  trend, 
  onClick,
  loading = false 
}: {
  value: number
  change: number
  trend: 'up' | 'down' | 'stable' | 'neutral'
  onClick?: () => void
  loading?: boolean
}) {
  return (
    <EnhancedKpiCard
      title="Occupancy Rate"
      value={`${value}%`}
      subtitle="Current"
      change={change}
      trend={trend}
      icon={<Users className="w-6 h-6 text-white" />}
      color="bg-gradient-to-br from-blue-500 to-indigo-600"
      onClick={onClick}
      loading={loading}
    />
  )
}

export function BookingsKpiCard({ 
  value, 
  change, 
  trend, 
  onClick,
  loading = false 
}: {
  value: number
  change: number
  trend: 'up' | 'down' | 'stable' | 'neutral'
  onClick?: () => void
  loading?: boolean
}) {
  return (
    <EnhancedKpiCard
      title="Active Bookings"
      value={value}
      subtitle="Today"
      change={change}
      trend={trend}
      icon={<Calendar className="w-6 h-6 text-white" />}
      color="bg-gradient-to-br from-purple-500 to-pink-600"
      onClick={onClick}
      loading={loading}
    />
  )
}

export function RatingKpiCard({ 
  value, 
  change, 
  trend, 
  onClick,
  loading = false 
}: {
  value: number
  change: number
  trend: 'up' | 'down' | 'stable' | 'neutral'
  onClick?: () => void
  loading?: boolean
}) {
  return (
    <EnhancedKpiCard
      title="Guest Rating"
      value={value.toFixed(1)}
      subtitle="Average"
      change={change}
      trend={trend}
      icon={<Star className="w-6 h-6 text-white" />}
      color="bg-gradient-to-br from-amber-500 to-orange-600"
      onClick={onClick}
      loading={loading}
    />
  )
}

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, ArrowUpRight, DollarSign, Users, Calendar, Star } from 'lucide-react'
import { TrendIndicator } from './trend-indicator'

interface EnhancedKpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  change: number
  trend: 'up' | 'down' | 'stable' | 'neutral'
  icon: React.ReactNode
  color: string
  onClick?: () => void
  loading?: boolean
  className?: string
}

export function EnhancedKpiCard({ 
  title, 
  value, 
  subtitle,
  change, 
  trend, 
  icon, 
  color, 
  onClick,
  loading = false,
  className = '' 
}: EnhancedKpiCardProps) {
  
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`
      }
      return val.toLocaleString()
    }
    return val
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded-full w-16"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-32 mb-3"></div>
          <div className="flex justify-between items-center">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-4"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      className={`group bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100 ${className}`}
      onClick={onClick}
    >
      {/* Header with Icon */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${color}`}>
            {icon}
          </div>
          <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
            {title}
          </h3>
        </div>
        
        <TrendIndicator trend={trend} change={change} />
      </div>
      
      {/* Main Value */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
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
      
      {/* Trend and Action */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">vs last month</span>
        <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
      </div>
      
      {/* Progress Bar */}
      <div className="mt-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(Math.abs(change) * 2, 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-2 rounded-full ${
              trend === 'up' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' :
              trend === 'down' ? 'bg-gradient-to-r from-red-500 to-red-600' :
              'bg-gradient-to-r from-gray-400 to-gray-500'
            }`}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {Math.min(Math.abs(change) * 2, 100).toFixed(0)}% of target
        </div>
      </div>
    </motion.div>
  )
}

// Predefined KPI Card Variants
export function RevenueKpiCard({ 
  value, 
  change, 
  trend, 
  onClick,
  loading = false 
}: {
  value: number
  change: number
  trend: 'up' | 'down' | 'stable' | 'neutral'
  onClick?: () => void
  loading?: boolean
}) {
  return (
    <EnhancedKpiCard
      title="Total Revenue"
      value={value}
      subtitle="This month"
      change={change}
      trend={trend}
      icon={<DollarSign className="w-6 h-6 text-white" />}
      color="bg-gradient-to-br from-emerald-500 to-teal-600"
      onClick={onClick}
      loading={loading}
    />
  )
}

export function OccupancyKpiCard({ 
  value, 
  change, 
  trend, 
  onClick,
  loading = false 
}: {
  value: number
  change: number
  trend: 'up' | 'down' | 'stable' | 'neutral'
  onClick?: () => void
  loading?: boolean
}) {
  return (
    <EnhancedKpiCard
      title="Occupancy Rate"
      value={`${value}%`}
      subtitle="Current"
      change={change}
      trend={trend}
      icon={<Users className="w-6 h-6 text-white" />}
      color="bg-gradient-to-br from-blue-500 to-indigo-600"
      onClick={onClick}
      loading={loading}
    />
  )
}

export function BookingsKpiCard({ 
  value, 
  change, 
  trend, 
  onClick,
  loading = false 
}: {
  value: number
  change: number
  trend: 'up' | 'down' | 'stable' | 'neutral'
  onClick?: () => void
  loading?: boolean
}) {
  return (
    <EnhancedKpiCard
      title="Active Bookings"
      value={value}
      subtitle="Today"
      change={change}
      trend={trend}
      icon={<Calendar className="w-6 h-6 text-white" />}
      color="bg-gradient-to-br from-purple-500 to-pink-600"
      onClick={onClick}
      loading={loading}
    />
  )
}

export function RatingKpiCard({ 
  value, 
  change, 
  trend, 
  onClick,
  loading = false 
}: {
  value: number
  change: number
  trend: 'up' | 'down' | 'stable' | 'neutral'
  onClick?: () => void
  loading?: boolean
}) {
  return (
    <EnhancedKpiCard
      title="Guest Rating"
      value={value.toFixed(1)}
      subtitle="Average"
      change={change}
      trend={trend}
      icon={<Star className="w-6 h-6 text-white" />}
      color="bg-gradient-to-br from-amber-500 to-orange-600"
      onClick={onClick}
      loading={loading}
    />
  )
}
