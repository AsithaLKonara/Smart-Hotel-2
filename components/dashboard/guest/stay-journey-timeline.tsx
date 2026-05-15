"use client"

import { CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface StayStep {
  label: string
  desc: string
  date: string
}

const defaultSteps: StayStep[] = [
  { label: 'Arrival', desc: 'Welcome to Grand Palace', date: 'Today' },
  { label: 'Check-in', desc: 'Elite Suite assigned', date: 'Active' },
  { label: 'Experience', desc: 'Enjoy our amenities', date: 'Ongoing' },
  { label: 'Departure', desc: 'Final farewell', date: 'Scheduled' }
]

interface StayJourneyTimelineProps {
  steps?: StayStep[]
  activeStep?: number
}

export function StayJourneyTimeline({ 
  steps = defaultSteps, 
  activeStep = 1 
}: StayJourneyTimelineProps) {
  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl mb-10 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <CardContent className="p-8 lg:p-10">
        <h3 className="text-[10px] uppercase tracking-[0.3em] font-black text-white/30 mb-10 text-center lg:text-left">Your Experience Journey</h3>

        <div className="relative flex flex-col lg:flex-row justify-between gap-10">
          {/* Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-6 left-12 right-12 h-[1px] bg-white/5 -z-0" />
          
          {steps.map((step, idx) => {
            const isActive = idx === activeStep
            const isPassed = idx < activeStep
            const isFuture = idx > activeStep

            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="relative z-10 flex flex-row lg:flex-col items-start lg:items-center text-left lg:text-center gap-5 lg:gap-4 flex-1 group"
              >
                {/* Node */}
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 shadow-lg",
                  isActive ? "bg-primary/20 border-primary shadow-primary/20 animate-pulse scale-110" : 
                  isPassed ? "bg-emerald-500/10 border-emerald-500 shadow-emerald-500/10" : 
                  "bg-white/5 border-white/10 opacity-40 group-hover:opacity-60"
                )}>
                  {isPassed ? (
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <span className={cn("text-sm font-black font-mono", isActive ? "text-primary" : "text-white/40")}>
                      0{idx + 1}
                    </span>
                  )}
                </div>

                <div className="flex-1">
                  <Badge variant="outline" className={cn(
                    "mb-2 border-none px-0 text-[10px] font-black uppercase tracking-widest",
                    isActive ? "text-primary" : isPassed ? "text-emerald-400" : "text-white/20"
                  )}>
                    {step.label}
                  </Badge>
                  <h4 className={cn(
                    "text-sm font-bold tracking-tight mb-1 transition-colors",
                    isActive ? "text-white" : "text-white/40"
                  )}>
                    {step.desc}
                  </h4>
                  <p className="text-[10px] font-mono text-white/20 uppercase tracking-tighter">
                    {step.date}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
