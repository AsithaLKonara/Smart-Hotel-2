"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Check, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Step {
  id: string
  title: string
  description?: string
  status: 'pending' | 'current' | 'completed'
  icon?: React.ReactNode
}

interface StepperProps {
  steps: Step[]
  currentStep: number
  onStepClick?: (stepIndex: number) => void
  orientation?: 'horizontal' | 'vertical'
  className?: string
  showConnectors?: boolean
}

export function Stepper({
  steps,
  currentStep,
  onStepClick,
  orientation = 'horizontal',
  className,
  showConnectors = true
}: StepperProps) {
  const getStepStatus = (index: number): 'pending' | 'current' | 'completed' => {
    if (index < currentStep) return 'completed'
    if (index === currentStep) return 'current'
    return 'pending'
  }

  const getStepIcon = (step: Step, index: number) => {
    const status = getStepStatus(index)
    
    if (status === 'completed') {
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center"
        >
          <Check className="w-4 h-4 text-white" />
        </motion.div>
      )
    }
    
    if (status === 'current') {
      return (
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-white font-semibold text-sm"
        >
          {step.icon || (index + 1)}
        </motion.div>
      )
    }
    
    return (
      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-semibold text-sm">
        {step.icon || (index + 1)}
      </div>
    )
  }

  const getStepClasses = (index: number) => {
    const status = getStepStatus(index)
    const isClickable = onStepClick && (status === 'completed' || status === 'current')
    
    return cn(
      "flex items-center transition-all duration-200",
      orientation === 'horizontal' ? "flex-col" : "flex-row",
      isClickable && "cursor-pointer hover:opacity-80",
      className
    )
  }

  const getConnectorClasses = (index: number) => {
    const nextStepStatus = getStepStatus(index + 1)
    const isCompleted = nextStepStatus === 'completed' || nextStepStatus === 'current'
    
    return cn(
      "transition-colors duration-300",
      orientation === 'horizontal' 
        ? "w-full h-0.5 mt-3" 
        : "w-0.5 h-8 ml-3",
      isCompleted ? "bg-amber-500" : "bg-gray-200"
    )
  }

  if (orientation === 'horizontal') {
    return (
      <div className={cn("w-full", className)}>
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex-1 flex flex-col items-center">
              <motion.div
                className={getStepClasses(index)}
                onClick={() => onStepClick?.(index)}
                whileHover={onStepClick ? { scale: 1.05 } : {}}
                whileTap={onStepClick ? { scale: 0.95 } : {}}
              >
                {getStepIcon(step, index)}
                
                <div className="mt-2 text-center">
                  <div className={cn(
                    "text-sm font-medium transition-colors",
                    getStepStatus(index) === 'completed' ? "text-amber-600" :
                    getStepStatus(index) === 'current' ? "text-amber-600" :
                    "text-gray-500"
                  )}>
                    {step.title}
                  </div>
                  {step.description && (
                    <div className="text-xs text-gray-400 mt-1">
                      {step.description}
                    </div>
                  )}
                </div>
              </motion.div>
              
              {/* Connector */}
              {showConnectors && index < steps.length - 1 && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className={getConnectorClasses(index)}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Vertical orientation
  return (
    <div className={cn("space-y-4", className)}>
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-start">
          <motion.div
            className={getStepClasses(index)}
            onClick={() => onStepClick?.(index)}
            whileHover={onStepClick ? { scale: 1.05 } : {}}
            whileTap={onStepClick ? { scale: 0.95 } : {}}
          >
            {getStepIcon(step, index)}
          </motion.div>
          
          <div className="ml-4 flex-1">
            <div className={cn(
              "text-sm font-medium transition-colors",
              getStepStatus(index) === 'completed' ? "text-amber-600" :
              getStepStatus(index) === 'current' ? "text-amber-600" :
              "text-gray-500"
            )}>
              {step.title}
            </div>
            {step.description && (
              <div className="text-xs text-gray-400 mt-1">
                {step.description}
              </div>
            )}
          </div>
          
          {/* Connector */}
          {showConnectors && index < steps.length - 1 && (
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className={getConnectorClasses(index)}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// Booking Flow Stepper Component
export function BookingStepper({ currentStep, onStepClick, className }: {
  currentStep: number
  onStepClick?: (step: number) => void
  className?: string
}) {
  const bookingSteps: Step[] = [
    {
      id: 'search',
      title: 'Search',
      description: 'Find your perfect room',
      status: 'pending',
      icon: <span>🔍</span>
    },
    {
      id: 'select',
      title: 'Select',
      description: 'Choose your room',
      status: 'pending',
      icon: <span>🏨</span>
    },
    {
      id: 'pay',
      title: 'Pay',
      description: 'Complete your booking',
      status: 'pending',
      icon: <span>💳</span>
    }
  ]

  return (
    <Stepper
      steps={bookingSteps}
      currentStep={currentStep}
      onStepClick={onStepClick}
      orientation="horizontal"
      className={className}
    />
  )
}

// Order Flow Stepper Component
export function OrderStepper({ currentStep, onStepClick, className }: {
  currentStep: number
  onStepClick?: (step: number) => void
  className?: string
}) {
  const orderSteps: Step[] = [
    {
      id: 'menu',
      title: 'Menu',
      description: 'Browse & select items',
      status: 'pending',
      icon: <span>🍽️</span>
    },
    {
      id: 'cart',
      title: 'Cart',
      description: 'Review your order',
      status: 'pending',
      icon: <span>🛒</span>
    },
    {
      id: 'checkout',
      title: 'Checkout',
      description: 'Place your order',
      status: 'pending',
      icon: <span>💳</span>
    },
    {
      id: 'tracking',
      title: 'Tracking',
      description: 'Track your order',
      status: 'pending',
      icon: <span>📱</span>
    }
  ]

  return (
    <Stepper
      steps={orderSteps}
      currentStep={currentStep}
      onStepClick={onStepClick}
      orientation="horizontal"
      className={className}
    />
  )
}
