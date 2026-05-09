"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Terminal, 
  Search, 
  Navigation, 
  Flame, 
  HelpCircle,
  Hash,
  AlertOctagon,
  PlusCircle,
  Sparkles
} from 'lucide-react'
import toast from 'react-hot-toast'

interface CommandItem {
  id: string
  title: string
  shortcut?: string
  icon: React.ReactNode
  action: () => void
  category: 'NAVIGATION' | 'QUICK_ACTIONS' | 'SYSTEM'
}

export function CommandPalette() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  
  const paletteRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Listen for Cmd+K / Ctrl+K toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }

      // Close on Esc
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Auto focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery("")
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleCommandSelected = (item: CommandItem) => {
    item.action()
    setIsOpen(false)
  }

  // Handle direct command line submissions (Slash Commands)
  const handleCommandLineSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    const trimmed = query.trim()

    // 1. /clean command
    if (trimmed.startsWith('/clean ')) {
      const targetRoom = trimmed.replace('/clean ', '').trim()
      toast.success(`Housekeeping sweep dispatched to: ${targetRoom}`, { icon: '🧹' })
      setIsOpen(false)
      return
    }

    // 2. /incident command
    if (trimmed.startsWith('/incident ')) {
      const incidentTitle = trimmed.replace('/incident ', '').trim()
      try {
        const res = await fetch('/api/incidents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: incidentTitle,
            category: 'SECURITY',
            severity: 'CRITICAL',
            owner: 'SRE Command Line',
            message: 'Incident registered instantly via administrative command palette.'
          })
        }).then(r => r.json())

        if (res && res.success) {
          toast.success(`Critical incident registered: ${res.incident.id}`, { icon: '🚨' })
        }
      } catch {
        toast.error('Failed to dispatch command-line incident.')
      }
      setIsOpen(false)
      return
    }

    // 3. /chat command
    if (trimmed.startsWith('/chat ')) {
      const chatText = trimmed.replace('/chat ', '').trim()
      toast.success(`Dispatched operational memo: "${chatText}" to active channels.`)
      setIsOpen(false)
      return
    }

    // Fallback standard navigation trigger matching selectIndex
    if (filteredCommands[selectedIndex]) {
      handleCommandSelected(filteredCommands[selectedIndex])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredCommands.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length))
    }
  }

  const staticCommands: CommandItem[] = [
    // 1. Navigations
    {
      id: 'nav-dashboard',
      title: 'Go to Master Control Room',
      shortcut: 'G D',
      icon: <Navigation className="w-4 h-4 text-purple-400" />,
      action: () => router.push('/admin/dashboard'),
      category: 'NAVIGATION'
    },
    {
      id: 'nav-timeline',
      title: 'Go to Unified Operational Timeline',
      shortcut: 'G T',
      icon: <Navigation className="w-4 h-4 text-purple-400" />,
      action: () => router.push('/admin/timeline'),
      category: 'NAVIGATION'
    },
    {
      id: 'nav-collaboration',
      title: 'Go to Collaboration Messenger',
      shortcut: 'G C',
      icon: <Navigation className="w-4 h-4 text-purple-400" />,
      action: () => router.push('/admin/collaboration'),
      category: 'NAVIGATION'
    },
    {
      id: 'nav-incidents',
      title: 'Go to Incident Control Room',
      shortcut: 'G I',
      icon: <Navigation className="w-4 h-4 text-purple-400" />,
      action: () => router.push('/admin/incidents'),
      category: 'NAVIGATION'
    },
    {
      id: 'nav-automation',
      title: 'Go to Workflow Automation Builder',
      shortcut: 'G A',
      icon: <Navigation className="w-4 h-4 text-purple-400" />,
      action: () => router.push('/admin/automation'),
      category: 'NAVIGATION'
    },
    {
      id: 'nav-chaos',
      title: 'Go to SRE Chaos Engine Cockpit',
      shortcut: 'G S',
      icon: <Navigation className="w-4 h-4 text-purple-400" />,
      action: () => router.push('/admin/chaos'),
      category: 'NAVIGATION'
    },
    
    // 2. Direct operations actions
    {
      id: 'act-clean-102',
      title: 'Trigger Clean assign: Suite 102',
      shortcut: '/clean 102',
      icon: <PlusCircle className="w-4 h-4 text-amber-400" />,
      action: () => toast.success('Dispatched Sarah Cleaner to Room 102 (Escalated SLA)', { icon: '🧹' }),
      category: 'QUICK_ACTIONS'
    },
    {
      id: 'act-leak',
      title: 'File Leak Incident: Room 304',
      shortcut: '/incident Leak Room 304',
      icon: <AlertOctagon className="w-4 h-4 text-rose-400 animate-pulse" />,
      action: async () => {
        const res = await fetch('/api/incidents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: "Leak: Room 304 Condenser",
            category: "MAINTENANCE",
            severity: "CRITICAL",
            owner: "Marcus HVAC",
            message: "AC compressor drip tray overflowing."
          })
        }).then(r => r.json())
        if (res && res.success) {
          toast.success(`Leak incident ${res.incident.id} filed successfully!`, { icon: '🚨' })
        }
      },
      category: 'QUICK_ACTIONS'
    }
  ]

  const filteredCommands = staticCommands.filter(cmd => 
    cmd.title.toLowerCase().includes(query.toLowerCase()) || 
    cmd.shortcut?.toLowerCase().includes(query.toLowerCase())
  )

  if (!isOpen) return null

  const isSlashCommand = query.startsWith('/')

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-start justify-center pt-[15vh]">
      
      <div 
        ref={paletteRef}
        className="w-full max-w-xl bg-[#0b061c] border border-purple-900/30 shadow-2xl relative flex flex-col font-sans overflow-hidden max-h-[50vh]"
      >
        
        {/* Glow header overlay */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-rose-500 opacity-60" />

        {/* Search input bar */}
        <form onSubmit={handleCommandLineSubmit} className="flex items-center gap-3 p-4 border-b border-purple-950/40 bg-slate-950/40 shrink-0">
          <Search className="w-5 h-5 text-purple-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type search terms or command (/clean, /incident, /chat)..."
            className="flex-1 bg-transparent border-0 text-slate-200 text-sm focus:outline-none focus:ring-0"
          />
          <div className="shrink-0 text-[10px] text-slate-500 bg-slate-950 border border-slate-800 px-1.5 py-0.5 font-mono">
            ESC to close
          </div>
        </form>

        {/* Results/Command completion frame */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 select-none min-h-0">
          {isSlashCommand ? (
            <div className="p-4 space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-widest text-purple-400 flex items-center gap-1.5 font-mono"><Terminal className="w-4 h-4 text-purple-400" /> Administrative Slash Console</span>
              <div className="space-y-2 text-xs font-mono text-slate-400 leading-relaxed">
                <div className="p-2 border border-purple-950/30 bg-slate-950/40">
                  <strong className="text-white">/clean [room_number]</strong>
                  <p className="text-[10px] mt-0.5 text-slate-500">e.g. <span className="text-purple-300">/clean 102</span> - Dispatch urgent cleaning team</p>
                </div>
                <div className="p-2 border border-purple-950/30 bg-slate-950/40">
                  <strong className="text-white">/incident [title]</strong>
                  <p className="text-[10px] mt-0.5 text-slate-500">e.g. <span className="text-purple-300">/incident Lift Lockout</span> - Open critical SRE incident</p>
                </div>
                <div className="p-2 border border-purple-950/30 bg-slate-950/40">
                  <strong className="text-white">/chat [message]</strong>
                  <p className="text-[10px] mt-0.5 text-slate-500">e.g. <span className="text-purple-300">/chat Allergies 405</span> - Push message bulletin</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-600 italic">Press <kbd className="font-bold text-slate-500 bg-slate-950 border border-slate-800 px-1 py-0.5">Enter</kbd> to execute command console arguments.</p>
            </div>
          ) : filteredCommands.length === 0 ? (
            <div className="text-slate-600 py-10 text-center text-xs flex flex-col items-center gap-1">
              <HelpCircle className="w-7 h-7 text-slate-800 animate-bounce" /> No matching operational commands found.
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex
              return (
                <button
                  key={cmd.id}
                  onClick={() => handleCommandSelected(cmd)}
                  className={`w-full p-2.5 flex items-center justify-between gap-4 transition-all text-left border ${isSelected ? 'bg-purple-950/30 border-purple-500/30 text-white' : 'bg-transparent border-transparent text-slate-400'}`}
                >
                  <div className="flex items-center gap-3 truncate">
                    {cmd.icon}
                    <span className="text-xs font-semibold">{cmd.title}</span>
                  </div>
                  {cmd.shortcut && (
                    <div className="text-[9px] font-mono text-slate-500 uppercase font-extrabold bg-slate-950 border border-slate-800 px-1.5 py-0.5">
                      {cmd.shortcut}
                    </div>
                  )}
                </button>
              )
            })
          )}
        </div>

        {/* Footnotes navigation hints */}
        <div className="p-3 border-t border-purple-950/40 bg-slate-950/60 flex justify-between items-center text-[10px] text-slate-500 shrink-0">
          <div className="flex items-center gap-3">
            <span>↑↓ arrow keys to focus</span>
            <span>↵ Enter to execute</span>
          </div>
          <div className="flex items-center gap-1 text-purple-400 font-semibold uppercase text-[9px] tracking-wider">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Command Engine v2
          </div>
        </div>

      </div>

    </div>
  )
}
export default CommandPalette;
