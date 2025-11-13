"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { useRef, useState } from "react"
import { Plus, Minus, Heart, Star } from "lucide-react"
import { PremiumButton } from "./premium-button"
import { cn } from "@/lib/utils"

interface MenuItemData {
  id: string
  name: string
  description: string
  price: number
  category: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'BEVERAGES' | 'SNACKS'
  imageUrl?: string
  preparationTime?: number
  available: boolean
  dietaryTags?: string[]
  isPopular?: boolean
  rating?: number
}

interface MenuItemProps {
  item: MenuItemData
  onAdd: (item: MenuItemData, quantity: number) => void
  onRemove?: (itemId: string) => void
  quantity?: number
  onFavorite?: (itemId: string) => void
  isFavorite?: boolean
  className?: string
}

export function MenuItem({ 
  item, 
  onAdd, 
  onRemove, 
  quantity = 0, 
  onFavorite,
  isFavorite = false,
  className 
}: MenuItemProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [isAdding, setIsAdding] = useState(false)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price)
  }

  const handleAdd = () => {
    setIsAdding(true)
    
    // Fly animation effect
    if (imgRef.current) {
      const img = imgRef.current
      const rect = img.getBoundingClientRect()
      
      // Create flying element
      const flyElement = img.cloneNode() as HTMLImageElement
      flyElement.style.cssText = `
        position: fixed;
        left: ${rect.left}px;
        top: ${rect.top}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        z-index: 9999;
        pointer-events: none;
        border-radius: 8px;
      `
      document.body.appendChild(flyElement)

      // Animate to cart (top-right corner)
      const cartPosition = { x: window.innerWidth - 80, y: 20 }
      
      flyElement.animate([
        { 
          transform: 'translateY(0) scale(1)',
          opacity: 1
        },
        { 
          transform: `translate(${cartPosition.x - rect.left}px, ${cartPosition.y - rect.top}px) scale(0.3)`,
          opacity: 0.8
        }
      ], {
        duration: 600,
        easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)'
      }).onfinish = () => {
        flyElement.remove()
        setIsAdding(false)
      }
    }

    onAdd(item, quantity + 1)
  }

  const handleRemove = () => {
    if (quantity > 0 && onRemove) {
      onRemove(item.id)
    }
  }

  const getDietaryColor = (tag: string) => {
    const colors = {
      vegan: 'bg-green-100 text-green-800',
      vegetarian: 'bg-green-100 text-green-800',
      glutenfree: 'bg-blue-100 text-blue-800',
      spicy: 'bg-red-100 text-red-800',
      halal: 'bg-purple-100 text-purple-800',
    }
    return colors[tag.toLowerCase() as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  // Get category-specific placeholder image
  const getCategoryPlaceholder = (category: string): string => {
    const categoryLower = category.toLowerCase()
    if (categoryLower.includes('breakfast')) {
      return '/images/hotel/food-breakfast.jpg'
    } else if (categoryLower.includes('lunch')) {
      return '/images/hotel/food-lunch.jpg'
    } else if (categoryLower.includes('dinner') || categoryLower.includes('main')) {
      return '/images/hotel/food-dinner.jpg'
    } else if (categoryLower.includes('dessert')) {
      return '/images/hotel/food-dessert.jpg'
    } else if (categoryLower.includes('beverage') || categoryLower.includes('drink')) {
      return '/images/hotel/hotel-bar.jpg'
    }
    return '/images/menu-placeholder.jpg'
  }

  const displayImageUrl = item.imageUrl || getCategoryPlaceholder(item.category)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        "group bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300",
        !item.available && "opacity-60",
        className
      )}
    >
      <div className="flex gap-4">
        {/* Image */}
        <div className="relative flex-shrink-0">
          <div className="relative w-20 h-20 rounded-lg overflow-hidden">
            <Image
              ref={imgRef}
              src={displayImageUrl}
              alt={item.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              onError={(e) => {
                // Fallback to category-specific placeholder if image fails to load
                const target = e.target as HTMLImageElement
                target.src = getCategoryPlaceholder(item.category)
              }}
            />
          </div>
          
          {/* Popular Badge */}
          {item.isPopular && (
            <div className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              Popular
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 group-hover:text-amber-600 transition-colors">
                {item.name}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                {item.description}
              </p>
            </div>
            
            {/* Favorite Button */}
            {onFavorite && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="ml-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                onClick={() => onFavorite(item.id)}
              >
                <Heart 
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isFavorite ? "fill-red-500 text-red-500" : "text-gray-400 hover:text-red-500"
                  )} 
                />
              </motion.button>
            )}
          </div>

          {/* Rating & Preparation Time */}
          <div className="flex items-center gap-4 mb-3">
            {item.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-medium text-gray-700">{item.rating}</span>
              </div>
            )}
            
            {item.preparationTime && (
              <div className="text-sm text-gray-500">
                ⏱️ {item.preparationTime} min
              </div>
            )}
          </div>

          {/* Dietary Tags */}
          {item.dietaryTags && item.dietaryTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {item.dietaryTags.map((tag) => (
                <span
                  key={tag}
                  className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    getDietaryColor(tag)
                  )}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Price & Actions */}
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold text-gray-900">
              {formatPrice(item.price)}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Quantity Controls */}
              {quantity > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2"
                >
                  <button
                    onClick={handleRemove}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-4 h-4 text-gray-600" />
                  </button>
                  
                  <span className="w-8 text-center font-medium text-gray-900">
                    {quantity}
                  </span>
                  
                  <button
                    onClick={handleAdd}
                    className="w-8 h-8 rounded-full bg-amber-100 hover:bg-amber-200 flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-4 h-4 text-amber-600" />
                  </button>
                </motion.div>
              )}
              
              {/* Add Button */}
              {quantity === 0 && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <PremiumButton
                    onClick={handleAdd}
                    variant="primary"
                    size="sm"
                    disabled={!item.available || isAdding}
                    icon={<Plus className="w-4 h-4" />}
                    className="px-4"
                  >
                    {isAdding ? 'Adding...' : 'Add'}
                  </PremiumButton>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

