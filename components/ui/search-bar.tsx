'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, Loader2, Clock, TrendingUp } from 'lucide-react'
import { Input } from './input'
import { Card } from './card'
import { Badge } from './badge'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export interface SearchResult {
  id: string
  type: 'room' | 'booking' | 'order' | 'staff' | 'task' | 'menu'
  title: string
  description?: string
  url: string
  metadata?: Record<string, any>
}

interface SearchBarProps {
  onSearch?: (query: string) => void
  onResultClick?: (result: SearchResult) => void
  placeholder?: string
  className?: string
  showSuggestions?: boolean
  debounceMs?: number
  minQueryLength?: number
}

export function SearchBar({
  onSearch,
  onResultClick,
  placeholder = 'Search rooms, bookings, orders...',
  className,
  showSuggestions = true,
  debounceMs = 300,
  minQueryLength = 2,
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recent-searches')
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored))
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [])

  // Save recent searches to localStorage
  const saveRecentSearch = (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < minQueryLength) return

    setRecentSearches((prev) => {
      const updated = [searchQuery, ...prev.filter((s) => s !== searchQuery)].slice(0, 5)
      localStorage.setItem('recent-searches', JSON.stringify(updated))
      return updated
    })
  }

  // Debounced search
  useEffect(() => {
    if (query.length < minQueryLength) {
      setResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const timer = setTimeout(async () => {
      try {
        // Search across multiple endpoints
        const searchPromises = [
          fetch(`/api/rooms?search=${encodeURIComponent(query)}`).catch(() => null),
          fetch(`/api/bookings?search=${encodeURIComponent(query)}`).catch(() => null),
          fetch(`/api/restaurant/orders?search=${encodeURIComponent(query)}`).catch(() => null),
        ]

        const [roomsRes, bookingsRes, ordersRes] = await Promise.all(searchPromises)

        const searchResults: SearchResult[] = []

        // Process rooms
        if (roomsRes?.ok) {
          const roomsData = await roomsRes.json()
          const rooms = Array.isArray(roomsData) ? roomsData : roomsData.items || []
          rooms.forEach((room: any) => {
            searchResults.push({
              id: room.id,
              type: 'room',
              title: room.name || `Room ${room.number}`,
              description: room.type || room.description,
              url: `/rooms/${room.id}`,
              metadata: { number: room.number, price: room.price },
            })
          })
        }

        // Process bookings
        if (bookingsRes?.ok) {
          const bookingsData = await bookingsRes.json()
          const bookings = Array.isArray(bookingsData) ? bookingsData : bookingsData.items || []
          bookings.forEach((booking: any) => {
            searchResults.push({
              id: booking.id,
              type: 'booking',
              title: `Booking ${booking.confirmationCode || booking.id}`,
              description: booking.guestName || booking.room?.name,
              url: `/admin/bookings`,
              metadata: { status: booking.status, checkIn: booking.checkIn },
            })
          })
        }

        // Process orders
        if (ordersRes?.ok) {
          const ordersData = await ordersRes.json()
          const orders = Array.isArray(ordersData) ? ordersData : ordersData.items || []
          orders.forEach((order: any) => {
            searchResults.push({
              id: order.id,
              type: 'order',
              title: `Order #${order.id}`,
              description: order.roomNumber || order.status,
              url: `/admin/orders`,
              metadata: { status: order.status, total: order.total },
            })
          })
        }

        setResults(searchResults.slice(0, 10)) // Limit to 10 results
        setIsSearching(false)
      } catch (error) {
        console.error('Search error:', error)
        setIsSearching(false)
      }
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [query, debounceMs, minQueryLength])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (value: string) => {
    setQuery(value)
    setIsOpen(true)
    onSearch?.(value)
  }

  const handleResultClick = (result: SearchResult) => {
    saveRecentSearch(query)
    setIsOpen(false)
    setQuery('')
    onResultClick?.(result)
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'room':
        return '🏨'
      case 'booking':
        return '📅'
      case 'order':
        return '🍽️'
      case 'staff':
        return '👤'
      case 'task':
        return '✓'
      case 'menu':
        return '📋'
      default:
        return '🔍'
    }
  }

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'room':
        return 'Room'
      case 'booking':
        return 'Booking'
      case 'order':
        return 'Order'
      case 'staff':
        return 'Staff'
      case 'task':
        return 'Task'
      case 'menu':
        return 'Menu'
      default:
        return 'Result'
    }
  }

  return (
    <div ref={searchRef} className={cn('relative w-full', className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-10"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && showSuggestions && (
        <Card className="absolute z-50 w-full mt-2 max-h-96 overflow-y-auto shadow-lg">
          {isSearching ? (
            <div className="p-4 flex items-center justify-center gap-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Searching...</span>
            </div>
          ) : query.length < minQueryLength ? (
            <div className="p-4">
              {recentSearches.length > 0 && (
                <>
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Recent Searches
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleInputChange(search)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-sm text-gray-700 dark:text-gray-300"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {recentSearches.length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  Start typing to search...
                </div>
              )}
            </div>
          ) : results.length > 0 ? (
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-2">
                Results ({results.length})
              </div>
              <div className="space-y-1">
                {results.map((result) => (
                  <Link
                    key={result.id}
                    href={result.url}
                    onClick={() => handleResultClick(result)}
                    className="block px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg">{getTypeIcon(result.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
                            {result.title}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {getTypeLabel(result.type)}
                          </Badge>
                        </div>
                        {result.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {result.description}
                          </p>
                        )}
                        {result.metadata && (
                          <div className="flex items-center gap-2 mt-1">
                            {result.metadata.status && (
                              <Badge variant="outline" className="text-xs">
                                {result.metadata.status}
                              </Badge>
                            )}
                            {result.metadata.price && (
                              <span className="text-xs text-gray-500">
                                ${result.metadata.price}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500 text-sm">
              No results found for &quot;{query}&quot;
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

