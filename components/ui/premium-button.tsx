"use client"

import { motion } from "framer-motion"
import { ButtonHTMLAttributes, forwardRef } from "react"
import { cn } from "@/lib/utils"
import { motionVariants } from "@/lib/design-tokens"

interface PremiumButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'tertiary' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  animate?: boolean
}

const PremiumButton = forwardRef<HTMLButtonElement, PremiumButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    loading = false,
    icon,
    iconPosition = 'left',
    animate = true,
    children, 
    disabled,
    ...props 
  }, ref) => {
    const baseClasses = "relative inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
    
    const variants = {
      primary: "bg-amber-700 hover:bg-amber-800 text-white shadow-lg hover:shadow-xl focus:ring-amber-700",
      secondary: "bg-teal-500 hover:bg-teal-600 text-white shadow-lg hover:shadow-xl focus:ring-teal-500",
      ghost: "bg-transparent hover:bg-gray-100 text-gray-700 hover:text-gray-900 focus:ring-gray-500",
      outline: "border-2 border-gray-300 hover:border-amber-500 text-gray-700 hover:text-amber-600 focus:ring-amber-500",
      tertiary: "bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 focus:ring-gray-500",
      success: "bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl focus:ring-green-500"
    }
    
    const sizes = {
      sm: "h-8 px-3 text-sm rounded-lg",
      md: "h-10 px-4 text-base rounded-lg",
      lg: "h-12 px-6 text-lg rounded-xl"
    }

    const buttonContent = (
      <>
        {loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </motion.div>
        )}
        
        <div className={cn("flex items-center gap-2", loading && "opacity-0")}>
          {icon && iconPosition === 'left' && (
            <motion.span
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              {icon}
            </motion.span>
          )}
          
          <span>{children}</span>
          
          {icon && iconPosition === 'right' && (
            <motion.span
              initial={{ opacity: 0, x: 4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              {icon}
            </motion.span>
          )}
        </div>
      </>
    )

    if (animate) {
      return (
        <motion.button
          ref={ref}
          className={cn(baseClasses, variants[variant], sizes[size], className)}
          disabled={disabled || loading}
          whileHover={motionVariants.hover}
          whileTap={motionVariants.tap}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={props.onClick}
          type={props.type}
          form={props.form}
        >
          {buttonContent}
        </motion.button>
      )
    }

    return (
      <button
        ref={ref}
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {buttonContent}
      </button>
    )
  }
)

PremiumButton.displayName = "PremiumButton"

export { PremiumButton }

