'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export type Property = {
  id: string
  name: string
  code: string
}

type PropertyContextType = {
  activePropertyId: string | null
  setActivePropertyId: (id: string) => void
  properties: Property[]
  isLoading: boolean
  isLocked: boolean
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined)

export function PropertyProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [activePropertyIdState, setActivePropertyIdState] = useState<string | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const userPropertyId = session?.user?.propertyId as string | undefined

  useEffect(() => {
    async function fetchProperties() {
      try {
        const res = await fetch('/api/admin/corporate/properties')
        if (res.ok) {
          const data = await res.json()
          setProperties(data)
          
          // Determine the initial active property
          if (userPropertyId) {
            // User is locked to a property
            setActivePropertyIdState(userPropertyId)
          } else {
            // User can switch properties
            const stored = localStorage.getItem('smarthotel_active_property')
            if (stored && data.some((p: Property) => p.id === stored)) {
              setActivePropertyIdState(stored)
            } else if (data.length > 0) {
              setActivePropertyIdState(data[0].id)
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch properties', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchProperties()
  }, [userPropertyId])

  const setActivePropertyId = (id: string) => {
    if (userPropertyId) return // Cannot change if locked

    setActivePropertyIdState(id)
    localStorage.setItem('smarthotel_active_property', id)
    window.dispatchEvent(new Event('propertyChange'))
  }

  return (
    <PropertyContext.Provider 
      value={{ 
        activePropertyId: activePropertyIdState, 
        setActivePropertyId, 
        properties, 
        isLoading,
        isLocked: !!userPropertyId
      }}
    >
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
