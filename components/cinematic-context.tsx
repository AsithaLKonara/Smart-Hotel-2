"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

export type EmotionalState = 'calm' | 'focus' | 'prestige'

interface CinematicContextProps {
  isDemoMode: boolean
  setIsDemoMode: (val: boolean) => void
  emotionalState: EmotionalState
  setEmotionalState: (state: EmotionalState) => void
}

const CinematicContext = createContext<CinematicContextProps | undefined>(undefined)

export function CinematicProvider({ children }: { children: React.ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true) // Default to ON for instant wow factor
  const [emotionalState, setEmotionalState] = useState<EmotionalState>('prestige') // Default to prestige for high luxury

  useEffect(() => {
    const savedDemo = localStorage.getItem('sh_demo_mode')
    const savedState = localStorage.getItem('sh_emotional_state')
    if (savedDemo !== null) {
      setIsDemoMode(savedDemo === 'true')
    }
    if (savedState !== null) {
      setEmotionalState(savedState as EmotionalState)
    }
  }, [])

  const handleSetDemoMode = (val: boolean) => {
    setIsDemoMode(val)
    localStorage.setItem('sh_demo_mode', String(val))
    window.dispatchEvent(new CustomEvent('sh-demo-mode-change', { detail: { isDemoMode: val } }))
  }

  const handleSetEmotionalState = (state: EmotionalState) => {
    setEmotionalState(state)
    localStorage.setItem('sh_emotional_state', state)
    window.dispatchEvent(new CustomEvent('sh-emotional-state-change', { detail: { emotionalState: state } }))
  }

  return (
    <CinematicContext.Provider value={{
      isDemoMode,
      setIsDemoMode: handleSetDemoMode,
      emotionalState,
      setEmotionalState: handleSetEmotionalState
    }}>
      {children}
    </CinematicContext.Provider>
  )
}

export function useCinematic() {
  const context = useContext(CinematicContext)
  if (context === undefined) {
    throw new Error('useCinematic must be used within a CinematicProvider')
  }
  return context
}
