"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { canAccessManagerFeatures } from '@/lib/rbac-helpers'
import { Plus, Edit, Trash2, Search, Star, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import toast from 'react-hot-toast'

interface Amenity {
  id: string
  name: string
  description?: string
  icon?: string
  category?: string
  displayOrder: number
  active: boolean
}

export default function AdminAmenitiesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [items, setItems] = useState<Amenity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<Amenity | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    category: '',
    displayOrder: 0,
    active: true
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!canAccessManagerFeatures(session)) {
      router.push('/auth/signin')
      return
    }

    fetchAmenities()
  }, [session, status]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAmenities = async () => {
    try {
      const response = await fetch('/api/amenities?activeOnly=false')
      if (!response.ok) throw new Error('Failed to fetch amenities')
      const data = await response.json()
      setItems(Array.isArray(data) ? data : (data.items || []))
    } catch (error) {
      console.error('Error fetching amenities:', error)
      toast.error('Failed to load amenities')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingItem ? `/api/amenities/${editingItem.id}` : '/api/amenities'
      const method = editingItem ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error(editingItem ? 'Failed to update amenity' : 'Failed to add amenity')

      toast.success(editingItem ? 'Amenity updated successfully' : 'Amenity added successfully')
      setShowModal(false)
      setEditingItem(null)
      resetForm()
      fetchAmenities()
    } catch (error) {
      console.error('Error saving amenity:', error)
      toast.error(editingItem ? 'Failed to update amenity' : 'Failed to add amenity')
    }
  }

  const handleEdit = (item: Amenity) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description || '',
      icon: item.icon || '',
      category: item.category || '',
      displayOrder: item.displayOrder,
      active: item.active
    })
    setShowModal(true)
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this amenity?')) return

    try {
      const response = await fetch(`/api/amenities/${itemId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete amenity')

      toast.success('Amenity deleted successfully')
      fetchAmenities()
    } catch (error) {
      console.error('Error deleting amenity:', error)
      toast.error('Failed to delete amenity')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: '',
      category: '',
      displayOrder: 0,
      active: true
    })
    setEditingItem(null)
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory
    return matchesSearch && matchesCategory
  }).sort((a, b) => a.displayOrder - b.displayOrder)

  const categories = Array.from(new Set(items.map(item => item.category).filter(Boolean)))

  if (status === 'loading' || loading) {
    return <div className="flex items-center justify-center h-screen"><div className="animate-spin">Loading...</div></div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Amenities Management</h1>
          <p className="text-gray-600">Manage hotel amenities and features</p>
        </div>
        <Button onClick={() => { resetForm(); setShowModal(true) }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Amenity
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search amenities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                />
              </div>
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <Card key={item.id} className={!item.active ? 'opacity-60' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {item.icon ? (
                    <span className="text-xl">{item.icon}</span>
                  ) : (
                    <Star className="w-5 h-5 text-primary-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold mb-1">{item.name}</h3>
                  {item.category && (
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded inline-block mb-2">{item.category}</span>
                  )}
                  {item.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">Order: {item.displayOrder}</p>
                </div>
                {!item.active && (
                  <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded">Inactive</span>
                )}
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" onClick={() => handleEdit(item)} className="flex-1">
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredItems.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center text-gray-500">
              No amenities found
            </CardContent>
          </Card>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto m-4">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{editingItem ? 'Edit Amenity' : 'Add Amenity'}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => { setShowModal(false); resetForm() }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Icon</label>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="🌟 or icon name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Wellness, Dining, etc."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Display Order</label>
                    <input
                      type="number"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-8">
                    <input
                      type="checkbox"
                      id="active"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label htmlFor="active" className="text-sm font-medium">Active</label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => { setShowModal(false); resetForm() }}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingItem ? 'Update' : 'Create'} Amenity
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

