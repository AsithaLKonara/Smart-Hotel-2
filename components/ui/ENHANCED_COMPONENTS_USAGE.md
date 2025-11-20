# 🎨 Enhanced Components Usage Guide

**New Components Added:**
1. ✅ Pagination
2. ✅ DataTable
3. ✅ FilterPanel
4. ✅ SearchBar

---

## 1. Pagination Component

### Basic Usage

```tsx
import { Pagination } from '@/components/ui/pagination'

function MyComponent() {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const totalPages = 20
  const totalItems = 200

  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
      pageSize={pageSize}
      totalItems={totalItems}
      showPageSize={true}
      onPageSizeChange={setPageSize}
      pageSizeOptions={[10, 20, 50, 100]}
    />
  )
}
```

### Features
- ✅ Page navigation (first, previous, next, last)
- ✅ Page number display with ellipsis
- ✅ Page size selector
- ✅ Item count display
- ✅ Fully accessible (ARIA labels)
- ✅ Responsive design

---

## 2. DataTable Component

### Basic Usage

```tsx
import { DataTable, Column } from '@/components/ui/data-table'

interface Booking {
  id: string
  confirmationCode: string
  guestName: string
  checkIn: string
  checkOut: string
  status: string
  total: number
}

function BookingsTable() {
  const bookings: Booking[] = [...]
  
  const columns: Column<Booking>[] = [
    {
      key: 'confirmationCode',
      header: 'Confirmation Code',
      sortable: true,
    },
    {
      key: 'guestName',
      header: 'Guest Name',
      sortable: true,
    },
    {
      key: 'checkIn',
      header: 'Check-In',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => (
        <Badge variant={value === 'confirmed' ? 'default' : 'secondary'}>
          {value}
        </Badge>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      sortable: true,
      render: (value) => `$${value.toFixed(2)}`,
    },
  ]

  return (
    <DataTable
      data={bookings}
      columns={columns}
      searchable={true}
      searchPlaceholder="Search bookings..."
      searchKeys={['confirmationCode', 'guestName']}
      sortable={true}
      paginated={true}
      pageSize={10}
      exportable={true}
      onExport={() => exportBookings(bookings)}
      onRowClick={(row) => router.push(`/admin/bookings/${row.id}`)}
      emptyMessage="No bookings found"
    />
  )
}
```

### Features
- ✅ Column sorting (ascending/descending)
- ✅ Built-in search functionality
- ✅ Pagination integration
- ✅ Custom cell rendering
- ✅ Row click handlers
- ✅ Export functionality
- ✅ Loading states
- ✅ Empty state messages

---

## 3. FilterPanel Component

### Basic Usage

```tsx
import { FilterPanel, FilterOption } from '@/components/ui/filter-panel'

function BookingsPage() {
  const [filters, setFilters] = useState({
    status: '',
    checkIn: '',
    price_min: '',
    price_max: '',
  })

  const filterOptions: FilterOption[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'pending', label: 'Pending' },
        { value: 'cancelled', label: 'Cancelled' },
      ],
    },
    {
      key: 'checkIn',
      label: 'Check-In Date',
      type: 'date',
    },
    {
      key: 'price',
      label: 'Price Range',
      type: 'range',
      min: 0,
      max: 1000,
    },
  ]

  return (
    <FilterPanel
      filters={filterOptions}
      values={filters}
      onChange={setFilters}
      onReset={() => setFilters({
        status: '',
        checkIn: '',
        price_min: '',
        price_max: '',
      })}
      collapsible={true}
      defaultCollapsed={false}
    />
  )
}
```

### Filter Types
- ✅ **text** - Text input
- ✅ **select** - Dropdown select
- ✅ **date** - Date picker
- ✅ **number** - Number input
- ✅ **range** - Min/Max range
- ✅ **checkbox** - Boolean checkbox

### Features
- ✅ Multiple filter types
- ✅ Active filter badges
- ✅ Clear all functionality
- ✅ Collapsible panel
- ✅ Responsive grid layout

---

## 4. SearchBar Component

### Basic Usage

```tsx
import { SearchBar, SearchResult } from '@/components/ui/search-bar'

function Header() {
  const router = useRouter()

  const handleResultClick = (result: SearchResult) => {
    router.push(result.url)
  }

  return (
    <SearchBar
      placeholder="Search rooms, bookings, orders..."
      onSearch={(query) => console.log('Searching:', query)}
      onResultClick={handleResultClick}
      showSuggestions={true}
      debounceMs={300}
      minQueryLength={2}
    />
  )
}
```

### Features
- ✅ Cross-entity search (rooms, bookings, orders)
- ✅ Recent searches (localStorage)
- ✅ Debounced search
- ✅ Loading states
- ✅ Result categorization
- ✅ Click to navigate
- ✅ Keyboard accessible

---

## Combined Usage Example

### Complete Admin Bookings Page

```tsx
'use client'

import { useState, useMemo } from 'react'
import { DataTable, Column } from '@/components/ui/data-table'
import { FilterPanel, FilterOption } from '@/components/ui/filter-panel'
import { SearchBar } from '@/components/ui/search-bar'

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filters, setFilters] = useState({
    status: '',
    checkIn: '',
  })
  const [searchQuery, setSearchQuery] = useState('')

  // Filter and search bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      // Apply filters
      if (filters.status && booking.status !== filters.status) return false
      if (filters.checkIn && booking.checkIn !== filters.checkIn) return false
      
      // Apply search
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          booking.confirmationCode.toLowerCase().includes(query) ||
          booking.guestName.toLowerCase().includes(query)
        )
      }
      
      return true
    })
  }, [bookings, filters, searchQuery])

  const columns: Column<Booking>[] = [
    // ... column definitions
  ]

  const filterOptions: FilterOption[] = [
    // ... filter definitions
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bookings</h1>
        <SearchBar
          onSearch={setSearchQuery}
          className="max-w-md"
        />
      </div>

      <FilterPanel
        filters={filterOptions}
        values={filters}
        onChange={setFilters}
      />

      <DataTable
        data={filteredBookings}
        columns={columns}
        searchable={false} // Using external SearchBar
        sortable={true}
        paginated={true}
        pageSize={20}
        exportable={true}
        onExport={() => exportToCSV(filteredBookings)}
      />
    </div>
  )
}
```

---

## Component Integration

All components work seamlessly together:

1. **SearchBar** - Global search at the top
2. **FilterPanel** - Advanced filtering below search
3. **DataTable** - Displays filtered/sorted data
4. **Pagination** - Built into DataTable or standalone

---

## Styling

All components use Tailwind CSS and support:
- ✅ Dark mode
- ✅ Custom className props
- ✅ Responsive design
- ✅ Accessibility (ARIA labels, keyboard navigation)

---

## TypeScript Support

All components are fully typed:
- ✅ Generic types for DataTable
- ✅ Type-safe filter options
- ✅ Type-safe search results
- ✅ IntelliSense support

---

**All components are production-ready and fully tested!** ✅

