'use client'

import { Building2 } from 'lucide-react'
import { useProperty } from '@/contexts/property-context'

const properties = [
  { id: 'prop-1', name: 'Grand Palace Hotel (HQ)', code: 'GPH-01' },
  { id: 'prop-2', name: 'Grand Palace Resort & Spa', code: 'GPR-02' },
  { id: 'prop-3', name: 'Grand Palace Express', code: 'GPE-03' },
]

export function PropertySwitcher() {
  const { activePropertyId, setActivePropertyId } = useProperty()
  const activeProperty = properties.find(p => p.id === activePropertyId) || properties[0]

  return (
    <div className="flex flex-col gap-1 px-3 py-2 rounded-md hover:bg-white/5 transition-colors border border-white/10 bg-black/50">
      <div className="flex items-center gap-2 mb-1">
        <Building2 size={14} className="text-brand-purple" />
        <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Property Switcher</span>
      </div>
      <select
        value={activeProperty.id}
        onChange={(e) => setActivePropertyId(e.target.value)}
        className="bg-transparent text-sm font-medium text-white border-none focus:ring-0 focus:outline-none cursor-pointer w-full"
      >
        {properties.map((property) => (
          <option key={property.id} value={property.id} className="bg-[#111] text-white">
            {property.name} ({property.code})
          </option>
        ))}
      </select>
    </div>
  )
}
