"use client"

interface DietaryTagProps {
  tag: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const tagStyles = {
  vegan: 'bg-green-100 text-green-800 border-green-200',
  vegetarian: 'bg-green-50 text-green-700 border-green-100',
  'gluten-free': 'bg-blue-100 text-blue-800 border-blue-200',
  'gluten free': 'bg-blue-100 text-blue-800 border-blue-200',
  spicy: 'bg-red-100 text-red-800 border-red-200',
  healthy: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  organic: 'bg-green-100 text-green-800 border-green-200',
  halal: 'bg-purple-100 text-purple-800 border-purple-200',
  kosher: 'bg-blue-100 text-blue-800 border-blue-200',
  dairy: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'dairy-free': 'bg-orange-100 text-orange-800 border-orange-200',
  'dairy free': 'bg-orange-100 text-orange-800 border-orange-200',
  nut: 'bg-amber-100 text-amber-800 border-amber-200',
  'nut-free': 'bg-amber-100 text-amber-800 border-amber-200',
  'nut free': 'bg-amber-100 text-amber-800 border-amber-200',
}

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-2 py-1 text-xs',
  lg: 'px-3 py-1 text-sm',
}

export function DietaryTag({ tag, size = 'sm', className = '' }: DietaryTagProps) {
  const normalizedTag = tag.toLowerCase()
  const style = tagStyles[normalizedTag as keyof typeof tagStyles] || 'bg-gray-100 text-gray-800 border-gray-200'
  
  return (
    <span 
      className={`inline-flex items-center font-medium rounded-full border ${sizeClasses[size]} ${style} ${className}`}
    >
      {tag}
    </span>
  )
}

export function DietaryTagList({ 
  tags, 
  maxItems = 3, 
  size = 'sm' 
}: { 
  tags: string[]
  maxItems?: number
  size?: 'sm' | 'md' | 'lg'
}) {
  if (!tags || tags.length === 0) return null

  const visibleTags = tags.slice(0, maxItems)
  const remainingCount = tags.length - maxItems

  return (
    <div className="flex gap-1 flex-wrap">
      {visibleTags.map(tag => (
        <DietaryTag key={tag} tag={tag} size={size} />
      ))}
      {remainingCount > 0 && (
        <DietaryTag tag={`+${remainingCount}`} size={size} />
      )}
    </div>
  )
}

interface DietaryTagProps {
  tag: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const tagStyles = {
  vegan: 'bg-green-100 text-green-800 border-green-200',
  vegetarian: 'bg-green-50 text-green-700 border-green-100',
  'gluten-free': 'bg-blue-100 text-blue-800 border-blue-200',
  'gluten free': 'bg-blue-100 text-blue-800 border-blue-200',
  spicy: 'bg-red-100 text-red-800 border-red-200',
  healthy: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  organic: 'bg-green-100 text-green-800 border-green-200',
  halal: 'bg-purple-100 text-purple-800 border-purple-200',
  kosher: 'bg-blue-100 text-blue-800 border-blue-200',
  dairy: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'dairy-free': 'bg-orange-100 text-orange-800 border-orange-200',
  'dairy free': 'bg-orange-100 text-orange-800 border-orange-200',
  nut: 'bg-amber-100 text-amber-800 border-amber-200',
  'nut-free': 'bg-amber-100 text-amber-800 border-amber-200',
  'nut free': 'bg-amber-100 text-amber-800 border-amber-200',
}

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-2 py-1 text-xs',
  lg: 'px-3 py-1 text-sm',
}

export function DietaryTag({ tag, size = 'sm', className = '' }: DietaryTagProps) {
  const normalizedTag = tag.toLowerCase()
  const style = tagStyles[normalizedTag as keyof typeof tagStyles] || 'bg-gray-100 text-gray-800 border-gray-200'
  
  return (
    <span 
      className={`inline-flex items-center font-medium rounded-full border ${sizeClasses[size]} ${style} ${className}`}
    >
      {tag}
    </span>
  )
}

export function DietaryTagList({ 
  tags, 
  maxItems = 3, 
  size = 'sm' 
}: { 
  tags: string[]
  maxItems?: number
  size?: 'sm' | 'md' | 'lg'
}) {
  if (!tags || tags.length === 0) return null

  const visibleTags = tags.slice(0, maxItems)
  const remainingCount = tags.length - maxItems

  return (
    <div className="flex gap-1 flex-wrap">
      {visibleTags.map(tag => (
        <DietaryTag key={tag} tag={tag} size={size} />
      ))}
      {remainingCount > 0 && (
        <DietaryTag tag={`+${remainingCount}`} size={size} />
      )}
    </div>
  )
}

interface DietaryTagProps {
  tag: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const tagStyles = {
  vegan: 'bg-green-100 text-green-800 border-green-200',
  vegetarian: 'bg-green-50 text-green-700 border-green-100',
  'gluten-free': 'bg-blue-100 text-blue-800 border-blue-200',
  'gluten free': 'bg-blue-100 text-blue-800 border-blue-200',
  spicy: 'bg-red-100 text-red-800 border-red-200',
  healthy: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  organic: 'bg-green-100 text-green-800 border-green-200',
  halal: 'bg-purple-100 text-purple-800 border-purple-200',
  kosher: 'bg-blue-100 text-blue-800 border-blue-200',
  dairy: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'dairy-free': 'bg-orange-100 text-orange-800 border-orange-200',
  'dairy free': 'bg-orange-100 text-orange-800 border-orange-200',
  nut: 'bg-amber-100 text-amber-800 border-amber-200',
  'nut-free': 'bg-amber-100 text-amber-800 border-amber-200',
  'nut free': 'bg-amber-100 text-amber-800 border-amber-200',
}

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-2 py-1 text-xs',
  lg: 'px-3 py-1 text-sm',
}

export function DietaryTag({ tag, size = 'sm', className = '' }: DietaryTagProps) {
  const normalizedTag = tag.toLowerCase()
  const style = tagStyles[normalizedTag as keyof typeof tagStyles] || 'bg-gray-100 text-gray-800 border-gray-200'
  
  return (
    <span 
      className={`inline-flex items-center font-medium rounded-full border ${sizeClasses[size]} ${style} ${className}`}
    >
      {tag}
    </span>
  )
}

export function DietaryTagList({ 
  tags, 
  maxItems = 3, 
  size = 'sm' 
}: { 
  tags: string[]
  maxItems?: number
  size?: 'sm' | 'md' | 'lg'
}) {
  if (!tags || tags.length === 0) return null

  const visibleTags = tags.slice(0, maxItems)
  const remainingCount = tags.length - maxItems

  return (
    <div className="flex gap-1 flex-wrap">
      {visibleTags.map(tag => (
        <DietaryTag key={tag} tag={tag} size={size} />
      ))}
      {remainingCount > 0 && (
        <DietaryTag tag={`+${remainingCount}`} size={size} />
      )}
    </div>
  )
}
