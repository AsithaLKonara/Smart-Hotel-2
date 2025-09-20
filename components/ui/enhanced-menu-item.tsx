"use client"

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Star, Clock, Heart } from 'lucide-react'
import { DietaryTagList } from './dietary-tag'
import { AddToCartButton } from './quantity-controls'
import { useState } from 'react'

interface EnhancedMenuItemProps {
  item: {
    id: string
    name: string
    description: string
    price: number
    imageUrl?: string
    rating?: number
    preparationTime?: number
    isPopular?: boolean
    dietaryTags?: string[]
    category?: string
  }
  onAdd: (item: any, quantity: number) => void
  quantity?: number
  onFavorite?: (itemId: string) => void
  isFavorite?: boolean
}

export function EnhancedMenuItem({ 
  item, 
  onAdd, 
  quantity = 0, 
  onFavorite,
  isFavorite = false 
}: EnhancedMenuItemProps) {
  const [isLiked, setIsLiked] = useState(isFavorite)

  const handleAddToCart = () => {
    onAdd(item, quantity + 1)
  }

  const handleRemoveFromCart = () => {
    if (quantity > 0) {
      onAdd(item, quantity - 1)
    }
  }

  const handleFavorite = () => {
    setIsLiked(!isLiked)
    onFavorite?.(item.id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="group bg-white rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100"
    >
      <div className="flex gap-4">
        {/* Enhanced Image */}
        <div className="relative flex-shrink-0">
          <div className="w-24 h-24 rounded-xl overflow-hidden">
            <Image
              src={item.imageUrl || '/images/menu-placeholder.jpg'}
              alt={item.name}
              width={96}
              height={96}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          </div>
          
          {/* Dietary Tags */}
          {item.dietaryTags && item.dietaryTags.length > 0 && (
            <div className="absolute -top-2 -right-2">
              <DietaryTagList tags={item.dietaryTags} maxItems={1} size="sm" />
            </div>
          )}
          
          {/* Popular Badge */}
          {item.isPopular && (
            <div className="absolute top-1 left-1">
              <span className="px-2 py-1 text-xs font-medium bg-amber-500 text-white rounded-full shadow-sm">
                Chef's Choice
              </span>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg group-hover:text-amber-600 transition-colors line-clamp-1">
              {item.name}
            </h3>
            <button
              onClick={handleFavorite}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'} transition-colors`} />
            </button>
          </div>
          
          <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
          
          {/* Rating and Preparation Time */}
          <div className="flex items-center gap-4 mb-3">
            {item.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium text-gray-700">{item.rating}</span>
              </div>
            )}
            {item.preparationTime && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{item.preparationTime} min</span>
              </div>
            )}
          </div>

          {/* Dietary Tags */}
          {item.dietaryTags && item.dietaryTags.length > 0 && (
            <div className="mb-3">
              <DietaryTagList tags={item.dietaryTags} maxItems={3} size="sm" />
            </div>
          )}
          
          {/* Price and Actions */}
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xl font-bold text-gray-900">
                ${item.price.toFixed(2)}
              </span>
            </div>
            
            <AddToCartButton
              quantity={quantity}
              onAdd={handleAddToCart}
              onRemove={handleRemoveFromCart}
              size="md"
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function MenuItemGrid({ 
  items, 
  onAddToCart, 
  cartItems = {},
  onFavorite 
}: {
  items: any[]
  onAddToCart: (item: any, quantity: number) => void
  cartItems?: Record<string, number>
  onFavorite?: (itemId: string) => void
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <EnhancedMenuItem
            item={item}
            onAdd={onAddToCart}
            quantity={cartItems[item.id] || 0}
            onFavorite={onFavorite}
          />
        </motion.div>
      ))}
    </div>
  )
}

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Star, Clock, Heart } from 'lucide-react'
import { DietaryTagList } from './dietary-tag'
import { AddToCartButton } from './quantity-controls'
import { useState } from 'react'

interface EnhancedMenuItemProps {
  item: {
    id: string
    name: string
    description: string
    price: number
    imageUrl?: string
    rating?: number
    preparationTime?: number
    isPopular?: boolean
    dietaryTags?: string[]
    category?: string
  }
  onAdd: (item: any, quantity: number) => void
  quantity?: number
  onFavorite?: (itemId: string) => void
  isFavorite?: boolean
}

export function EnhancedMenuItem({ 
  item, 
  onAdd, 
  quantity = 0, 
  onFavorite,
  isFavorite = false 
}: EnhancedMenuItemProps) {
  const [isLiked, setIsLiked] = useState(isFavorite)

  const handleAddToCart = () => {
    onAdd(item, quantity + 1)
  }

  const handleRemoveFromCart = () => {
    if (quantity > 0) {
      onAdd(item, quantity - 1)
    }
  }

  const handleFavorite = () => {
    setIsLiked(!isLiked)
    onFavorite?.(item.id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="group bg-white rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100"
    >
      <div className="flex gap-4">
        {/* Enhanced Image */}
        <div className="relative flex-shrink-0">
          <div className="w-24 h-24 rounded-xl overflow-hidden">
            <Image
              src={item.imageUrl || '/images/menu-placeholder.jpg'}
              alt={item.name}
              width={96}
              height={96}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          </div>
          
          {/* Dietary Tags */}
          {item.dietaryTags && item.dietaryTags.length > 0 && (
            <div className="absolute -top-2 -right-2">
              <DietaryTagList tags={item.dietaryTags} maxItems={1} size="sm" />
            </div>
          )}
          
          {/* Popular Badge */}
          {item.isPopular && (
            <div className="absolute top-1 left-1">
              <span className="px-2 py-1 text-xs font-medium bg-amber-500 text-white rounded-full shadow-sm">
                Chef's Choice
              </span>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg group-hover:text-amber-600 transition-colors line-clamp-1">
              {item.name}
            </h3>
            <button
              onClick={handleFavorite}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'} transition-colors`} />
            </button>
          </div>
          
          <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
          
          {/* Rating and Preparation Time */}
          <div className="flex items-center gap-4 mb-3">
            {item.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium text-gray-700">{item.rating}</span>
              </div>
            )}
            {item.preparationTime && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{item.preparationTime} min</span>
              </div>
            )}
          </div>

          {/* Dietary Tags */}
          {item.dietaryTags && item.dietaryTags.length > 0 && (
            <div className="mb-3">
              <DietaryTagList tags={item.dietaryTags} maxItems={3} size="sm" />
            </div>
          )}
          
          {/* Price and Actions */}
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xl font-bold text-gray-900">
                ${item.price.toFixed(2)}
              </span>
            </div>
            
            <AddToCartButton
              quantity={quantity}
              onAdd={handleAddToCart}
              onRemove={handleRemoveFromCart}
              size="md"
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function MenuItemGrid({ 
  items, 
  onAddToCart, 
  cartItems = {},
  onFavorite 
}: {
  items: any[]
  onAddToCart: (item: any, quantity: number) => void
  cartItems?: Record<string, number>
  onFavorite?: (itemId: string) => void
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <EnhancedMenuItem
            item={item}
            onAdd={onAddToCart}
            quantity={cartItems[item.id] || 0}
            onFavorite={onFavorite}
          />
        </motion.div>
      ))}
    </div>
  )
}

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Star, Clock, Heart } from 'lucide-react'
import { DietaryTagList } from './dietary-tag'
import { AddToCartButton } from './quantity-controls'
import { useState } from 'react'

interface EnhancedMenuItemProps {
  item: {
    id: string
    name: string
    description: string
    price: number
    imageUrl?: string
    rating?: number
    preparationTime?: number
    isPopular?: boolean
    dietaryTags?: string[]
    category?: string
  }
  onAdd: (item: any, quantity: number) => void
  quantity?: number
  onFavorite?: (itemId: string) => void
  isFavorite?: boolean
}

export function EnhancedMenuItem({ 
  item, 
  onAdd, 
  quantity = 0, 
  onFavorite,
  isFavorite = false 
}: EnhancedMenuItemProps) {
  const [isLiked, setIsLiked] = useState(isFavorite)

  const handleAddToCart = () => {
    onAdd(item, quantity + 1)
  }

  const handleRemoveFromCart = () => {
    if (quantity > 0) {
      onAdd(item, quantity - 1)
    }
  }

  const handleFavorite = () => {
    setIsLiked(!isLiked)
    onFavorite?.(item.id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="group bg-white rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100"
    >
      <div className="flex gap-4">
        {/* Enhanced Image */}
        <div className="relative flex-shrink-0">
          <div className="w-24 h-24 rounded-xl overflow-hidden">
            <Image
              src={item.imageUrl || '/images/menu-placeholder.jpg'}
              alt={item.name}
              width={96}
              height={96}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          </div>
          
          {/* Dietary Tags */}
          {item.dietaryTags && item.dietaryTags.length > 0 && (
            <div className="absolute -top-2 -right-2">
              <DietaryTagList tags={item.dietaryTags} maxItems={1} size="sm" />
            </div>
          )}
          
          {/* Popular Badge */}
          {item.isPopular && (
            <div className="absolute top-1 left-1">
              <span className="px-2 py-1 text-xs font-medium bg-amber-500 text-white rounded-full shadow-sm">
                Chef's Choice
              </span>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg group-hover:text-amber-600 transition-colors line-clamp-1">
              {item.name}
            </h3>
            <button
              onClick={handleFavorite}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'} transition-colors`} />
            </button>
          </div>
          
          <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
          
          {/* Rating and Preparation Time */}
          <div className="flex items-center gap-4 mb-3">
            {item.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium text-gray-700">{item.rating}</span>
              </div>
            )}
            {item.preparationTime && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{item.preparationTime} min</span>
              </div>
            )}
          </div>

          {/* Dietary Tags */}
          {item.dietaryTags && item.dietaryTags.length > 0 && (
            <div className="mb-3">
              <DietaryTagList tags={item.dietaryTags} maxItems={3} size="sm" />
            </div>
          )}
          
          {/* Price and Actions */}
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xl font-bold text-gray-900">
                ${item.price.toFixed(2)}
              </span>
            </div>
            
            <AddToCartButton
              quantity={quantity}
              onAdd={handleAddToCart}
              onRemove={handleRemoveFromCart}
              size="md"
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function MenuItemGrid({ 
  items, 
  onAddToCart, 
  cartItems = {},
  onFavorite 
}: {
  items: any[]
  onAddToCart: (item: any, quantity: number) => void
  cartItems?: Record<string, number>
  onFavorite?: (itemId: string) => void
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <EnhancedMenuItem
            item={item}
            onAdd={onAddToCart}
            quantity={cartItems[item.id] || 0}
            onFavorite={onFavorite}
          />
        </motion.div>
      ))}
    </div>
  )
}
