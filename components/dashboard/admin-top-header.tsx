"use client"

import React from 'react'
import Link from 'next/link'
import {
  Menu,
  Search,
  Plus,
  ExternalLink,
  Command,
  Activity,
  Sparkles,
} from 'lucide-react'
import { useSidebar } from '@/lib/sidebar-context'
import { OperationalAlertCenter } from './operational-alert-center'

interface AdminTopHeaderProps {
  onOpenCommandPalette?: () => void
}

export function AdminTopHeader({ onOpenCommandPalette }: AdminTopHeaderProps) {
  const { toggleSidebar, toggleMobileMenu } = useSidebar()

  const handleOpenSearch = () => {
    if (onOpenCommandPalette) {
      onOpenCommandPalette()
    } else {
      window.dispatchEvent(new CustomEvent('open-command-palette'))
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))
    }
  }

  return (
    <header className="h-[64px] px-4 sm:px-8 border-b border-[#1C2025] bg-[#090A0C]/90 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between gap-4 hide-on-print">
      {/* Left Area: Toggle & Omni-Search */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
        <button
          onClick={() => {
            if (window.innerWidth < 1024) {
              toggleMobileMenu()
            } else {
              toggleSidebar()
            }
          }}
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-[#181A1D] transition-colors border border-transparent hover:border-[#2B3037]"
          title="Toggle Navigation"
          aria-label="Toggle Navigation"
        >
          <Menu size={18} />
        </button>

        <div className="relative flex-1 cursor-pointer" onClick={handleOpenSearch}>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Search size={14} />
          </div>
          <input
            type="text"
            readOnly
            onClick={handleOpenSearch}
            placeholder="Search reservations, folios, rooms, guests..."
            className="w-full h-9 pl-9 pr-14 rounded-lg bg-[#121417] border border-[#22262B] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer select-none"
          />
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1C2025] text-zinc-400 border border-[#2B3037]">
              ⌘K
            </span>
          </div>
        </div>
      </div>

      {/* Right Area: Status & Primary Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        <Link
          href="/"
          target="_blank"
          className="hidden md:flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-[#141619] transition-colors"
        >
          <span>Public Portal</span>
          <ExternalLink size={12} className="text-zinc-600" />
        </Link>

        {/* Live Cluster Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Cluster Online</span>
        </div>

        {/* Operational Alert Center */}
        <div className="flex items-center">
          <OperationalAlertCenter />
        </div>

        {/* Primary Action Button */}
        <Link
          href="/booking"
          target="_blank"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-all shadow-sm"
        >
          <Plus size={14} className="stroke-[2.5]" />
          <span className="hidden sm:inline">New Reservation</span>
        </Link>
      </div>
    </header>
  )
}
