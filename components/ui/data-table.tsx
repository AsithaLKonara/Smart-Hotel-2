'use client'

import { useState, useMemo } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Filter, Download } from 'lucide-react'
import { Input } from './input'
import { Button } from './button'
import { Card } from './card'
import { Badge } from './badge'
import { Pagination } from './pagination'
import { cn } from '@/lib/utils'

export type SortDirection = 'asc' | 'desc' | null

export interface Column<T> {
  key: string
  header: string
  accessor?: (row: T) => any
  sortable?: boolean
  render?: (value: any, row: T) => React.ReactNode
  className?: string
  headerClassName?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchable?: boolean
  searchPlaceholder?: string
  searchKeys?: string[]
  filterable?: boolean
  sortable?: boolean
  paginated?: boolean
  pageSize?: number
  exportable?: boolean
  onExport?: () => void
  onRowClick?: (row: T) => void
  emptyMessage?: string
  className?: string
  loading?: boolean
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = true,
  searchPlaceholder = 'Search...',
  searchKeys,
  filterable = false,
  sortable = true,
  paginated = true,
  pageSize: initialPageSize = 10,
  exportable = false,
  onExport,
  onRowClick,
  emptyMessage = 'No data available',
  className,
  loading = false,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data

    const query = searchQuery.toLowerCase()
    const keysToSearch = searchKeys || columns.map((col) => col.key)

    return data.filter((row) => {
      return keysToSearch.some((key) => {
        const value = row[key]
        if (value === null || value === undefined) return false
        return String(value).toLowerCase().includes(query)
      })
    })
  }, [data, searchQuery, searchKeys, columns])

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredData

    return [...filteredData].sort((a, b) => {
      const column = columns.find((col) => col.key === sortColumn)
      if (!column) return 0

      const getValue = (row: T) => {
        if (column.accessor) return column.accessor(row)
        return row[column.key]
      }

      const aValue = getValue(a)
      const bValue = getValue(b)

      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }

      const aStr = String(aValue).toLowerCase()
      const bStr = String(bValue).toLowerCase()

      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr)
      } else {
        return bStr.localeCompare(aStr)
      }
    })
  }, [filteredData, sortColumn, sortDirection, columns])

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!paginated) return sortedData

    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return sortedData.slice(startIndex, endIndex)
  }, [sortedData, currentPage, pageSize, paginated])

  const totalPages = Math.ceil(sortedData.length / pageSize)

  // Handle sort
  const handleSort = (columnKey: string) => {
    if (!sortable) return

    if (sortColumn === columnKey) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortColumn(null)
        setSortDirection(null)
      } else {
        setSortDirection('asc')
      }
    } else {
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
    setCurrentPage(1) // Reset to first page on sort
  }

  // Get sort icon
  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="h-4 w-4 text-amber-600" />
    }
    return <ArrowDown className="h-4 w-4 text-amber-600" />
  }

  if (loading) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Toolbar */}
      {(searchable || exportable) && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-4 items-center justify-between">
          {searchable && (
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1) // Reset to first page on search
                }}
                className="pl-10"
              />
            </div>
          )}

          {exportable && onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                    column.headerClassName
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.header}</span>
                    {sortable && column.sortable !== false && (
                      <button
                        onClick={() => handleSort(column.key)}
                        className="hover:text-amber-600 transition-colors"
                        aria-label={`Sort by ${column.header}`}
                      >
                        {getSortIcon(column.key)}
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                    onRowClick && 'cursor-pointer'
                  )}
                >
                  {columns.map((column) => {
                    const value = column.accessor
                      ? column.accessor(row)
                      : row[column.key]

                    return (
                      <td
                        key={column.key}
                        className={cn(
                          'px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white',
                          column.className
                        )}
                      >
                        {column.render ? column.render(value, row) : value}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginated && sortedData.length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            totalItems={sortedData.length}
            showPageSize={true}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setCurrentPage(1)
            }}
          />
        </div>
      )}
    </Card>
  )
}

