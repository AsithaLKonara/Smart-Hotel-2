"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, X, Bell, ShieldAlert, CreditCard, RefreshCw, Star, Zap, ChevronRight, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OperationalAlert {
 id: string
 type: 'CRITICAL' | 'WARNING' | 'INFO' | 'VIP'
 category: 'FINANCE' | 'SYSTEM' | 'GUEST' | 'MAINTENANCE'
 title: string
 message: string
 timestamp: string
 actionLabel?: string
}

const ALERTS: OperationalAlert[] = [
 {
 id: '1',
 type: 'CRITICAL',
 category: 'FINANCE',
 title: 'Payment Authorization Failed',
 message: 'Suite 402 - Transaction declined for $2,400. Immediate guest follow-up required.',
 timestamp: '2 mins ago',
 actionLabel: 'Contact Guest'
 },
 {
 id: '2',
 type: 'CRITICAL',
 category: 'SYSTEM',
 title: 'OTA Sync Interrupted',
 message: 'Booking.com API returned 503. Last successful sync: 45m ago. Inventory risk: HIGH.',
 timestamp: '5 mins ago',
 actionLabel: 'Retry Sync'
 },
 {
 id: '3',
 type: 'VIP',
 category: 'GUEST',
 title: 'VIP Arrival: Mr. Henderson',
 message: 'Platinum Loyalty Member arriving in 15 mins. Room 501 Inspection PENDING.',
 timestamp: '12 mins ago',
 actionLabel: 'Prioritize Room'
 },
 {
 id: '4',
 type: 'WARNING',
 category: 'MAINTENANCE',
 title: 'HVAC Malfunction Alert',
 message: 'Room 204: Temperature exceeds 26°C. Cooling failure detected.',
 timestamp: '18 mins ago',
 actionLabel: 'Dispatch Engineer'
 }
]

export function OperationalAlertCenter() {
 const [isOpen, setIsOpen] = useState(false)
 const [alerts, setAlerts] = useState(ALERTS)

 const removeAlert = (id: string) => {
 setAlerts(prev => prev.filter(a => a.id !== id))
 }

 const getAlertStyles = (type: string) => {
 switch (type) {
 case 'CRITICAL': return 'bg-rose-500/10 border-border text-rose-500'
 case 'WARNING': return 'bg-amber-500/10 border-border text-amber-500'
 case 'VIP': return 'bg-luxury-500/10 border-luxury-500/20 text-luxury-400'
 default: return 'bg-blue-500/10 border-blue-500/20 text-blue-400'
 }
 }

 const getCategoryIcon = (category: string) => {
 switch (category) {
 case 'FINANCE': return <CreditCard className="w-4 h-4" />
 case 'SYSTEM': return <RefreshCw className="w-4 h-4" />
 case 'GUEST': return <Star className="w-4 h-4" />
 case 'MAINTENANCE': return <Zap className="w-4 h-4" />
 default: return <Bell className="w-4 h-4" />
 }
 }

 return (
 <div className="relative z-50">
 <button 
 onClick={() => setIsOpen(!isOpen)}
 className={cn(
 "relative p-3 rounded-lg border transition-all duration-300 group",
 alerts.length > 0 
 ? "bg-rose-500/10 border-border text-rose-500 animate-pulse-soft" 
 : "bg-muted/50 border-border text-muted-foreground hover:text-white"
 )}
 >
 <ShieldAlert className="w-5 h-5" />
 {alerts.length > 0 && (
 <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs font-bold flex items-center justify-center rounded-full border-2 border-[#0c0c0c] shadow-lg">
 {alerts.length}
 </span>
 )}
 </button>

 <AnimatePresence>
 {isOpen && (
 <>
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={() => setIsOpen(false)}
 className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
 />
 <motion.div 
 initial={{ opacity: 0, y: 20, scale: 0.95 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: 20, scale: 0.95 }}
 className="absolute right-0 sm:right-0 mt-4 w-[calc(100vw-2rem)] sm:w-[400px] bg-card border border-border rounded-[32px] shadow-sm overflow-hidden z-50"
 >
 <div className="p-6 border-b border-border bg-muted/50 flex items-center justify-between">
 <div>
 <h3 className="text-lg font-serif font-bold text-white">Command Center</h3>
 <p className="text-muted-foreground text-xs font-bold">P0 Operational Alerts</p>
 </div>
 <button onClick={() => setIsOpen(false)} className="p-2 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-white">
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="max-h-[500px] overflow-y-auto p-4 space-y-3 custom-scrollbar">
 {alerts.length === 0 ? (
 <div className="py-20 text-center space-y-4">
 <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-border">
 <Bell className="w-8 h-8" />
 </div>
 <p className="text-muted-foreground text-sm font-medium">All clear. No active P0 alerts.</p>
 </div>
 ) : (
 alerts.map((alert) => (
 <motion.div 
 key={alert.id}
 layout
 className={cn("p-5 rounded-[24px] border relative group", getAlertStyles(alert.type))}
 >
 <div className="flex items-start gap-4">
 <div className="p-2.5 rounded-xl bg-muted/50 border border-border">
 {getCategoryIcon(alert.category)}
 </div>
 <div className="flex-1 space-y-1">
 <div className="flex items-center justify-between">
 <h4 className="text-xs font-bold tracking-wider">{alert.title}</h4>
 <span className="text-xs font-medium opacity-40">{alert.timestamp}</span>
 </div>
 <p className="text-xs font-medium text-white/70 leading-relaxed italic">
 {alert.message}
 </p>
 {alert.actionLabel && (
 <button className="mt-3 flex items-center gap-2 text-xs font-bold py-1.5 px-3 bg-muted/50 hover:bg-white/10 border border-border rounded-lg transition-all group/btn">
 {alert.actionLabel}
 <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
 </button>
 )}
 </div>
 </div>
 <button 
 onClick={(e) => { e.stopPropagation(); removeAlert(alert.id); }}
 className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-black/20 transition-all"
 >
 <X className="w-3 h-3" />
 </button>
 </motion.div>
 ))
 )}
 </div>

 {alerts.length > 0 && (
 <div className="p-4 bg-muted/50 border-t border-border">
 <button className="w-full py-3 text-xs font-bold tracking-[0.2em] text-muted-foreground hover:text-white transition-colors">
 View Full Incident Log
 </button>
 </div>
 )}
 </motion.div>
 </>
 )}
 </AnimatePresence>
 </div>
 )
}
