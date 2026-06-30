'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type PropertyContextType = {
  activePropertyId: string | null
  setActivePropertyId: (id: string) => void
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined)

export function PropertyProvider({ children }: { children: React.ReactNode }) {
  const [activePropertyId, setActivePropertyIdState] = useState<string | null>(null)

  useEffect(() => {
    // On mount, read from localStorage
    const stored = localStorage.getItem('smarthotel_active_property')
    if (stored) {
      setActivePropertyIdState(stored)
    }
  }, [])

  const setActivePropertyId = (id: string) => {
    setActivePropertyIdState(id)
    localStorage.setItem('smarthotel_active_property', id)
    // Optional: Could trigger a router.refresh() here if needed,
    // but usually React Query invalidation handles the UI updates
    window.dispatchEvent(new Event('propertyChange'))
  }

  return (
    <PropertyContext.Provider value={{ activePropertyId, setActivePropertyId }}>
      {children}
    </PropertyContext.Provider>
  )
}

export function useProperty() {
  const context = useContext(PropertyContext)
  if (context === undefined) {
    throw new Error('useProperty must be used within a PropertyProvider')
  }
  return context
}
