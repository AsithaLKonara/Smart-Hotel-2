"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { canAccessManagerFeatures } from '@/lib/rbac-helpers'
import { Plus, Edit, Trash2, Search, Package, AlertTriangle, CheckCircle, Loader2, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import toast from 'react-hot-toast'

interface InventoryItem {
  id: string
  name: string
  description?: string
  category: string
  quantity: number
  unit: string
  minQuantity: number
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DISCONTINUED'
}

export default function AdminInventoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    quantity: '',
    unit: '',
    minQuantity: '',
    status: 'IN_STOCK'
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!canAccessManagerFeatures(session)) {
      router.push('/auth/signin')
      return
    }

    fetchInventory()
  }, [session, status, router])

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/inventory')
      if (!response.ok) throw new Error('Failed to fetch inventory')
      const data = await response.json()
      // API returns { items: [...] } but we need an array
      const itemsArray = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : [])
      setItems(itemsArray)
    } catch (error) {
      console.error('Error fetching inventory:', error)
      toast.error('Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const itemData = {
        name: formData.name,
        description: formData.description || undefined,
        category: formData.category,
        quantity: parseInt(formData.quantity),
        unit: formData.unit,
        minQuantity: parseInt(formData.minQuantity),
        status: formData.status
      }

      const url = editingItem ? `/api/inventory/${editingItem.id}` : '/api/inventory'
      const method = editingItem ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      })

      if (!response.ok) throw new Error(editingItem ? 'Failed to update item' : 'Failed to create item')

      toast.success(editingItem ? 'Item updated successfully' : 'Item created successfully')
      setShowModal(false)
      setEditingItem(null)
      resetForm()
      fetchInventory()
    } catch (error) {
      console.error('Error saving item:', error)
      toast.error(editingItem ? 'Failed to update item' : 'Failed to create item')
    }
  }

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description || '',
      category: item.category,
      quantity: item.quantity.toString(),
      unit: item.unit,
      minQuantity: item.minQuantity.toString(),
      status: item.status
    })
    setShowModal(true)
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      const response = await fetch(`/api/inventory/${itemId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete item')

      toast.success('Item deleted successfully')
      fetchInventory()
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error('Failed to delete item')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      quantity: '',
      unit: '',
      minQuantity: '',
      status: 'IN_STOCK'
    })
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  const categories = Array.from(new Set(items.map(i => i.category)))

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_STOCK':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'LOW_STOCK':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'OUT_OF_STOCK':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'DISCONTINUED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'IN_STOCK':
        return <CheckCircle className="w-4 h-4" />
      case 'LOW_STOCK':
        return <AlertTriangle className="w-4 h-4" />
      case 'OUT_OF_STOCK':
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <Package className="w-4 h-4" />
    }
  }

  const statsData = {
    total: items.length,
    inStock: items.filter(i => i.status === 'IN_STOCK').length,
    lowStock: items.filter(i => i.status === 'LOW_STOCK').length,
    outOfStock: items.filter(i => i.status === 'OUT_OF_STOCK').length
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <Breadcrumbs
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Inventory' },
        ]}
        className="mb-4"
      />
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Inventory Management</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track and manage hotel inventory and supplies
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Items</p>
                <p className="text-2xl font-bold">{statsData.total}</p>
              </div>
              <Package className="w-8 h-8 text-primary-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">In Stock</p>
                <p className="text-2xl font-bold text-green-600">{statsData.inStock}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">{statsData.lowStock}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{statsData.outOfStock}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg w-full focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
            <option value="DISCONTINUED">Discontinued</option>
          </select>
        </div>

        <Button
          onClick={() => {
            setEditingItem(null)
            resetForm()
            setShowModal(true)
          }}
          className="w-full md:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium">{item.name}</div>
                      {item.description && (
                        <div className="text-xs text-gray-500">{item.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary">{item.category}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium">
                        {item.quantity} {item.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {item.minQuantity} {item.unit}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getStatusColor(item.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(item.status)}
                          {item.status.replace('_', ' ')}
                        </div>
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredItems.length === 0 && (
            <div className="p-12 text-center">
              <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No items found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || filterCategory !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Add your first inventory item to get started'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {editingItem ? 'Edit Item' : 'Add New Item'}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowModal(false)
                    setEditingItem(null)
                    resetForm()
                  }}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Item Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Category *</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Unit *</label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                      placeholder="e.g., pcs, kg, liters"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Quantity *</label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Min Quantity *</label>
                    <input
                      type="number"
                      value={formData.minQuantity}
                      onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="IN_STOCK">In Stock</option>
                    <option value="LOW_STOCK">Low Stock</option>
                    <option value="OUT_OF_STOCK">Out of Stock</option>
                    <option value="DISCONTINUED">Discontinued</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    {editingItem ? 'Update Item' : 'Add Item'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowModal(false)
                      setEditingItem(null)
                      resetForm()
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
      </Modal>
    </div>
  )
}










