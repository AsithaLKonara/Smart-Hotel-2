'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface PremiumSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: string
  className?: string
  text?: string
}

export function PremiumSpinner({ 
  size = 'md', 
  color = 'text-amber-600', 
  className,
  text 
}: PremiumSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
    xl: 'w-24 h-24 border-4',
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className="relative">
        {/* Outer glow */}
        <div className={cn(
          "absolute inset-0 rounded-full blur-xl opacity-20 animate-pulse",
          color.replace('text-', 'bg-')
        )} />
        
        {/* Spinner */}
        <div 
          className={cn(
            "animate-spin rounded-full border-t-transparent border-current",
            sizeClasses[size],
            color
          )}
          style={{ borderRightColor: 'transparent' }}
        />
        
        {/* Inner static ring */}
        <div className={cn(
          "absolute inset-0 rounded-full border-current opacity-10",
          sizeClasses[size],
          color
        )} />
      </div>
      
      {text && (
        <p className={cn(
          "text-xs uppercase tracking-[0.3em] font-bold animate-pulse",
          color
        )}>
          {text}
        </p>
      )}
    </div>
  )
}

export function LoadingOverlay({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
      <PremiumSpinner size="lg" text={text} />
    </div>
  )
}
