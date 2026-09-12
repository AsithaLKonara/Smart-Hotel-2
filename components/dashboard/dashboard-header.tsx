"use client"

import { motion } from 'framer-motion'
import { Sparkles, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { OperationalAlertCenter } from './operational-alert-center'

interface DashboardHeaderProps {
 title: string
 subtitle: string
 role?: string
 unreadNotifications?: number
 onMarkRead?: () => void
 firstName?: string
}

export function DashboardHeader({
 title,
 subtitle,
 role,
 unreadNotifications = 0,
 onMarkRead,
 firstName
}: DashboardHeaderProps) {
 return (
 <div className="bg-card rounded-xl p-8 lg:p-12 text-white relative overflow-hidden border border-border shadow-sm shadow-black/50 mb-12 group hide-on-print">
 {/* Structural Accents */}
 <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
 <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/60 to-transparent opacity-50" />
 <div className="absolute -right-40 -top-40 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full group-hover:bg-primary/10 transition-colors duration-1000" />

 <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-10">
 <div className="space-y-6">
 <motion.div 
 initial={{ opacity: 0, x: -10 }}
 animate={{ opacity: 1, x: 0 }}
 className="flex items-center gap-3"
 >
 <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-2">
 <Sparkles className="w-3 h-3 text-primary" />
 <span className="text-xs font-bold tracking-[0.2em] text-primary">Node: {role || 'Operational'}</span>
 </div>
 <div className="h-px w-8 bg-white/10" />
 <span className="text-xs font-bold tracking-[0.2em] text-muted-foreground">v4.0 Enterprise</span>
 </motion.div>
 
 <div className="space-y-2">
 <motion.h1 
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.1 }}
 className="text-4xl lg:text-6xl font-serif font-bold text-white tracking-tight leading-tight"
 >
 {title}{firstName ? `, ${firstName}` : ''}
 </motion.h1>
 
 <motion.p 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 transition={{ delay: 0.2 }}
 className="text-muted-foreground max-w-2xl text-sm lg:text-base leading-relaxed font-medium"
 >
 {subtitle}
 </motion.p>
 </div>
 </div>

 <motion.div 
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.3 }}
 className="flex items-center gap-4 bg-white/[0.03] p-2 rounded-xl border border-border backdrop-blur-md"
 >
 <OperationalAlertCenter />
 
 <div className="h-10 w-px bg-white/10 mx-1" />

 <button
 className="flex items-center gap-3 px-5 py-3 text-xs font-bold text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all group/exit"
 onClick={() => signOut({ callbackUrl: '/' })}
 >
 <LogOut className="w-4 h-4 group-hover/exit:-translate-x-1 transition-transform" /> 
 Exit Session
 </button>
 </motion.div>
 </div>
 </div>
 )
}
