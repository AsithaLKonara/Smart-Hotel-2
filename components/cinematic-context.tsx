"use client"

import React, { createContext, useContext, useState } from 'react'

export type EmotionalState = 'calm' | 'focus' | 'prestige'

interface CinematicContextProps {
  isDemoMode: boolean
  setIsDemoMode: (val: boolean) => void
  emotionalState: EmotionalState
  setEmotionalState: (state: EmotionalState) => void
}

const CinematicContext = createContext<CinematicContextProps | undefined>(undefined)

export function CinematicProvider({ children }: { children: React.ReactNode }) {
  // Fix 4: Use lazy initialisers instead of static defaults + useEffect.
  //
  // The previous pattern — `useState(true)` then a `useEffect` that reads
  // localStorage — caused a two-phase render:
  //   Phase 1 (SSR + first client paint): defaults applied  → 'prestige/demo'
  //   Phase 2 (after hydration):          localStorage read → different values
  // This produced a jarring FOUC on every hard-reload.
  //
  // Lazy initialisers run ONCE, synchronously, on the client during the first
  // render, so the first paint already uses the persisted values. On the server
  // (SSR) `typeof window === 'undefined'` is true and the defaults are used,
  // which is fine because the server and client agree on those defaults when
  // localStorage is empty.
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    const saved = localStorage.getItem('sh_demo_mode')
    return saved !== null ? saved === 'true' : true
  })

  const [emotionalState, setEmotionalState] = useState<EmotionalState>(() => {
    if (typeof window === 'undefined') return 'prestige'
    const saved = localStorage.getItem('sh_emotional_state')
    return (saved as EmotionalState | null) ?? 'prestige'
  })

  // useEffect is no longer needed for the initial localStorage read.
  // It is intentionally removed to eliminate the post-hydration state flip.


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
