"use client"

import { motion } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'

interface QuantityControlsProps {
  quantity: number
  onIncrease: () => void
  onDecrease: () => void
  min?: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: {
    button: 'w-6 h-6',
    icon: 'w-3 h-3',
    text: 'text-sm w-6',
  },
  md: {
    button: 'w-8 h-8',
    icon: 'w-4 h-4',
    text: 'text-sm w-8',
  },
  lg: {
    button: 'w-10 h-10',
    icon: 'w-5 h-5',
    text: 'text-base w-10',
  },
}

export function QuantityControls({ 
  quantity, 
  onIncrease, 
  onDecrease, 
  min = 0, 
  max = 99,
  size = 'md',
  className = ''
}: QuantityControlsProps) {
  if (quantity === 0) {
    return null
  }

  const { button, icon, text } = sizeClasses[size]

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onDecrease}
        disabled={quantity <= min}
        className={`${button} rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors`}
      >
        <Minus className={`${icon} text-gray-600`} />
      </motion.button>
      
      <motion.span 
        key={quantity}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        className={`${text} text-center font-medium text-gray-900`}
      >
        {quantity}
      </motion.span>
      
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onIncrease}
        disabled={quantity >= max}
        className={`${button} rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors`}
      >
        <Plus className={`${icon} text-gray-600`} />
      </motion.button>
    </div>
  )
}

export function AddToCartButton({
  quantity,
  onAdd,
  onRemove,
  size = 'md',
  className = ''
}: {
  quantity: number
  onAdd: () => void
  onRemove: () => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  if (quantity === 0) {
    return (
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onAdd}
        className={`bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors ${className}`}
      >
        Add
      </motion.button>
    )
  }

  return (
    <QuantityControls
      quantity={quantity}
      onIncrease={onAdd}
      onDecrease={onRemove}
      size={size}
      className={className}
    />
  )
}

import { motion } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'

interface QuantityControlsProps {
  quantity: number
  onIncrease: () => void
  onDecrease: () => void
  min?: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: {
    button: 'w-6 h-6',
    icon: 'w-3 h-3',
    text: 'text-sm w-6',
  },
  md: {
    button: 'w-8 h-8',
    icon: 'w-4 h-4',
    text: 'text-sm w-8',
  },
  lg: {
    button: 'w-10 h-10',
    icon: 'w-5 h-5',
    text: 'text-base w-10',
  },
}

export function QuantityControls({ 
  quantity, 
  onIncrease, 
  onDecrease, 
  min = 0, 
  max = 99,
  size = 'md',
  className = ''
}: QuantityControlsProps) {
  if (quantity === 0) {
    return null
  }

  const { button, icon, text } = sizeClasses[size]

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onDecrease}
        disabled={quantity <= min}
        className={`${button} rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors`}
      >
        <Minus className={`${icon} text-gray-600`} />
      </motion.button>
      
      <motion.span 
        key={quantity}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        className={`${text} text-center font-medium text-gray-900`}
      >
        {quantity}
      </motion.span>
      
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onIncrease}
        disabled={quantity >= max}
        className={`${button} rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors`}
      >
        <Plus className={`${icon} text-gray-600`} />
      </motion.button>
    </div>
  )
}

export function AddToCartButton({
  quantity,
  onAdd,
  onRemove,
  size = 'md',
  className = ''
}: {
  quantity: number
  onAdd: () => void
  onRemove: () => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  if (quantity === 0) {
    return (
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onAdd}
        className={`bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors ${className}`}
      >
        Add
      </motion.button>
    )
  }

  return (
    <QuantityControls
      quantity={quantity}
      onIncrease={onAdd}
      onDecrease={onRemove}
      size={size}
      className={className}
    />
  )
}

import { motion } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'

interface QuantityControlsProps {
  quantity: number
  onIncrease: () => void
  onDecrease: () => void
  min?: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: {
    button: 'w-6 h-6',
    icon: 'w-3 h-3',
    text: 'text-sm w-6',
  },
  md: {
    button: 'w-8 h-8',
    icon: 'w-4 h-4',
    text: 'text-sm w-8',
  },
  lg: {
    button: 'w-10 h-10',
    icon: 'w-5 h-5',
    text: 'text-base w-10',
  },
}

export function QuantityControls({ 
  quantity, 
  onIncrease, 
  onDecrease, 
  min = 0, 
  max = 99,
  size = 'md',
  className = ''
}: QuantityControlsProps) {
  if (quantity === 0) {
    return null
  }

  const { button, icon, text } = sizeClasses[size]

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onDecrease}
        disabled={quantity <= min}
        className={`${button} rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors`}
      >
        <Minus className={`${icon} text-gray-600`} />
      </motion.button>
      
      <motion.span 
        key={quantity}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        className={`${text} text-center font-medium text-gray-900`}
      >
        {quantity}
      </motion.span>
      
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onIncrease}
        disabled={quantity >= max}
        className={`${button} rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors`}
      >
        <Plus className={`${icon} text-gray-600`} />
      </motion.button>
    </div>
  )
}

export function AddToCartButton({
  quantity,
  onAdd,
  onRemove,
  size = 'md',
  className = ''
}: {
  quantity: number
  onAdd: () => void
  onRemove: () => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  if (quantity === 0) {
    return (
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onAdd}
        className={`bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors ${className}`}
      >
        Add
      </motion.button>
    )
  }

  return (
    <QuantityControls
      quantity={quantity}
      onIncrease={onAdd}
      onDecrease={onRemove}
      size={size}
      className={className}
    />
  )
}
