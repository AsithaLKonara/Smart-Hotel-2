"use client"

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface TrendIndicatorProps {
  trend: 'up' | 'down' | 'stable' | 'neutral'
  change: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function TrendIndicator({ 
  trend, 
  change, 
  size = 'md',
  className = '' 
}: TrendIndicatorProps) {
  
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4" />
      case 'down':
        return <TrendingDown className="w-4 h-4" />
      case 'stable':
      case 'neutral':
      default:
        return <Minus className="w-4 h-4" />
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-emerald-600 bg-emerald-50'
      case 'down':
        return 'text-red-600 bg-red-50'
      case 'stable':
        return 'text-blue-600 bg-blue-50'
      case 'neutral':
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'px-2 py-1',
          text: 'text-xs',
          icon: 'w-3 h-3'
        }
      case 'lg':
        return {
          container: 'px-3 py-2',
          text: 'text-sm',
          icon: 'w-5 h-5'
        }
      case 'md':
      default:
        return {
          container: 'px-2 py-1',
          text: 'text-xs',
          icon: 'w-4 h-4'
        }
    }
  }

  const formatChange = (value: number) => {
    const absValue = Math.abs(value)
    if (absValue >= 1000000) {
      return `${(absValue / 1000000).toFixed(1)}M`
    } else if (absValue >= 1000) {
      return `${(absValue / 1000).toFixed(1)}K`
    }
    return absValue.toFixed(1)
  }

  const sizeClasses = getSizeClasses()

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1 rounded-full ${sizeClasses.container} ${getTrendColor()} ${className}`}
    >
      <motion.div
        initial={{ rotate: -10 }}
        animate={{ rotate: 0 }}
        transition={{ duration: 0.3 }}
      >
        {getTrendIcon()}
      </motion.div>
      <span className={`font-medium ${sizeClasses.text}`}>
        {formatChange(change)}%
      </span>
    </motion.div>
  )
}