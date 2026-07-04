"use client"

import { useEffect, ReactNode, useRef } from 'react'
import { X } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  showCloseButton?: boolean
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
}

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
  maxWidth = '2xl',
  showCloseButton = true,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  // Handle initial focus and body scroll
  useEffect(() => {
    if (!open) return

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden'

    // Focus the first element initially
    setTimeout(() => {
      if (modalRef.current) {
        const firstElement = modalRef.current.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') as HTMLElement
        if (firstElement) firstElement.focus()
      }
    }, 10)

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [open])

  // Handle backdrop click
  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }

    if (e.key === 'Tab' && modalRef.current) {
      // Find all focusable elements, excluding disabled and hidden ones
      const focusableElements = Array.from(
        modalRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]):not(.hidden), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ) as HTMLElement[]

      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus()
          e.preventDefault()
        }
      }
    }
  }

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <Card
        className={cn(
          'w-full max-h-[90vh] overflow-y-auto',
          maxWidthClasses[maxWidth],
          className
        )}
        onClick={(e) => e.stopPropagation()} // Prevent click from bubbling to backdrop
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle id="modal-title">{title}</CardTitle>
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  )
}

