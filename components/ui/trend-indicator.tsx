"use client"

import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface TrendIndicatorProps {
  trend: 'up' | 'down' | 'stable' | 'neutral'
  change: number
  label?: string
  size?: 'sm' | 'md' | 'lg'
  showArrow?: boolean
  className?: string
}

const trendConfig = {
  up: { 
    icon: TrendingUp, 
    color: 'text-emerald-600', 
    bg: 'bg-emerald-100',
    border: 'border-emerald-200',
    arrow: ArrowUpRight
  },
  down: { 
    icon: TrendingDown, 
    color: 'text-red-600', 
    bg: 'bg-red-100',
    border: 'border-red-200',
    arrow: ArrowDownRight
  },
  stable: { 
    icon: Minus, 
    color: 'text-gray-600', 
    bg: 'bg-gray-100',
    border: 'border-gray-200',
    arrow: Minus
  },
  neutral: { 
    icon: Minus, 
    color: 'text-blue-600', 
    bg: 'bg-blue-100',
    border: 'border-blue-200',
    arrow: Minus
  },
}

const sizeClasses = {
  sm: {
    container: 'px-2 py-1',
    icon: 'w-3 h-3',
    text: 'text-xs',
    arrow: 'w-3 h-3'
  },
  md: {
    container: 'px-2 py-1',
    icon: 'w-3 h-3',
    text: 'text-xs',
    arrow: 'w-4 h-4'
  },
  lg: {
    container: 'px-3 py-1.5',
    icon: 'w-4 h-4',
    text: 'text-sm',
    arrow: 'w-4 h-4'
  },
}

export function TrendIndicator({ 
  trend, 
  change, 
  label, 
  size = 'md', 
  showArrow = false,
  className = '' 
}: TrendIndicatorProps) {
  const config = trendConfig[trend]
  const { icon: Icon, color, bg, arrow: ArrowIcon } = config
  const { container, icon, text, arrow } = sizeClasses[size]
  
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className={`flex items-center gap-1 ${container} rounded-full ${bg} ${color}`}>
        <Icon className={icon} />
        <span className={`font-medium ${text}`}>
          {Math.abs(change)}%
        </span>
      </div>
      {showArrow && (
        <ArrowIcon className={`${arrow} ${color} opacity-60`} />
      )}
      {label && (
        <span className={`text-gray-500 ${text}`}>
          {label}
        </span>
      )}
    </div>
  )
}

export function TrendBadge({ 
  trend, 
  change, 
  className = '' 
}: {
  trend: 'up' | 'down' | 'stable' | 'neutral'
  change: number
  className?: string
}) {
  const config = trendConfig[trend]
  const { icon: Icon, color, bg } = config
  
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${bg} ${color} ${className}`}>
      <Icon className="w-3 h-3" />
      <span className="text-xs font-medium">
        {change >= 0 ? '+' : ''}{change.toFixed(1)}%
      </span>
    </div>
  )
}

export function TrendChart({ 
  data, 
  className = '' 
}: {
  data: number[]
  className?: string
}) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min
  
  return (
    <div className={`flex items-end gap-1 h-8 ${className}`}>
      {data.map((value, index) => {
        const height = range > 0 ? ((value - min) / range) * 100 : 50
        const isIncreasing = index > 0 && value > data[index - 1]
        
        return (
          <div
            key={index}
            className={`w-1 rounded-t ${
              isIncreasing 
                ? 'bg-emerald-500' 
                : index > 0 && value < data[index - 1] 
                  ? 'bg-red-500' 
                  : 'bg-gray-400'
            } transition-all duration-300`}
            style={{ height: `${height}%` }}
          />
        )
      })}
    </div>
  )
}

import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface TrendIndicatorProps {
  trend: 'up' | 'down' | 'stable' | 'neutral'
  change: number
  label?: string
  size?: 'sm' | 'md' | 'lg'
  showArrow?: boolean
  className?: string
}

const trendConfig = {
  up: { 
    icon: TrendingUp, 
    color: 'text-emerald-600', 
    bg: 'bg-emerald-100',
    border: 'border-emerald-200',
    arrow: ArrowUpRight
  },
  down: { 
    icon: TrendingDown, 
    color: 'text-red-600', 
    bg: 'bg-red-100',
    border: 'border-red-200',
    arrow: ArrowDownRight
  },
  stable: { 
    icon: Minus, 
    color: 'text-gray-600', 
    bg: 'bg-gray-100',
    border: 'border-gray-200',
    arrow: Minus
  },
  neutral: { 
    icon: Minus, 
    color: 'text-blue-600', 
    bg: 'bg-blue-100',
    border: 'border-blue-200',
    arrow: Minus
  },
}

const sizeClasses = {
  sm: {
    container: 'px-2 py-1',
    icon: 'w-3 h-3',
    text: 'text-xs',
    arrow: 'w-3 h-3'
  },
  md: {
    container: 'px-2 py-1',
    icon: 'w-3 h-3',
    text: 'text-xs',
    arrow: 'w-4 h-4'
  },
  lg: {
    container: 'px-3 py-1.5',
    icon: 'w-4 h-4',
    text: 'text-sm',
    arrow: 'w-4 h-4'
  },
}

export function TrendIndicator({ 
  trend, 
  change, 
  label, 
  size = 'md', 
  showArrow = false,
  className = '' 
}: TrendIndicatorProps) {
  const config = trendConfig[trend]
  const { icon: Icon, color, bg, arrow: ArrowIcon } = config
  const { container, icon, text, arrow } = sizeClasses[size]
  
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className={`flex items-center gap-1 ${container} rounded-full ${bg} ${color}`}>
        <Icon className={icon} />
        <span className={`font-medium ${text}`}>
          {Math.abs(change)}%
        </span>
      </div>
      {showArrow && (
        <ArrowIcon className={`${arrow} ${color} opacity-60`} />
      )}
      {label && (
        <span className={`text-gray-500 ${text}`}>
          {label}
        </span>
      )}
    </div>
  )
}

export function TrendBadge({ 
  trend, 
  change, 
  className = '' 
}: {
  trend: 'up' | 'down' | 'stable' | 'neutral'
  change: number
  className?: string
}) {
  const config = trendConfig[trend]
  const { icon: Icon, color, bg } = config
  
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${bg} ${color} ${className}`}>
      <Icon className="w-3 h-3" />
      <span className="text-xs font-medium">
        {change >= 0 ? '+' : ''}{change.toFixed(1)}%
      </span>
    </div>
  )
}

export function TrendChart({ 
  data, 
  className = '' 
}: {
  data: number[]
  className?: string
}) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min
  
  return (
    <div className={`flex items-end gap-1 h-8 ${className}`}>
      {data.map((value, index) => {
        const height = range > 0 ? ((value - min) / range) * 100 : 50
        const isIncreasing = index > 0 && value > data[index - 1]
        
        return (
          <div
            key={index}
            className={`w-1 rounded-t ${
              isIncreasing 
                ? 'bg-emerald-500' 
                : index > 0 && value < data[index - 1] 
                  ? 'bg-red-500' 
                  : 'bg-gray-400'
            } transition-all duration-300`}
            style={{ height: `${height}%` }}
          />
        )
      })}
    </div>
  )
}

import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface TrendIndicatorProps {
  trend: 'up' | 'down' | 'stable' | 'neutral'
  change: number
  label?: string
  size?: 'sm' | 'md' | 'lg'
  showArrow?: boolean
  className?: string
}

const trendConfig = {
  up: { 
    icon: TrendingUp, 
    color: 'text-emerald-600', 
    bg: 'bg-emerald-100',
    border: 'border-emerald-200',
    arrow: ArrowUpRight
  },
  down: { 
    icon: TrendingDown, 
    color: 'text-red-600', 
    bg: 'bg-red-100',
    border: 'border-red-200',
    arrow: ArrowDownRight
  },
  stable: { 
    icon: Minus, 
    color: 'text-gray-600', 
    bg: 'bg-gray-100',
    border: 'border-gray-200',
    arrow: Minus
  },
  neutral: { 
    icon: Minus, 
    color: 'text-blue-600', 
    bg: 'bg-blue-100',
    border: 'border-blue-200',
    arrow: Minus
  },
}

const sizeClasses = {
  sm: {
    container: 'px-2 py-1',
    icon: 'w-3 h-3',
    text: 'text-xs',
    arrow: 'w-3 h-3'
  },
  md: {
    container: 'px-2 py-1',
    icon: 'w-3 h-3',
    text: 'text-xs',
    arrow: 'w-4 h-4'
  },
  lg: {
    container: 'px-3 py-1.5',
    icon: 'w-4 h-4',
    text: 'text-sm',
    arrow: 'w-4 h-4'
  },
}

export function TrendIndicator({ 
  trend, 
  change, 
  label, 
  size = 'md', 
  showArrow = false,
  className = '' 
}: TrendIndicatorProps) {
  const config = trendConfig[trend]
  const { icon: Icon, color, bg, arrow: ArrowIcon } = config
  const { container, icon, text, arrow } = sizeClasses[size]
  
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className={`flex items-center gap-1 ${container} rounded-full ${bg} ${color}`}>
        <Icon className={icon} />
        <span className={`font-medium ${text}`}>
          {Math.abs(change)}%
        </span>
      </div>
      {showArrow && (
        <ArrowIcon className={`${arrow} ${color} opacity-60`} />
      )}
      {label && (
        <span className={`text-gray-500 ${text}`}>
          {label}
        </span>
      )}
    </div>
  )
}

export function TrendBadge({ 
  trend, 
  change, 
  className = '' 
}: {
  trend: 'up' | 'down' | 'stable' | 'neutral'
  change: number
  className?: string
}) {
  const config = trendConfig[trend]
  const { icon: Icon, color, bg } = config
  
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${bg} ${color} ${className}`}>
      <Icon className="w-3 h-3" />
      <span className="text-xs font-medium">
        {change >= 0 ? '+' : ''}{change.toFixed(1)}%
      </span>
    </div>
  )
}

export function TrendChart({ 
  data, 
  className = '' 
}: {
  data: number[]
  className?: string
}) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min
  
  return (
    <div className={`flex items-end gap-1 h-8 ${className}`}>
      {data.map((value, index) => {
        const height = range > 0 ? ((value - min) / range) * 100 : 50
        const isIncreasing = index > 0 && value > data[index - 1]
        
        return (
          <div
            key={index}
            className={`w-1 rounded-t ${
              isIncreasing 
                ? 'bg-emerald-500' 
                : index > 0 && value < data[index - 1] 
                  ? 'bg-red-500' 
                  : 'bg-gray-400'
            } transition-all duration-300`}
            style={{ height: `${height}%` }}
          />
        )
      })}
    </div>
  )
}
