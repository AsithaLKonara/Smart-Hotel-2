"use client"

import { motion } from 'framer-motion'
import { Target, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OccupancyPacingGaugeProps {
  current: number
  target: number
  forecast: number
  className?: string
}

export function OccupancyPacingGauge({ current, target, forecast, className }: OccupancyPacingGaugeProps) {
  const progress = (current / target) * 100
  const forecastProgress = (forecast / target) * 100
  
  const isAhead = forecast >= target

  return (
    <div className={cn("p-6 space-y-8", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white/40 uppercase tracking-[0.2em]">Occupancy Pacing</h3>
            <p className="text-[10px] text-white/20 font-medium">MTD Performance vs Target</p>
          </div>
        </div>
        
        <div className={cn(
          "px-3 py-1 rounded-full border flex items-center gap-2",
          isAhead ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"
        )}>
          {isAhead ? <TrendingUp className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
          <span className="text-[10px] font-black uppercase tracking-wider">
            {isAhead ? 'Ahead of Budget' : 'Below Budget'}
          </span>
        </div>
      </div>

      <div className="relative pt-4">
        {/* Progress Bar Container */}
        <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 relative shadow-inner-light">
          {/* Target Marker */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-white/40 z-20 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
            style={{ left: '100%' }}
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-black text-white/40 uppercase">Budget</div>
          </div>

          {/* Current Progress */}
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="absolute inset-y-0 left-0 bg-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)] z-10"
          />

          {/* Forecast Progress (Ghost bar) */}
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(forecastProgress, 100)}%` }}
            transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
            className="absolute inset-y-0 left-0 bg-white/10 border-r border-white/20"
          />
        </div>

        <div className="mt-4 flex justify-between items-end">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Actual MTD</p>
            <div className="text-3xl font-serif font-bold text-white">{current}%</div>
          </div>
          
          <div className="text-right space-y-1">
            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">STLY Forecast</p>
            <div className="text-xl font-serif font-bold text-white/60">{forecast}%</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
          <div className="flex items-center gap-2 text-[9px] font-black text-white/40 uppercase tracking-wider">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Confidence
          </div>
          <div className="text-sm font-serif font-bold text-white">94.2%</div>
        </div>
        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
          <div className="flex items-center gap-2 text-[9px] font-black text-white/40 uppercase tracking-wider">
            <TrendingUp className="w-3 h-3 text-primary" /> Velocity
          </div>
          <div className="text-sm font-serif font-bold text-white">+2.4% / Day</div>
        </div>
      </div>
    </div>
  )
}
