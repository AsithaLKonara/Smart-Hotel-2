'use client'

import { Building2, Loader2, Lock } from 'lucide-react'
import { useProperty } from '@/contexts/property-context'

export function PropertySwitcher() {
  const { activePropertyId, setActivePropertyId, properties, isLoading, isLocked } = useProperty()
  
  if (isLoading) {
    return (
      <div className="flex flex-col gap-1 px-3 py-2 rounded-md border border-border bg-muted/40 dark:bg-black/50 justify-center items-center h-[58px]">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  let activeProperty = properties.find(p => p.id === activePropertyId)
  if (activePropertyId === 'all') {
    activeProperty = { id: 'all', name: 'All Properties', code: 'Global' }
  } else if (!activeProperty && properties.length > 0) {
    activeProperty = properties[0]
  }

  if (!activeProperty) {
    return null
  }

  return (
    <div className="flex flex-col gap-1 px-3 py-2 rounded-md hover:bg-muted/30 dark:hover:bg-white/5 transition-colors border border-border bg-card dark:bg-black/50 shadow-sm">
      <div className="flex items-center gap-2 mb-1 justify-between">
        <div className="flex items-center gap-2">
          <Building2 size={14} className="text-brand-purple" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Property</span>
        </div>
        {isLocked && <Lock size={12} className="text-muted-foreground" />}
      </div>
      
      {isLocked ? (
        <div className="text-sm font-medium text-foreground dark:text-white truncate pr-2 w-full">
          {activeProperty.name} <span className="text-muted-foreground text-xs">({activeProperty.code})</span>
        </div>
      ) : (
        <select
          value={activeProperty.id}
          onChange={(e) => setActivePropertyId(e.target.value)}
          className="bg-transparent text-sm font-medium text-foreground dark:text-white border-none focus:ring-0 focus:outline-none cursor-pointer w-full p-0"
        >
          {properties.map((property) => (
            <option key={property.id} value={property.id} className="bg-popover dark:bg-[#111] text-popover-foreground dark:text-white">
              {property.name} ({property.code})
            </option>
          ))}
          {!isLocked && (
            <option value="all" className="bg-popover dark:bg-[#111] text-popover-foreground dark:text-white font-bold border-t border-border">
              🌍 All Properties (Global)
            </option>
          )}
        </select>
      )}
    </div>
  )
}
