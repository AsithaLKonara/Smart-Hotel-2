"use client"

import { TrendingUp, TrendingDown, Minus, AlertCircle, Sparkles, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import dynamic from 'next/dynamic'

const DynamicSparkline = dynamic(() => import('./sparkline-chart'), { ssr: false })

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
  footnote?: string
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
  actionLabel,
  footnote
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

  const getPillStyles = () => {
    if (isAnomaly) {
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
    }
    if (delta === undefined) {
      return 'bg-[#181A1D] text-zinc-400 border-[#2B3037]'
    }
    if (delta > 0) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    }
    if (delta < 0) {
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
    }
    return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onClick()
    }
  }

  const gradientId = `gradient-${title.replace(/\s+/g, '-')}`

  return (
    <div
      className={cn(
        "p-5 rounded-2xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between hover:border-zinc-700 transition-colors group relative overflow-hidden",
        onClick && "cursor-pointer active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={handleKeyDown}
      aria-label={`${title}: ${value} ${subtitle || ''}`}
    >
      {/* Top Border Accent when Anomaly */}
      {isAnomaly && (
        <div className="absolute top-0 left-0 w-full h-[2px] bg-rose-500 animate-pulse" />
      )}

      {/* Sparkline Overlay */}
      {sparklineData && sparklineData.length > 0 && (
        <div className="absolute inset-x-0 bottom-0 h-14 opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity">
          <DynamicSparkline data={sparklineData} themeText="text-blue-400" gradientId={gradientId} />
        </div>
      )}

      <div>
        {/* Header Row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            {icon && (
              <div className="p-1.5 rounded-lg bg-[#181A1D] border border-[#2B3037] text-zinc-300">
                {icon}
              </div>
            )}
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              {title}
            </span>
          </div>

          {isAnomaly ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border font-mono bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse">
              <AlertCircle className="w-3 h-3" />
              <span>Anomaly</span>
            </span>
          ) : delta !== undefined ? (
            <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border font-mono", getPillStyles())}>
              {getTrendIcon()}
              <span>{delta > 0 ? `+${delta}%` : `${delta}%`}</span>
            </span>
          ) : null}
        </div>

        {/* Primary Metric Value */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight leading-none">
            {formatValue(value)}
          </span>
          {comparativeValue && (
            <span className="text-xs text-zinc-500 font-mono font-medium">
              / {comparativeValue}
            </span>
          )}
        </div>

        {/* Sub-caption */}
        {subtitle && (
          <p className="text-xs text-zinc-300 font-medium mt-1.5">
            {subtitle}
          </p>
        )}

        {aiInsight && (
          <div className="mt-2.5 flex items-start gap-1.5 p-2 rounded-lg bg-[#141619] border border-[#1E2227]">
            <Sparkles className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-zinc-300 leading-tight font-mono">
              {aiInsight}
            </p>
          </div>
        )}
      </div>

      {/* Footnote or Action Divider */}
      {(footnote || actionLabel || deltaLabel) && (
        <div className="pt-2 mt-4 border-t border-[#1C2025] flex items-center justify-between text-[11px] text-zinc-500 font-mono">
          <span>{footnote || deltaLabel}</span>
          {actionLabel && (
            <span className="flex items-center gap-1 text-zinc-400 group-hover:text-white transition-colors">
              {actionLabel} <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          )}
        </div>
      )}
    </div>
  )
}
