"use client"

import { useState } from 'react'
import { useCinematic, EmotionalState } from '@/components/cinematic-context'
import { Sparkles, Sliders } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function CinematicHud() {
  const { isDemoMode, setIsDemoMode, emotionalState, setEmotionalState } = useCinematic()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-3 w-72 bg-black/85 backdrop-blur-3xl border border-white/10 rounded-2xl p-5 shadow-luxury overflow-hidden relative"
          >
            {/* Ambient Gold glow line */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-xs uppercase tracking-widest font-bold text-white">Cinematic Engine</span>
              </div>
              <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-primary/20">Active</span>
            </div>

            <div className="space-y-4">
              {/* Toggle Demo Mode */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/70">Cinematic Overlay</span>
                <button
                  onClick={() => setIsDemoMode(!isDemoMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    isDemoMode ? 'bg-primary' : 'bg-white/10'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isDemoMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Emotional States Selector */}
              {isDemoMode && (
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <span className="text-[10px] uppercase tracking-widest text-primary font-bold">Atmosphere Tone</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['prestige', 'calm', 'focus'] as EmotionalState[]).map((state) => (
                      <button
                        key={state}
                        onClick={() => setEmotionalState(state)}
                        className={`py-2 rounded-lg text-[10px] uppercase tracking-wider font-bold border transition-all focus:outline-none ${
                          emotionalState === state
                            ? 'bg-primary/20 border-primary text-primary shadow-luxury'
                            : 'bg-white/5 border-white/5 text-white/50 hover:border-white/10 hover:text-white'
                        }`}
                      >
                        {state}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating HUD Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-black/80 backdrop-blur-xl border border-white/10 hover:border-primary/40 px-4 py-3 rounded-full shadow-luxury text-white hover:text-primary transition-all duration-300 group focus:outline-none"
      >
        <Sliders className="w-4 h-4 text-primary group-hover:rotate-90 transition-transform duration-500" />
        <span className="text-[10px] uppercase tracking-widest font-bold">
          {isOpen ? 'Close HUD' : 'Experience Engine'}
        </span>
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
        </div>
      </button>
    </div>
  )
}
