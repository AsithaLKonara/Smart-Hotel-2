"use client"

import { Clock, DollarSign, Sparkles, CheckCircle2, LogOut, DoorOpen, User, ArrowRight, Wallet, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

import { NoResultsEmptyState } from '@/components/ui/premium-empty-state'

interface OperationalGuest {
 id: string
 guestName: string
 roomNumber: string
 roomType: string
 time: string
 vip?: boolean
 payment: string
 notes?: string
 isLate?: boolean
 isPending?: boolean
 balance?: number
}

interface ArrivalsDeparturesGridProps {
 arrivals: OperationalGuest[]
 departures: OperationalGuest[]
 onCheckIn: (roomNumber: string) => void
 onCheckOut: (roomNumber: string) => void
}

export function ArrivalsDeparturesGrid({
 arrivals,
 departures,
 onCheckIn,
 onCheckOut
}: ArrivalsDeparturesGridProps) {
 return (
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 {/* Arrivals Queue */}
 <div className="space-y-6">
 <div className="flex items-end justify-between px-2">
 <div className="flex items-center gap-4">
 <div className="p-3 rounded-lg bg-emerald-500/10 border border-border text-emerald-500">
 <Clock className="w-6 h-6" />
 </div>
 <div>
 <h3 className="text-2xl font-serif font-bold text-white tracking-tight">Arrivals Timeline</h3>
 <p className="text-muted-foreground text-xs font-medium mt-1">Expected check-ins for current shift</p>
 </div>
 </div>
 <Badge className="bg-emerald-500/10 text-emerald-400 border-none px-4 py-1.5 font-bold text-xs">
 {arrivals.length} EXPECTED
 </Badge>
 </div>

 <Card className="bg-transparent border-none shadow-none">
 <CardContent className="p-0 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
 <AnimatePresence mode="popLayout">
 {arrivals.length === 0 ? (
 <NoResultsEmptyState />
 ) : (
 arrivals.map((arr, idx) => (
 <motion.div
 key={arr.id}
 layout
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95 }}
 transition={{ delay: idx * 0.03 }}
 className="group relative p-6 bg-card border border-border hover:border-border rounded-[32px] transition-all"
 >
 <div className="flex items-start justify-between gap-6">
 <div className="flex-1 space-y-4">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-muted/50 border border-border flex items-center justify-center text-muted-foreground font-bold text-xs ">
 {arr.guestName.split(' ').map(n => n[0]).join('')}
 </div>
 <div>
 <h4 className="font-bold text-white text-lg tracking-tight flex items-center gap-2">
 {arr.guestName}
 {arr.vip && <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />}
 </h4>
 <p className="text-muted-foreground text-xs font-bold ">
 Room {arr.roomNumber} • {arr.roomType}
 </p>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="p-3 rounded-lg bg-muted/50 border border-border">
 <span className="text-xs font-bold text-muted-foreground block mb-1">Check-in</span>
 <span className={cn("text-xs font-bold", arr.isLate ? "text-rose-400" : "text-white/60")}>
 {arr.time} {arr.isLate && " (LATE)"}
 </span>
 </div>
 <div className="p-3 rounded-lg bg-muted/50 border border-border">
 <span className="text-xs font-bold text-muted-foreground block mb-1">Status</span>
 <span className="text-xs font-bold text-emerald-400">Paid: {arr.payment}</span>
 </div>
 </div>

 {arr.notes && (
 <p className="text-[11px] text-muted-foreground italic leading-relaxed px-1">"{arr.notes}"</p>
 )}
 </div>

 <div className="flex flex-col gap-2">
 <button 
 onClick={() => onCheckIn(arr.roomNumber)}
 className="w-12 h-12 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20 transition-all active:scale-95 group-hover:w-32 group-hover:gap-2 transition-all duration-300"
 >
 <CheckCircle2 className="w-5 h-5 shrink-0" />
 <span className="hidden group-hover:block text-xs font-bold whitespace-nowrap">Check-In</span>
 </button>
 <button className="w-12 h-12 rounded-lg bg-muted/50 hover:bg-white/10 text-muted-foreground flex items-center justify-center transition-all">
 <ArrowRight className="w-5 h-5" />
 </button>
 </div>
 </div>
 </motion.div>
 ))
 )}
 </AnimatePresence>
 </CardContent>
 </Card>
 </div>

 {/* Departures Queue */}
 <div className="space-y-6">
 <div className="flex items-end justify-between px-2">
 <div className="flex items-center gap-4">
 <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary">
 <DoorOpen className="w-6 h-6" />
 </div>
 <div>
 <h3 className="text-2xl font-serif font-bold text-white tracking-tight">Departures List</h3>
 <p className="text-muted-foreground text-xs font-medium mt-1">Pending check-outs and room releases</p>
 </div>
 </div>
 <Badge className="bg-primary/10 text-primary border-none px-4 py-1.5 font-bold text-xs">
 {departures.length} PENDING
 </Badge>
 </div>

 <Card className="bg-transparent border-none shadow-none">
 <CardContent className="p-0 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
 <AnimatePresence mode="popLayout">
 {departures.length === 0 ? (
 <NoResultsEmptyState />
 ) : (
 departures.map((dep, idx) => {
 const hasBalance = dep.balance && dep.balance > 0
 return (
 <motion.div
 key={dep.id}
 layout
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95 }}
 transition={{ delay: idx * 0.03 }}
 className={cn(
 "group relative p-6 bg-card border rounded-[32px] transition-all",
 hasBalance ? "border-border hover:border-border" : "border-border hover:border-primary/40"
 )}
 >
 <div className="flex items-start justify-between gap-6">
 <div className="flex-1 space-y-4">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-muted/50 border border-border flex items-center justify-center text-muted-foreground font-bold text-xs ">
 {dep.guestName.split(' ').map(n => n[0]).join('')}
 </div>
 <div>
 <h4 className="font-bold text-white text-lg tracking-tight">{dep.guestName}</h4>
 <p className="text-muted-foreground text-xs font-bold ">
 Room {dep.roomNumber} • {dep.roomType}
 </p>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="p-3 rounded-lg bg-muted/50 border border-border">
 <span className="text-xs font-bold text-muted-foreground block mb-1">Check-out</span>
 <span className="text-xs font-bold text-white/60">{dep.time}</span>
 </div>
 <div className={cn("p-3 rounded-lg border", hasBalance ? "bg-rose-500/10 border-border" : "bg-muted/50 border-border")}>
 <span className="text-xs font-bold text-muted-foreground block mb-1">Balance</span>
 <div className="flex items-center gap-1.5">
 <Wallet className={cn("w-3 h-3", hasBalance ? "text-rose-500" : "text-emerald-500")} />
 <span className={cn("text-xs font-bold", hasBalance ? "text-rose-400" : "text-emerald-400")}>
 {hasBalance ? `$${dep.balance}` : 'Settled'}
 </span>
 </div>
 </div>
 </div>

 {hasBalance && (
 <div className="flex items-center gap-2 p-2 rounded-xl bg-rose-500/5 text-rose-500 border border-border">
 <AlertTriangle className="w-3 h-3" />
 <span className="text-xs font-bold tracking-wider">Unpaid Folio: High priority follow-up</span>
 </div>
 )}
 </div>

 <div className="flex flex-col gap-2">
 <button 
 onClick={() => onCheckOut(dep.roomNumber)}
 className={cn(
 "w-12 h-12 rounded-lg flex items-center justify-center shadow-lg transition-all active:scale-95 group-hover:w-32 group-hover:gap-2 transition-all duration-300",
 hasBalance ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/20" : "bg-primary hover:bg-primary/80 shadow-primary/20"
 )}
 >
 <LogOut className="w-5 h-5 shrink-0 text-white" />
 <span className="hidden group-hover:block text-xs font-bold whitespace-nowrap text-white">Check-Out</span>
 </button>
 </div>
 </div>
 </motion.div>
 )
 })
 )}
 </AnimatePresence>
 </CardContent>
 </Card>
 </div>
 </div>
 )
}
