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
 className="bg-card/90 backdrop-blur-3xl border border-border rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden shadow-inner-light"
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
 isSuccess ? 'bg-emerald-500/10 border-border shadow-sm shadow-emerald-500/20' : 'bg-white/[0.03] border-border'
 )}>
 <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none" />
 
 <div className="flex items-start justify-between relative z-10">
 <div>
 <h4 className="font-serif font-bold text-lg text-white">SmartHotel OS</h4>
 <span className="text-xs tracking-[0.2em] text-luxury-500 font-bold">Digital Sanctuary Key</span>
 </div>
 <ShieldCheck className={cn("w-7 h-7 transition-all duration-500", isSuccess ? "text-emerald-400 scale-125" : "text-muted-foreground")} />
 </div>

 <div className="relative z-10 flex items-center justify-between">
 <div>
 <span className="text-xs text-muted-foreground tracking-[0.2em] font-bold">ACTIVE SUITE</span>
 <h3 className="text-4xl font-serif font-bold text-white ">{roomNumber}</h3>
 <p className="text-xs text-white/50 font-bold mt-2">{guestName}</p>
 </div>
 <div className="w-16 h-16 rounded-full border border-border flex items-center justify-center bg-muted/50 backdrop-blur-md">
 <Fingerprint className="w-8 h-8 text-muted-foreground" />
 </div>
 </div>

 <Button
 onClick={onUnlock}
 disabled={isUnlocking}
 className={cn(
 "w-full h-16 rounded-lg text-xs font-bold tracking-[0.2em] transition-all relative z-10 shadow-sm",
 isSuccess ? 'bg-emerald-500 text-white' : 'bg-luxury-500 text-white hover:bg-luxury-600'
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
 <div className="p-2 rounded-xl bg-luxury-500/10 text-luxury-500 border border-luxury-500/20">
 <UtensilsCrossed className="w-4 h-4" />
 </div>
 <div>
 <span className="text-xs font-bold text-muted-foreground block">Your Order</span>
 <span className="text-xs font-bold text-white">{orderStatus === 'PREPARING' ? 'Chef is preparing' : 'Butler in transit'}</span>
 </div>
 </div>
 <span className="text-xs font-bold text-luxury-400 font-mono">{formatMinSec(orderTimer || 0)}</span>
 </div>
 <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden border border-border">
 <motion.div 
 initial={{ width: 0 }}
 animate={{ width: orderStatus === 'TRANSIT' ? '85%' : '45%' }}
 className="h-full bg-luxury-500 shadow-[0_0_15px_rgba(var(--luxury-rgb),0.5)]"
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
 <div className="w-12 h-12 rounded-full bg-muted/50 border border-border flex items-center justify-center relative">
 <Key className={cn("w-5 h-5 transition-colors duration-500", isSuccess ? "text-emerald-400" : "text-luxury-500")} />
 {isSuccess && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-4 border-[#0c0c0c] animate-ping" />}
 </div>
 <div className="text-left">
 <p className="text-xs font-bold tracking-[0.2em] text-muted-foreground leading-none">Command Island</p>
 <h4 className="text-sm font-bold text-white mt-1.5 flex items-center gap-2">
 {isSuccess ? "Sanctuary Open" : "Digital Sanctuary Key"}
 <Sparkles className="w-3 h-3 text-luxury-500/40" />
 </h4>
 </div>
 </div>
 
 <div className="flex items-center gap-5">
 {orderStatus && orderStatus !== 'DELIVERED' && !isExpanded && (
 <div className="flex items-center gap-2 px-4 py-2 bg-luxury-500/10 rounded-full border border-luxury-500/20">
 <div className="w-1.5 h-1.5 rounded-full bg-luxury-500 animate-pulse" />
 <span className="text-xs font-bold text-luxury-500 font-mono">{formatMinSec(orderTimer || 0)}</span>
 </div>
 )}
 <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-white/10 transition-all">
 {isExpanded ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronUp className="w-5 h-5 text-muted-foreground" />}
 </div>
 </div>
 </button>
 </motion.div>
 </div>
 )
}
