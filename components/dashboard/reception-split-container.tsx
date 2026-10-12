"use client"

import React, { useState } from 'react'
import {
  Columns,
  Calendar as CalendarIcon,
  Bed,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type SplitMode = 'equal' | 'calendar-focus' | 'matrix-focus'

export interface ReceptionSplitContainerProps {
  calendarNode: React.ReactNode
  matrixNode: React.ReactNode
  calendarBookingsCount?: number
  totalRoomsCount?: number
}

export function ReceptionSplitContainer({
  calendarNode,
  matrixNode,
  calendarBookingsCount = 0,
  totalRoomsCount = 0
}: ReceptionSplitContainerProps) {
  const [splitMode, setSplitMode] = useState<SplitMode>('equal')
  const [mobileActiveTab, setMobileActiveTab] = useState<'calendar' | 'matrix'>('calendar')

  return (
    <div className="space-y-4">
      {/* View Mode Controls Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white/[0.03] border border-white/5 rounded-2xl p-2.5 px-4 backdrop-blur-md">
        {/* Left: View Mode Indicator */}
        <div className="flex items-center space-x-2 text-xs text-white/50">
          <Columns className="w-4 h-4 text-primary" />
          <span className="font-semibold text-white/80">Dual Command Desk</span>
          <span className="text-white/20">•</span>
          <span>Calendar & Inventory Synced</span>
        </div>

        {/* Right: Desktop Split Ratio Switcher */}
        <div className="hidden xl:flex items-center gap-1 bg-black/40 border border-white/10 p-1 rounded-xl">
          <button
            onClick={() => setSplitMode('calendar-focus')}
            className={cn(
              "text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all",
              splitMode === 'calendar-focus'
                ? "bg-primary text-black font-black shadow-sm"
                : "text-white/40 hover:text-white"
            )}
            title="Wider Calendar (60/40)"
          >
            Calendar Wide
          </button>

          <button
            onClick={() => setSplitMode('equal')}
            className={cn(
              "text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all",
              splitMode === 'equal'
                ? "bg-primary text-black font-black shadow-sm"
                : "text-white/40 hover:text-white"
            )}
            title="Equal Split (50/50)"
          >
            50 / 50 Split
          </button>

          <button
            onClick={() => setSplitMode('matrix-focus')}
            className={cn(
              "text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all",
              splitMode === 'matrix-focus'
                ? "bg-primary text-black font-black shadow-sm"
                : "text-white/40 hover:text-white"
            )}
            title="Wider Room Matrix (40/60)"
          >
            Matrix Wide
          </button>
        </div>

        {/* Mobile / Tablet Segmented Tabs (Displayed when < xl) */}
        <div className="flex xl:hidden w-full sm:w-auto items-center gap-1 bg-black/40 border border-white/10 p-1 rounded-xl">
          <button
            onClick={() => setMobileActiveTab('calendar')}
            className={cn(
              "flex-1 sm:flex-none text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5",
              mobileActiveTab === 'calendar'
                ? "bg-primary text-black font-black"
                : "text-white/40 hover:text-white"
            )}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            Calendar
          </button>

          <button
            onClick={() => setMobileActiveTab('matrix')}
            className={cn(
              "flex-1 sm:flex-none text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5",
              mobileActiveTab === 'matrix'
                ? "bg-primary text-black font-black"
                : "text-white/40 hover:text-white"
            )}
          >
            <Bed className="w-3.5 h-3.5" />
            Room Matrix ({totalRoomsCount})
          </button>
        </div>
      </div>

      {/* Main Dual-Column Split Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Full Calendar */}
        <div
          className={cn(
            "transition-all duration-300",
            // Desktop Widths based on splitMode
            splitMode === 'equal' && "xl:col-span-6",
            splitMode === 'calendar-focus' && "xl:col-span-7",
            splitMode === 'matrix-focus' && "xl:col-span-5",
            // Mobile Visibility
            mobileActiveTab === 'calendar' ? "block" : "hidden xl:block"
          )}
        >
          {calendarNode}
        </div>

        {/* Right Column: Room Matrix */}
        <div
          className={cn(
            "transition-all duration-300",
            // Desktop Widths based on splitMode
            splitMode === 'equal' && "xl:col-span-6",
            splitMode === 'calendar-focus' && "xl:col-span-5",
            splitMode === 'matrix-focus' && "xl:col-span-7",
            // Mobile Visibility
            mobileActiveTab === 'matrix' ? "block" : "hidden xl:block"
          )}
        >
          {matrixNode}
        </div>
      </div>
    </div>
  )
}
