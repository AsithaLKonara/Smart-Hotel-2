"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { canAccessManagerFeatures } from '@/lib/rbac-helpers'
import { Plus, Edit, Trash2, Search, Link as LinkIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import toast from 'react-hot-toast'

interface FooterLink {
  id: string
  label: string
  url: string
  category: string
  order: number
  active: boolean
}

export default function AdminFooterLinksPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [items, setItems] = useState<FooterLink[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<FooterLink | null>(null)
  const [formData, setFormData] = useState({
    label: '',
    url: '',
    category: 'Quick Links',
    order: 0,
    active: true
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!canAccessManagerFeatures(session)) {
      router.push('/auth/signin')
      return
    }

    fetchLinks()
  }, [session, status]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchLinks = async () => {
    try {
      const response = await fetch('/api/footer-links?activeOnly=false')
      if (!response.ok) throw new Error('Failed to fetch footer links')
      const data = await response.json()
      setItems(Array.isArray(data) ? data : (data.items || []))
    } catch (error) {
      console.error('Error fetching footer links:', error)
      toast.error('Failed to load footer links')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingItem ? `/api/footer-links/${editingItem.id}` : '/api/footer-links'
      const method = editingItem ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error(editingItem ? 'Failed to update link' : 'Failed to add link')

      toast.success(editingItem ? 'Link updated successfully' : 'Link added successfully')
      setShowModal(false)
      setEditingItem(null)
      resetForm()
      fetchLinks()
    } catch (error) {
      console.error('Error saving link:', error)
      toast.error(editingItem ? 'Failed to update link' : 'Failed to add link')
    }
  }

  const handleEdit = (item: FooterLink) => {
    setEditingItem(item)
    setFormData({
      label: item.label,
      url: item.url,
      category: item.category,
      order: item.order,
      active: item.active
    })
    setShowModal(true)
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this footer link?')) return

    try {
      const response = await fetch(`/api/footer-links/${itemId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete link')

      toast.success('Link deleted successfully')
      fetchLinks()
    } catch (error) {
      console.error('Error deleting link:', error)
      toast.error('Failed to delete link')
    }
  }

  const resetForm = () => {
    setFormData({
      label: '',
      url: '',
      category: 'Quick Links',
      order: 0,
      active: true
    })
    setEditingItem(null)
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.url.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory
    return matchesSearch && matchesCategory
  }).sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category)
    return a.order - b.order
  })

  const categories = Array.from(new Set(items.map(item => item.category)))

  if (status === 'loading' || loading) {
    return <div className="flex items-center justify-center h-screen"><div className="animate-spin">Loading...</div></div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Footer Links Management</h1>
          <p className="text-gray-600">Manage footer navigation links and services</p>
        </div>
        <Button onClick={() => { resetForm(); setShowModal(true) }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Link
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
                  placeholder="Search footer links..."
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

      <div className="space-y-4">
        {filteredItems.map((item) => (
          <Card key={item.id} className={!item.active ? 'opacity-60' : ''}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                    <LinkIcon className="w-4 h-4 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{item.label}</h3>
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded">{item.category}</span>
                      <span className="text-xs text-gray-500">Order: {item.order}</span>
                      {!item.active && (
                        <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded">Inactive</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{item.url}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredItems.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              No footer links found
            </CardContent>
          </Card>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg m-4">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{editingItem ? 'Edit Footer Link' : 'Add Footer Link'}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => { setShowModal(false); resetForm() }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Label *</label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Home"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">URL *</label>
                  <input
                    type="text"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="/"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    >
                      <option value="Quick Links">Quick Links</option>
                      <option value="Services">Services</option>
                      <option value="About">About</option>
                      <option value="Legal">Legal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Order</label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="active" className="text-sm font-medium">Active</label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => { setShowModal(false); resetForm() }}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingItem ? 'Update' : 'Create'} Link
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

