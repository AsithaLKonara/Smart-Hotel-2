"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"
import { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { cn } from "@/lib/utils"

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  warning: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto remove after duration
    const duration = toast.duration || 5000
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }, [removeToast])

  const success = useCallback((title: string, description?: string) => {
    addToast({ type: 'success', title, description })
  }, [addToast])

  const error = useCallback((title: string, description?: string) => {
    addToast({ type: 'error', title, description })
  }, [addToast])

  const warning = useCallback((title: string, description?: string) => {
    addToast({ type: 'warning', title, description })
  }, [addToast])

  const info = useCallback((title: string, description?: string) => {
    addToast({ type: 'info', title, description })
  }, [addToast])

  return (
    <ToastContext.Provider value={{
      toasts,
      addToast,
      removeToast,
      success,
      error,
      warning,
      info
    }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onRemove={onRemove}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

interface ToastItemProps {
  toast: Toast
  onRemove: (id: string) => void
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const getToastIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />
    }
  }

  const getToastClasses = () => {
    const baseClasses = "bg-white border shadow-lg rounded-xl p-4 max-w-sm w-full"
    
    switch (toast.type) {
      case 'success':
        return cn(baseClasses, "border-green-200")
      case 'error':
        return cn(baseClasses, "border-red-200")
      case 'warning':
        return cn(baseClasses, "border-yellow-200")
      case 'info':
        return cn(baseClasses, "border-blue-200")
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={getToastClasses()}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getToastIcon()}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900">
            {toast.title}
          </h4>
          {toast.description && (
            <p className="text-sm text-gray-600 mt-1">
              {toast.description}
            </p>
          )}
          
          {/* Action Button */}
          {toast.action && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toast.action.onClick}
              className="mt-2 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
            >
              {toast.action.label}
            </motion.button>
          )}
        </div>
        
        {/* Close Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onRemove(toast.id)}
          className="flex-shrink-0 p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </motion.button>
      </div>
    </motion.div>
  )
}

// Real-time Toast Component for Order Updates
export function OrderToast({ orderId, status, onViewOrder }: {
  orderId: string
  status: 'received' | 'preparing' | 'ready' | 'delivered'
  onViewOrder?: () => void
}) {
  const { addToast } = useToast()
  
  const getStatusConfig = () => {
    switch (status) {
      case 'received':
        return {
          type: 'info' as const,
          title: 'Order Received',
          description: `Order #${orderId} has been received and is being prepared.`
        }
      case 'preparing':
        return {
          type: 'info' as const,
          title: 'Order in Progress',
          description: `Order #${orderId} is being prepared by our kitchen team.`
        }
      case 'ready':
        return {
          type: 'success' as const,
          title: 'Order Ready',
          description: `Order #${orderId} is ready for delivery!`
        }
      case 'delivered':
        return {
          type: 'success' as const,
          title: 'Order Delivered',
          description: `Order #${orderId} has been delivered to your room.`
        }
    }
  }

  const config = getStatusConfig()
  
  const showToast = () => {
    addToast({
      ...config,
      action: onViewOrder ? {
        label: 'View Order',
        onClick: onViewOrder
      } : undefined,
      duration: 8000
    })
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={showToast}
      className="px-4 py-2 bg-amber-500 text-white rounded-lg font-medium"
    >
      Show Order Update
    </motion.button>
  )
}

// Booking Confirmation Toast
export function BookingToast({ bookingId, onViewBooking }: {
  bookingId: string
  onViewBooking?: () => void
}) {
  const { addToast } = useToast()
  
  const showToast = () => {
    addToast({
      type: 'success',
      title: 'Booking Confirmed!',
      description: `Your booking #${bookingId} has been confirmed. Welcome to SmartHotel!`,
      action: onViewBooking ? {
        label: 'View Booking',
        onClick: onViewBooking
      } : undefined,
      duration: 10000
    })
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={showToast}
      className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium"
    >
      Show Booking Confirmation
    </motion.button>
  )
}
