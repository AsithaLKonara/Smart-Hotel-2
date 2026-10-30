"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { Key, Smartphone, UtensilsCrossed, Clock, ChevronUp, ChevronDown, Sparkles, Fingerprint, Lock, ShieldCheck, CreditCard } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface GuestConciergeIslandProps {
  guestName: string
  roomNumber: string
  orderStatus?: string
  orderTimer?: number
  onUnlock: () => Promise<void>
  isUnlocking: boolean
  isSuccess: boolean
}

export function GuestConciergeIsland({
  guestName,
  roomNumber,
  orderStatus,
  orderTimer,
  onUnlock,
  isUnlocking,
  isSuccess
}: GuestConciergeIslandProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const formatMinSec = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const rem = secs % 60
    return `${mins}m ${rem < 10 ? '0' : ''}${rem}s`
  }

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-[380px] px-6">
      <motion.div
        layout
        className="bg-card/95 dark:bg-[#0c0c0c]/90 text-card-foreground backdrop-blur-3xl border border-border dark:border-white/10 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden"
      >
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-8 pt-10 pb-6"
            >
              {/* Virtual Keycard */}
              <div className={cn(
                "relative w-full h-[260px] rounded-[32px] p-8 flex flex-col justify-between border transition-all duration-700 overflow-hidden group",
                isSuccess ? 'bg-emerald-500/10 border-emerald-500/40 shadow-2xl shadow-emerald-500/20' : 'bg-muted/40 dark:bg-white/[0.03] border-border dark:border-white/10'
              )}>
                <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.03] dark:from-white/[0.05] to-transparent pointer-events-none" />
                
                <div className="flex items-start justify-between relative z-10">
                  <div>
                    <h4 className="font-serif font-bold text-lg text-foreground dark:text-white">SmartHotel OS</h4>
                    <span className="text-[9px] uppercase tracking-[0.2em] text-primary font-black">Digital Sanctuary Key</span>
                  </div>
                  <ShieldCheck className={cn("w-7 h-7 transition-all duration-500", isSuccess ? "text-emerald-500 scale-125" : "text-muted-foreground/30")} />
                </div>

                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] font-black">ACTIVE SUITE</span>
                    <h3 className="text-4xl font-serif font-bold text-foreground dark:text-white tracking-tighter">{roomNumber}</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mt-2">{guestName}</p>
                  </div>
                  <div className="w-16 h-16 rounded-full border border-border dark:border-white/10 flex items-center justify-center bg-background/50 dark:bg-white/5 backdrop-blur-md">
                     <Fingerprint className="w-8 h-8 text-muted-foreground/40" />
                  </div>
                </div>

                <Button
                  onClick={onUnlock}
                  disabled={isUnlocking}
                  className={cn(
                    "w-full h-16 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all relative z-10 shadow-lg",
                    isSuccess ? 'bg-emerald-500 text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  )}
                >
                  <AnimatePresence mode="wait">
                    {isUnlocking ? (
                      <motion.span key="unlocking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Authenticating...</motion.span>
                    ) : isSuccess ? (
                      <motion.span key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Suite Unlocked</motion.span>
                    ) : (
                      <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5" /> Tap to Unlock
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </div>

              {/* Enhanced Order Tracker */}
              {orderStatus && orderStatus !== 'DELIVERED' && (
                <div className="mt-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                        <UtensilsCrossed className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Your Order</span>
                        <span className="text-xs font-bold text-foreground dark:text-white">{orderStatus === 'PREPARING' ? 'Chef is preparing' : 'Butler in transit'}</span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-primary font-mono">{formatMinSec(orderTimer || 0)}</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted dark:bg-white/5 rounded-full overflow-hidden border border-border dark:border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: orderStatus === 'TRANSIT' ? '85%' : '45%' }}
                      className="h-full bg-primary shadow-sm"
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Island Handle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full h-20 px-8 flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-muted/60 dark:bg-white/5 border border-border dark:border-white/10 flex items-center justify-center relative">
              <Key className={cn("w-5 h-5 transition-colors duration-500", isSuccess ? "text-emerald-500" : "text-primary")} />
              {isSuccess && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-4 border-card animate-ping" />}
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground leading-none">Command Island</p>
              <h4 className="text-sm font-bold text-foreground dark:text-white mt-1.5 flex items-center gap-2">
                {isSuccess ? "Sanctuary Open" : "Digital Sanctuary Key"}
                <Sparkles className="w-3 h-3 text-primary/60" />
              </h4>
            </div>
          </div>
          
          <div className="flex items-center gap-5">
            {orderStatus && orderStatus !== 'DELIVERED' && !isExpanded && (
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-black text-primary font-mono">{formatMinSec(orderTimer || 0)}</span>
              </div>
            )}
            <div className="w-10 h-10 rounded-full bg-muted/50 dark:bg-white/5 flex items-center justify-center group-hover:bg-muted dark:group-hover:bg-white/10 transition-all">
              {isExpanded ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronUp className="w-5 h-5 text-muted-foreground" />}
            </div>
          </div>
        </button>
      </motion.div>
    </div>
  )
}
