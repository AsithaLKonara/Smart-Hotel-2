"use client"

import React, { useState } from 'react'

interface DataPoint {
  label: string
  value: number
  formatted: string
}

const defaultSalesData: DataPoint[] = [
  { label: 'Mon', value: 42000, formatted: 'Rs. 42,000' },
  { label: 'Tue', value: 58000, formatted: 'Rs. 58,000' },
  { label: 'Wed', value: 51000, formatted: 'Rs. 51,000' },
  { label: 'Thu', value: 74000, formatted: 'Rs. 74,000' },
  { label: 'Fri', value: 92000, formatted: 'Rs. 92,000' },
  { label: 'Sat', value: 115000, formatted: 'Rs. 115,000' },
  { label: 'Sun', value: 98000, formatted: 'Rs. 98,000' },
]

export function SalesPerformanceAreaChart({
  data = defaultSalesData,
  height = 200,
}: {
  data?: DataPoint[]
  height?: number
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const width = 500
  const paddingX = 30
  const paddingY = 25
  const chartWidth = width - paddingX * 2
  const chartHeight = height - paddingY * 2

  const maxValue = Math.max(...data.map(d => d.value), 1)

  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * chartWidth
    const y = paddingY + chartHeight - (d.value / maxValue) * chartHeight
    return { x, y, ...d }
  })

  // Create SVG path
  const linePath = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`
  }, '')

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${paddingY + chartHeight} L ${points[0].x} ${paddingY + chartHeight} Z`

  return (
    <div className="relative w-full overflow-hidden select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
      >
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = paddingY + chartHeight * ratio
          return (
            <line
              key={ratio}
              x1={paddingX}
              y1={y}
              x2={width - paddingX}
              y2={y}
              stroke="#1F2329"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
          )
        })}

        {/* Filled Area */}
        <path d={areaPath} fill="url(#areaGrad)" />

        {/* Trend Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data Points */}
        {points.map((pt, i) => {
          const isHovered = hoverIndex === i
          return (
            <g key={i} className="cursor-pointer">
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isHovered ? 5 : 3.5}
                fill={isHovered ? 'white' : '#3B82F6'}
                stroke="#3B82F6"
                strokeWidth={isHovered ? 2 : 1}
                className="transition-all duration-150"
              />
              {/* Invisible wider target for easier hovering */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={16}
                fill="transparent"
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
              />
            </g>
          )
        })}
      </svg>

      {/* Floating Tooltip */}
      {hoverIndex !== null && points[hoverIndex] && (
        <div
          className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-full transition-all duration-75"
          style={{
            left: `${(points[hoverIndex].x / width) * 100}%`,
            top: `${(points[hoverIndex].y / height) * 100 - 8}%`,
          }}
        >
          <div className="bg-[#181A1D] border border-[#2B3037] shadow-2xl rounded-lg p-2 font-mono text-center">
            <p className="text-[10px] text-zinc-400">{points[hoverIndex].label}</p>
            <p className="text-xs font-bold text-white tracking-tight">{points[hoverIndex].formatted}</p>
          </div>
        </div>
      )}

      {/* X-Axis Labels */}
      <div className="flex justify-between px-4 mt-2">
        {data.map((d, i) => (
          <span key={i} className="text-[10px] font-mono text-zinc-500">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  )
}

interface DonutSegment {
  label: string
  percentage: number
  color: string
}

const defaultDonutSegments: DonutSegment[] = [
  { label: 'Room Stays', percentage: 55, color: '#3B82F6' },
  { label: 'F&B Dining', percentage: 25, color: '#10B981' },
  { label: 'Spa & Wellness', percentage: 12, color: '#F59E0B' },
  { label: 'Events & Tours', percentage: 8, color: '#8B5CF6' },
]

export function RevenueBreakdownDonutChart({
  segments = defaultDonutSegments,
  centerTitle = 'Revenue',
  centerValue = 'LKR 4.2M'
}: {
  segments?: DonutSegment[]
  centerTitle?: string
  centerValue?: string
}) {
  const r = 38
  const C = 2 * Math.PI * r // ≈ 238.76

  let accumulatedPercent = 0

  return (
    <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
      <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform">
          {/* Background Track */}
          <circle
            cx="50"
            cy="50"
            r={r}
            stroke="#1C2025"
            strokeWidth="14"
            fill="none"
          />

          {/* Dynamic Slices */}
          {segments.map((seg, i) => {
            const arcLength = (seg.percentage / 100) * C
            const offset = -((accumulatedPercent / 100) * C)
            accumulatedPercent += seg.percentage

            return (
              <circle
                key={i}
                cx="50"
                cy="50"
                r={r}
                stroke={seg.color}
                strokeWidth="14"
                strokeDasharray={`${arcLength} ${C}`}
                strokeDashoffset={offset}
                fill="none"
                className="transition-all duration-500"
              />
            )
          })}
        </svg>

        {/* Center Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{centerTitle}</span>
          <span className="text-sm font-mono font-bold text-white">{centerValue}</span>
        </div>
      </div>

      {/* Segment Legend */}
      <div className="space-y-2.5 w-full sm:w-auto">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center justify-between sm:justify-start gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
              <span className="text-xs text-zinc-300 font-medium">{seg.label}</span>
            </div>
            <span className="text-xs font-mono font-semibold text-zinc-400">
              {seg.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
