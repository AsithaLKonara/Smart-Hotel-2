'use client'

import { useState } from 'react'
import { X, Filter as FilterIcon, ChevronDown } from 'lucide-react'
import { Button } from './button'
import { Card } from './card'
import { Input } from './input'
import { Select } from './select'
import { Label } from './label'
import { Badge } from './badge'
import { cn } from '@/lib/utils'

export interface FilterOption {
  key: string
  label: string
  type: 'text' | 'select' | 'date' | 'number' | 'range' | 'checkbox'
  options?: { value: string; label: string }[]
  placeholder?: string
  min?: number
  max?: number
}

export interface FilterValue {
  key: string
  value: any
}

interface FilterPanelProps {
  filters: FilterOption[]
  values: Record<string, any>
  onChange: (values: Record<string, any>) => void
  onReset?: () => void
  className?: string
  collapsible?: boolean
  defaultCollapsed?: boolean
}

export function FilterPanel({
  filters,
  values,
  onChange,
  onReset,
  className,
  collapsible = false,
  defaultCollapsed = false,
}: FilterPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set())

  const handleFilterChange = (key: string, value: any) => {
    const newValues = { ...values, [key]: value }
    onChange(newValues)

    // Track active filters
    if (value && value !== '' && value !== null && value !== undefined) {
      setActiveFilters((prev) => new Set(prev).add(key))
    } else {
      setActiveFilters((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  const handleReset = () => {
    const emptyValues: Record<string, any> = {}
    filters.forEach((filter) => {
      emptyValues[filter.key] = filter.type === 'checkbox' ? false : ''
    })
    onChange(emptyValues)
    setActiveFilters(new Set())
    onReset?.()
  }

  const hasActiveFilters = activeFilters.size > 0

  const renderFilter = (filter: FilterOption) => {
    const value = values[filter.key] || ''

    switch (filter.type) {
      case 'text':
        return (
          <div key={filter.key} className="space-y-2">
            <Label htmlFor={filter.key}>{filter.label}</Label>
            <Input
              id={filter.key}
              type="text"
              placeholder={filter.placeholder || `Enter ${filter.label.toLowerCase()}`}
              value={value}
              onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            />
          </div>
        )

      case 'select':
        return (
          <div key={filter.key} className="space-y-2">
            <Label htmlFor={filter.key}>{filter.label}</Label>
            <select
              id={filter.key}
              value={value}
              onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All {filter.label}</option>
              {filter.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )

      case 'date':
        return (
          <div key={filter.key} className="space-y-2">
            <Label htmlFor={filter.key}>{filter.label}</Label>
            <Input
              id={filter.key}
              type="date"
              value={value}
              onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            />
          </div>
        )

      case 'number':
        return (
          <div key={filter.key} className="space-y-2">
            <Label htmlFor={filter.key}>{filter.label}</Label>
            <Input
              id={filter.key}
              type="number"
              placeholder={filter.placeholder}
              min={filter.min}
              max={filter.max}
              value={value}
              onChange={(e) => handleFilterChange(filter.key, e.target.value ? Number(e.target.value) : '')}
            />
          </div>
        )

      case 'range':
        return (
          <div key={filter.key} className="space-y-2">
            <Label>{filter.label}</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Min"
                min={filter.min}
                value={values[`${filter.key}_min`] || ''}
                onChange={(e) => handleFilterChange(`${filter.key}_min`, e.target.value ? Number(e.target.value) : '')}
                className="flex-1"
              />
              <span className="text-gray-500">to</span>
              <Input
                type="number"
                placeholder="Max"
                max={filter.max}
                value={values[`${filter.key}_max`] || ''}
                onChange={(e) => handleFilterChange(`${filter.key}_max`, e.target.value ? Number(e.target.value) : '')}
                className="flex-1"
              />
            </div>
          </div>
        )

      case 'checkbox':
        return (
          <div key={filter.key} className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={filter.key}
              checked={value || false}
              onChange={(e) => handleFilterChange(filter.key, e.target.checked)}
              className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
            />
            <Label htmlFor={filter.key} className="cursor-pointer">
              {filter.label}
            </Label>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Card className={cn('p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FilterIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2">
              {activeFilters.size}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-sm"
            >
              Clear All
            </Button>
          )}
          {collapsible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1"
            >
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform',
                  !isCollapsed && 'rotate-180'
                )}
              />
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Badges */}
      {hasActiveFilters && !isCollapsed && (
        <div className="flex flex-wrap gap-2 mb-4">
          {Array.from(activeFilters).map((key) => {
            const filter = filters.find((f) => f.key === key)
            if (!filter) return null

            const value = values[key]
            let displayValue = value

            if (filter.type === 'select' && filter.options) {
              const option = filter.options.find((opt) => opt.value === value)
              displayValue = option?.label || value
            }

            return (
              <Badge
                key={key}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {filter.label}: {String(displayValue)}
                <button
                  onClick={() => handleFilterChange(key, filter.type === 'checkbox' ? false : '')}
                  className="ml-1 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )
          })}
        </div>
      )}

      {/* Filter Content */}
      {!isCollapsed && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filters.map((filter) => renderFilter(filter))}
          </div>
        </div>
      )}
    </Card>
  )
}

