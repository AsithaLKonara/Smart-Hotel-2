"use client"

import { motion, AnimatePresence } from "framer-motion"
import { TrendingUp, TrendingDown, Minus, AlertCircle, Sparkles, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card'

const DynamicSparkline = dynamic(() => import('./sparkline-chart'), { ssr: false });

interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  delta?: number
  deltaLabel?: string
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral' | React.ReactNode
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'luxury'
  className?: string
  onClick?: () => void
  sparklineData?: Array<{ value: number }>
  isAnomaly?: boolean
  aiInsight?: string
  comparativeValue?: string
  actionLabel?: string
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
  onClick,
  sparklineData,
  isAnomaly,
  aiInsight,
  comparativeValue,
  actionLabel
}: KpiCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      return new Intl.NumberFormat('en-US').format(val)
    }
    return val
  }

  const getTrendIcon = () => {
    if (delta === undefined) return null
    if (delta > 0) return <TrendingUp className="w-3 h-3" />
    if (delta < 0) return <TrendingDown className="w-3 h-3" />
    return <Minus className="w-3 h-3" />
  }

  const getTrendColor = () => {
    if (delta === undefined) return 'text-white/50'
    if (delta > 0) return 'text-emerald-400'
    if (delta < 0) return 'text-rose-400'
    return 'text-white/50'
  }

  const getThemeColors = () => {
    switch (color) {
      case 'success': return { text: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' }
      case 'warning': return { text: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' }
      case 'error': return { text: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20' }
      case 'info': return { text: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' }
      case 'luxury': return { text: 'text-luxury-400', bg: 'bg-luxury-400/10', border: 'border-luxury-400/20' }
      default: return { text: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' }
    }
  }

  const theme = getThemeColors()
  const gradientId = `gradient-${title.replace(/\s+/g, '-')}`

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <Card 
      className={cn(
        "relative overflow-hidden group transition-all duration-300",
        isAnomaly && "border-rose-500/50 ring-1 ring-rose-500/20",
        onClick && "cursor-pointer hover:border-white/20 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={handleKeyDown}
      aria-label={`${title}: ${value} ${subtitle || ''}`}
    >
      {/* Anomaly Pulse */}
      {isAnomaly && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent animate-pulse" />
      )}

      {/* Sparkline Overlay */}
      {sparklineData && sparklineData.length > 0 && (
        <div className="absolute inset-x-0 bottom-0 h-16 opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity">
          <DynamicSparkline data={sparklineData} themeText={theme.text} gradientId={gradientId} />
        </div>
      )}

      <div className="relative z-10 p-5 flex flex-col h-full min-h-[160px]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            {icon && (
              <div className={cn("p-2 rounded-lg border", theme.bg, theme.border, theme.text)}>
                {icon}
              </div>
            )}
            <h3 className="text-[10px] font-black text-white/70 uppercase tracking-[0.15em]">
              {title}
            </h3>
          </div>
          
          {isAnomaly ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 animate-pulse">
              <AlertCircle className="w-3 h-3" />
              <span className="text-[9px] font-black uppercase">Anomaly</span>
            </div>
          ) : delta !== undefined && (
            <div className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/5 border border-white/5", getTrendColor())}>
              {getTrendIcon()}
              <span className="text-[10px] font-bold">
                {Math.abs(delta)}%
              </span>
            </div>
          )}
        </div>

        <div className="mt-auto">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-white tracking-tight leading-none">
              {formatValue(value)}
            </span>
            {comparativeValue && (
              <span className="text-[10px] text-white/50 font-medium">
                / {comparativeValue}
              </span>
            )}
          </div>
          
          <div className="mt-3 flex flex-col gap-1.5">
            {aiInsight ? (
              <div className="flex items-start gap-1.5 p-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <Sparkles className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                <p className="text-[10px] text-emerald-400/80 leading-tight font-medium italic">
                  "{aiInsight}"
                </p>
              </div>
            ) : (subtitle || deltaLabel) && (
              <div className="text-[10px] text-white/60 uppercase tracking-widest font-black">
                {subtitle || deltaLabel}
              </div>
            )}
          </div>
        </div>

        {actionLabel && (
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between group/action">
            <span className="text-[9px] font-black text-white/70 uppercase tracking-wider">{actionLabel}</span>
            <ArrowRight className="w-3 h-3 text-white/50 group-hover/action:text-primary transition-colors group-hover/action:translate-x-1 duration-300" />
          </div>
        )}
      </div>
    </Card>
  )
}
