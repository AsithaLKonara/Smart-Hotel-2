"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { canAccessAdminDashboard } from '@/lib/rbac-helpers'
import { useRealtimeCollaboration } from '@/hooks/use-realtime-collaboration'
import { 
  Users, 
  MessageSquare, 
  Send, 
  User, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  ChevronRight, 
  Timer,
  Clock,
  ShieldCheck,
  Megaphone,
  Pocket
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import { PremiumSpinner } from '@/components/ui/premium-spinner'

const CHANNELS = [
  { id: 'reception-housekeeping', name: 'Reception ↔ Housekeeping', icon: '🧹', desc: 'Room releases, checkouts, and deep cleans' },
  { id: 'reception-kitchen', name: 'Reception ↔ Kitchen', icon: '🍳', desc: 'VIP catering updates, allergy overrides' },
  { id: 'housekeeping-maintenance', name: 'Housekeeping ↔ Maintenance', icon: '🔧', desc: 'Broken ACs, water leaks, reactive inspects' },
  { id: 'management-all', name: 'Management ↔ Staff', icon: '📢', desc: 'Critical incident bulletins, shift alerts' }
]

export default function StaffCollaborationHub() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [activeChannel, setActiveChannel] = useState('reception-housekeeping')
  const [inputText, setInputText] = useState('')
  const [messagePriority, setMessagePriority] = useState<'low' | 'normal' | 'high'>('normal')

  // Bind real-time collaboration engine hook!
  const { 
    onlineStaff, 
    messages, 
    typingStaff, 
    isConnected, 
    dispatchMessage, 
    setLocalTyping 
  } = useRealtimeCollaboration(activeChannel)

  const chatBottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!canAccessAdminDashboard(session)) {
      toast.error('Access Denied: Administrative credentials required.')
      router.push('/auth/signin')
    }
  }, [session, status]) // eslint-disable-line react-hooks/exhaustive-deps

  // Automatically scroll chat feeds
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim()) return

    dispatchMessage(inputText.trim(), messagePriority)
    setInputText('')
    setLocalTyping(false)
    setMessagePriority('normal')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value)
    if (e.target.value.trim().length > 0) {
      setLocalTyping(true)
    } else {
      setLocalTyping(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <PremiumSpinner size="lg" text="Syncing real-time collaboration gateway..." />
      </div>
    )
  }

  const currentChannelInfo = CHANNELS.find(c => c.id === activeChannel)

  return (
    <div className="min-h-screen bg-[#090514] text-slate-100 p-6 font-sans flex flex-col h-screen overflow-hidden">
      
      {/* Top Banner Control Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-purple-950/40 pb-5 mb-5 shrink-0 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Badge className="bg-purple-600/10 text-purple-400 border border-purple-500/30 text-xs tracking-wider uppercase font-bold py-1 px-3">
              LIVE STAFF DESK
            </Badge>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              {isConnected ? (
                <span className="flex items-center text-emerald-400 font-semibold gap-1">
                  <Wifi className="w-3.5 h-3.5" /> WebSockets Engaged
                </span>
              ) : (
                <span className="flex items-center text-rose-400 font-semibold gap-1 animate-pulse">
                  <WifiOff className="w-3.5 h-3.5" /> Outage: Offline Recovery Caching
                </span>
              )}
            </div>
          </div>
          <h1 className="text-3xl font-serif font-bold text-white mt-1.5">Staff Collaboration & Communication Hub</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => router.push('/admin/timeline')} variant="outline" size="sm" className="bg-white/5 border-purple-950/50 text-purple-300">
            Unified Timeline
          </Button>
          <Button onClick={() => router.push('/admin/dashboard')} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-0 font-semibold shadow-lg shadow-purple-950">
            Master Dashboard
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 overflow-hidden">
        
        {/* Left Drawer: Category Channels List */}
        <div className="lg:col-span-3 flex flex-col gap-4 overflow-y-auto">
          <Card className="bg-white/[0.02] border border-purple-900/10 rounded-none shadow-xl flex-1 flex flex-col">
            <CardHeader className="border-b border-purple-950/40 p-4 shrink-0">
              <CardTitle className="text-xs uppercase tracking-widest font-extrabold text-purple-400 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Active Channels
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 flex-1 space-y-1">
              {CHANNELS.map(ch => (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannel(ch.id)}
                  className={`w-full p-3 rounded-none flex items-start gap-3 transition-all text-left border ${activeChannel === ch.id ? 'bg-purple-950/30 border-purple-500/30 shadow' : 'bg-transparent border-transparent hover:bg-white/[0.01]'}`}
                >
                  <span className="text-xl mt-0.5">{ch.icon}</span>
                  <div className="min-w-0">
                    <h4 className={`text-xs font-bold ${activeChannel === ch.id ? 'text-white' : 'text-slate-300'}`}>{ch.name}</h4>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5 leading-relaxed">{ch.desc}</p>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Center Canvas: Interactive Messenger Feed */}
        <div className="lg:col-span-6 flex flex-col h-full min-h-0">
          <Card className="bg-white/[0.02] border border-purple-900/20 rounded-none shadow-2xl flex-1 flex flex-col min-h-0">
            
            {/* Active Channel Header */}
            <div className="border-b border-purple-950/50 bg-slate-950/40 p-4 shrink-0 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-sm uppercase tracking-widest font-extrabold text-white flex items-center gap-2">
                  <span className="text-lg">{currentChannelInfo?.icon}</span> {currentChannelInfo?.name}
                </h2>
                <p className="text-[10px] text-slate-500 truncate">{currentChannelInfo?.desc}</p>
              </div>
              <div className="shrink-0 flex items-center gap-1.5 bg-purple-950/50 px-2 py-1 border border-purple-500/10 text-[9px] text-purple-300 uppercase font-mono">
                <Users className="w-3 h-3 text-purple-400" /> Channels Sync
              </div>
            </div>

            {/* Live Chat Messages list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-slate-950/20">
              
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2">
                  <Megaphone className="w-8 h-8 text-slate-700 animate-bounce" />
                  <p className="text-xs">No active staff messages on this channel. Spark a discussion!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.senderId === session?.user?.email
                  const isHigh = msg.priority === 'high'

                  return (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col max-w-[85%] ${isOwn ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                    >
                      {/* Sender details badge */}
                      <div className="flex items-center gap-2 text-[9px] text-slate-500 mb-1 font-mono">
                        <span className="font-bold text-slate-300">{msg.senderName}</span>
                        <Badge variant="outline" className="text-[7px] py-0 px-1 border-purple-500/20 text-purple-400">{msg.senderRole}</Badge>
                        <span className="text-slate-600 font-sans">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      {/* Chat text box */}
                      <div className={`p-3 rounded-xs border text-xs leading-relaxed ${isOwn ? (isHigh ? 'bg-amber-950/20 border-amber-500/40 text-slate-100 shadow-md shadow-amber-950/10' : 'bg-purple-950/20 border-purple-500/20 text-slate-100') : (isHigh ? 'bg-rose-950/20 border-rose-500/40 text-slate-100 shadow-md shadow-rose-950/10' : 'bg-white/[0.01] border-slate-800 text-slate-300')} relative`}>
                        {msg.isPending && (
                          <Badge className="absolute -top-2.5 -right-2 bg-amber-950 text-amber-400 border border-amber-500/30 text-[7px] font-mono tracking-widest py-0 px-1 uppercase font-extrabold">Pending Sync</Badge>
                        )}
                        <p>{msg.text}</p>
                      </div>

                      {/* High-priority SLA timers */}
                      {isHigh && (
                        <div className="flex items-center gap-1.5 mt-1 text-[8px] uppercase tracking-wider font-extrabold text-amber-500 font-mono animate-pulse">
                          <Timer className="w-3 h-3 text-amber-500" /> Response SLA Target: 5:00 Unresolved
                        </div>
                      )}

                    </div>
                  )
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Typing indicators */}
            {typingStaff.length > 0 && (
              <div className="px-4 py-1.5 bg-slate-950/40 border-t border-purple-950/20 text-[10px] text-slate-500 italic flex items-center gap-2">
                <span className="flex h-1.5 w-1.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-purple-500"></span>
                </span>
                {typingStaff.join(', ')} is composing notes...
              </div>
            )}

            {/* Input submission box */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-purple-950/40 bg-slate-950/30 shrink-0 space-y-3">
              
              <div className="flex items-center justify-between gap-4 text-xs font-mono text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase">Tag Priority:</span>
                  <button
                    type="button"
                    onClick={() => setMessagePriority('low')}
                    className={`px-2 py-0.5 border rounded-xs text-[9px] ${messagePriority === 'low' ? 'bg-blue-950/30 border-blue-500/40 text-blue-400 font-bold' : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400'}`}
                  >
                    Low
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessagePriority('normal')}
                    className={`px-2 py-0.5 border rounded-xs text-[9px] ${messagePriority === 'normal' ? 'bg-slate-950 border-slate-800 text-slate-400 font-bold' : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400'}`}
                  >
                    Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessagePriority('high')}
                    className={`px-2 py-0.5 border rounded-xs text-[9px] ${messagePriority === 'high' ? 'bg-amber-950/30 border-amber-500/40 text-amber-400 font-bold' : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400'}`}
                  >
                    High SLA
                  </button>
                </div>
                {!isConnected && (
                  <span className="text-[9px] text-amber-500 flex items-center gap-1 uppercase font-bold animate-pulse"><AlertTriangle className="w-3.5 h-3.5" /> Queue Buffered</span>
                )}
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  onBlur={() => setLocalTyping(false)}
                  placeholder={`Compose staff dispatch to ${currentChannelInfo?.name}...`}
                  className="flex-1 bg-slate-950 border border-purple-900/20 text-xs text-slate-200 p-3 rounded-none focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border-0 text-white shrink-0 shadow-lg shadow-purple-950"
                >
                  <Send className="w-4 h-4" /> Send Dispatch
                </Button>
              </div>

            </form>

          </Card>
        </div>

        {/* Right Drawer: Online Staff Active Presence Roster */}
        <div className="lg:col-span-3 flex flex-col gap-4 overflow-y-auto">
          
          <Card className="bg-white/[0.02] border border-purple-900/10 rounded-none shadow-xl flex-1 flex flex-col">
            <CardHeader className="border-b border-purple-950/40 p-4 shrink-0 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xs uppercase tracking-widest font-extrabold text-slate-300">Staff Presence</CardTitle>
                <CardDescription className="text-[10px] text-slate-500">Connected operators on active shifts.</CardDescription>
              </div>
              <Badge className="bg-emerald-950 text-emerald-300 border-emerald-500/20 text-[9px]">{onlineStaff.length} Connected</Badge>
            </CardHeader>
            <CardContent className="p-3 flex-1 overflow-y-auto space-y-3">
              {onlineStaff.length === 0 ? (
                <div className="text-slate-600 text-center py-8 text-xs">No online staff detected.</div>
              ) : (
                onlineStaff.map(staff => (
                  <div key={staff.id} className="flex items-center justify-between gap-3 bg-slate-950/20 p-2.5 border border-purple-950/20">
                    <div className="flex items-center gap-2.5 min-w-0">
                      
                      {/* Avatar placeholder with glow indicators */}
                      <div className="relative shrink-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-950 to-slate-950 border border-purple-900/30 flex items-center justify-center text-purple-400">
                          <User className="w-4 h-4" />
                        </div>
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-[#090514]" />
                      </div>

                      <div className="min-w-0 leading-tight">
                        <strong className="text-slate-200 text-xs truncate block">{staff.name}</strong>
                        <span className="text-[9px] text-slate-500 truncate block font-mono">{staff.email}</span>
                      </div>

                    </div>

                    <Badge variant="outline" className="text-[7px] border-emerald-500/20 text-emerald-400 uppercase font-mono shrink-0 py-0.5 px-1.5">{staff.role}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* SLA Security Standard Notice */}
          <Card className="bg-[#10072d]/20 border border-purple-950/20 rounded-none p-4">
            <div className="flex items-center gap-2 text-purple-400 mb-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <h4 className="font-extrabold text-[10px] uppercase tracking-widest text-slate-300">Staff SLA Governance</h4>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Every staff dispatch message is encrypted and immutable. All actions on high-priority channels automatically register onto the cryptographic timeline, allowing audits on communication pacing and team task-completion metrics.
            </p>
          </Card>

        </div>

      </div>

    </div>
  )
}
