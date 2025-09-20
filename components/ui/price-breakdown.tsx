"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { ChevronDown, ChevronUp, Calculator } from "lucide-react"
import { cn } from "@/lib/utils"

interface PriceItem {
  label: string
  amount: number
  type?: 'base' | 'extra' | 'tax' | 'discount'
  description?: string
}

interface PriceBreakdownProps {
  items: PriceItem[]
  total: number
  currency?: string
  showBreakdown?: boolean
  className?: string
}

export function PriceBreakdown({
  items,
  total,
  currency = 'USD',
  showBreakdown = true,
  className
}: PriceBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const getItemColor = (type: PriceItem['type']) => {
    switch (type) {
      case 'base':
        return 'text-gray-900'
      case 'extra':
        return 'text-amber-600'
      case 'tax':
        return 'text-gray-600'
      case 'discount':
        return 'text-green-600'
      default:
        return 'text-gray-700'
    }
  }

  const baseItems = items.filter(item => item.type === 'base')
  const extraItems = items.filter(item => item.type === 'extra')
  const taxItems = items.filter(item => item.type === 'tax')
  const discountItems = items.filter(item => item.type === 'discount')

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn("bg-white rounded-xl border border-gray-100 p-4", className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-amber-600" />
          <h3 className="font-semibold text-gray-900">Price Breakdown</h3>
        </div>
        
        {showBreakdown && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            {isExpanded ? 'Hide' : 'Show'} Details
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </motion.button>
        )}
      </div>

      {/* Quick Summary */}
      <div className="space-y-2 mb-4">
        {baseItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex justify-between items-center"
          >
            <span className="font-medium text-gray-900">{item.label}</span>
            <span className="font-semibold text-gray-900">{formatCurrency(item.amount)}</span>
          </motion.div>
        ))}
      </div>

      {/* Detailed Breakdown */}
      <AnimatePresence>
        {isExpanded && showBreakdown && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="border-t border-gray-100 pt-4 space-y-3"
          >
            {/* Extras */}
            {extraItems.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Extras</h4>
                <div className="space-y-2">
                  {extraItems.map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex justify-between items-center text-sm"
                    >
                      <div>
                        <span className="text-gray-600">{item.label}</span>
                        {item.description && (
                          <div className="text-xs text-gray-500">{item.description}</div>
                        )}
                      </div>
                      <span className={getItemColor(item.type)}>+{formatCurrency(item.amount)}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Discounts */}
            {discountItems.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Discounts</h4>
                <div className="space-y-2">
                  {discountItems.map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex justify-between items-center text-sm"
                    >
                      <div>
                        <span className="text-gray-600">{item.label}</span>
                        {item.description && (
                          <div className="text-xs text-gray-500">{item.description}</div>
                        )}
                      </div>
                      <span className="text-green-600">-{formatCurrency(Math.abs(item.amount))}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Taxes */}
            {taxItems.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Taxes & Fees</h4>
                <div className="space-y-2">
                  {taxItems.map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex justify-between items-center text-sm"
                    >
                      <div>
                        <span className="text-gray-600">{item.label}</span>
                        {item.description && (
                          <div className="text-xs text-gray-500">{item.description}</div>
                        )}
                      </div>
                      <span className={getItemColor(item.type)}>{formatCurrency(item.amount)}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Total */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="border-t border-gray-200 pt-4 mt-4"
      >
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-900">Total</span>
          <motion.span
            key={total}
            initial={{ scale: 1.1, color: '#f59e0b' }}
            animate={{ scale: 1, color: '#111827' }}
            transition={{ duration: 0.3 }}
            className="text-xl font-bold text-amber-600"
          >
            {formatCurrency(total)}
          </motion.span>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Animated Price Change Component
export function AnimatedPriceChange({ 
  oldPrice, 
  newPrice, 
  className 
}: { 
  oldPrice: number
  newPrice: number
  className?: string 
}) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const difference = newPrice - oldPrice
  const isIncrease = difference > 0

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn("relative", className)}
    >
      {/* Old Price */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 0.5 }}
        className="text-lg text-gray-400 line-through"
      >
        {formatCurrency(oldPrice)}
      </motion.div>

      {/* New Price */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="text-2xl font-bold text-amber-600"
      >
        {formatCurrency(newPrice)}
      </motion.div>

      {/* Price Change Indicator */}
      <AnimatePresence>
        {difference !== 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className={cn(
              "absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-medium",
              isIncrease 
                ? "bg-red-100 text-red-600" 
                : "bg-green-100 text-green-600"
            )}
          >
            {isIncrease ? '+' : ''}{formatCurrency(Math.abs(difference))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Price Comparison Component
export function PriceComparison({ 
  prices, 
  selectedIndex, 
  onSelect,
  className 
}: { 
  prices: { label: string; amount: number; description?: string }[]
  selectedIndex: number
  onSelect: (index: number) => void
  className?: string 
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {prices.map((price, index) => (
        <motion.button
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(index)}
          className={cn(
            "w-full p-4 rounded-xl border-2 transition-all text-left",
            selectedIndex === index
              ? "border-amber-500 bg-amber-50"
              : "border-gray-200 hover:border-amber-300 bg-white"
          )}
        >
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium text-gray-900">{price.label}</div>
              {price.description && (
                <div className="text-sm text-gray-500">{price.description}</div>
              )}
            </div>
            <div className="text-xl font-bold text-amber-600">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
              }).format(price.amount)}
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  )
}