'use client'

import { Building2, Loader2, Lock } from 'lucide-react'
import { useProperty } from '@/contexts/property-context'

export function PropertySwitcher() {
  const { activePropertyId, setActivePropertyId, properties, isLoading, isLocked } = useProperty()
  
  if (isLoading) {
    return (
      <div className="flex flex-col gap-1 px-3 py-2 rounded-md border border-white/10 bg-black/50 justify-center items-center h-[58px]">
        <Loader2 className="w-4 h-4 animate-spin text-white/50" />
      </div>
    )
  }

  const activeProperty = properties.find(p => p.id === activePropertyId) || properties[0]

  if (!activeProperty) {
    return null
  }

  return (
    <div className="flex flex-col gap-1 px-3 py-2 rounded-md hover:bg-white/5 transition-colors border border-white/10 bg-black/50">
      <div className="flex items-center gap-2 mb-1 justify-between">
        <div className="flex items-center gap-2">
          <Building2 size={14} className="text-brand-purple" />
          <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Property</span>
        </div>
        {isLocked && <Lock size={12} className="text-white/30" />}
      </div>
      
      {isLocked ? (
        <div className="text-sm font-medium text-white truncate pr-2 w-full">
          {activeProperty.name} <span className="text-white/50 text-xs">({activeProperty.code})</span>
        </div>
      ) : (
        <select
          value={activeProperty.id}
          onChange={(e) => setActivePropertyId(e.target.value)}
          className="bg-transparent text-sm font-medium text-white border-none focus:ring-0 focus:outline-none cursor-pointer w-full p-0"
        >
          {properties.map((property) => (
            <option key={property.id} value={property.id} className="bg-[#111] text-white">
              {property.name} ({property.code})
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
