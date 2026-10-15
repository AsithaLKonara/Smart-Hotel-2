"use client"

import React, { useState, createContext, useContext, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, AlertCircle, CheckCircle, Info, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface ConfirmDialogOptions {
  title: string
  description?: string
  message?: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'primary' | 'success'
  isDestructive?: boolean
}

export type LuxuryConfirmFn = ((options: ConfirmDialogOptions) => Promise<boolean>) & {
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>
}

const LuxuryConfirmContext = createContext<LuxuryConfirmFn | null>(null)

export function LuxuryConfirmProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmDialogOptions>({
    title: '',
    description: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'danger'
  })
  const [resolver, setResolver] = useState<((val: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmDialogOptions): Promise<boolean> => {
    const desc = opts.description || opts.message || ''
    const variant = opts.variant || (opts.isDestructive ? 'danger' : 'primary')
    setOptions({
      title: opts.title,
      description: desc,
      confirmText: opts.confirmText || 'Confirm',
      cancelText: opts.cancelText || 'Cancel',
      variant
    })
    setIsOpen(true)

    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve)
    })
  }, [])

  const callable = confirm as LuxuryConfirmFn
  callable.confirm = confirm

  const handleConfirm = () => {
    setIsOpen(false)
    if (resolver) resolver(true)
  }

  const handleCancel = () => {
    setIsOpen(false)
    if (resolver) resolver(false)
  }

  const getVariantIcon = () => {
    switch (options.variant) {
      case 'danger':
        return <AlertTriangle className="w-6 h-6 text-rose-400" />
      case 'warning':
        return <AlertCircle className="w-6 h-6 text-amber-400" />
      case 'success':
        return <CheckCircle className="w-6 h-6 text-emerald-400" />
      default:
        return <Info className="w-6 h-6 text-primary" />
    }
  }

  const getConfirmButtonClasses = () => {
    switch (options.variant) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/30'
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/30'
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
      default:
        return 'bg-gold-gradient text-white shadow-luxury'
    }
  }

  return (
    <LuxuryConfirmContext.Provider value={callable}>
      {children}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancel}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Window */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full max-w-md bg-[#111116] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Subtle Ambient Gold / Red Glow */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl shrink-0 ${
                  options.variant === 'danger' ? 'bg-rose-500/10 border border-rose-500/20' :
                  options.variant === 'warning' ? 'bg-amber-500/10 border border-amber-500/20' :
                  options.variant === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20' :
                  'bg-primary/10 border border-primary/20'
                }`}>
                  {getVariantIcon()}
                </div>

                <div className="space-y-1.5 flex-1 pr-6">
                  <h3 className="text-lg font-serif font-bold text-white tracking-wide">
                    {options.title}
                  </h3>
                  <p className="text-sm text-white/60 font-light leading-relaxed">
                    {options.description}
                  </p>
                </div>

                <button
                  onClick={handleCancel}
                  className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="border-white/10 text-white/70 hover:text-white hover:bg-white/5 h-10 px-5 rounded-xl text-xs uppercase tracking-wider font-bold"
                >
                  {options.cancelText}
                </Button>
                <Button
                  onClick={handleConfirm}
                  className={`h-10 px-6 rounded-xl text-xs uppercase tracking-wider font-bold border-none transition-all ${getConfirmButtonClasses()}`}
                >
                  {options.confirmText}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </LuxuryConfirmContext.Provider>
  )
}

export function useLuxuryConfirm(): LuxuryConfirmFn {
  const context = useContext(LuxuryConfirmContext)
  if (!context) {
    // Graceful fallback if invoked outside provider
    const fallback = (async (opts: ConfirmDialogOptions) => {
      if (typeof window !== 'undefined') {
        return window.confirm(`${opts.title}\n\n${opts.description || opts.message || ''}`)
      }
      return false
    }) as LuxuryConfirmFn
    fallback.confirm = fallback
    return fallback
  }
  return context
}
