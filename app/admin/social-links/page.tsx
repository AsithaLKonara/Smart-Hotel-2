"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { canAccessManagerFeatures } from '@/lib/rbac-helpers'
import { Plus, Edit, Trash2, Search, Share2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import toast from 'react-hot-toast'

interface SocialLink {
  id: string
  platform: string
  url: string
  icon?: string
  order: number
  active: boolean
}

export default function AdminSocialLinksPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [items, setItems] = useState<SocialLink[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<SocialLink | null>(null)
  const [formData, setFormData] = useState({
    platform: '',
    url: '',
    icon: '',
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
  }, [session, status, router])

  const fetchLinks = async () => {
    try {
      const response = await fetch('/api/social-links')
      if (!response.ok) throw new Error('Failed to fetch social links')
      const data = await response.json()
      setItems(Array.isArray(data) ? data : (data.items || []))
    } catch (error) {
      console.error('Error fetching social links:', error)
      toast.error('Failed to load social links')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingItem ? `/api/social-links/${editingItem.id}` : '/api/social-links'
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

  const handleEdit = (item: SocialLink) => {
    setEditingItem(item)
    setFormData({
      platform: item.platform,
      url: item.url,
      icon: item.icon || '',
      order: item.order,
      active: item.active
    })
    setShowModal(true)
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this social link?')) return

    try {
      const response = await fetch(`/api/social-links/${itemId}`, {
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
      platform: '',
      url: '',
      icon: '',
      order: 0,
      active: true
    })
    setEditingItem(null)
  }

  const filteredItems = items.filter(item =>
    item.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.url.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.order - b.order)

  if (status === 'loading' || loading) {
    return <div className="flex items-center justify-center h-screen"><div className="animate-spin">Loading...</div></div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Social Media Links</h1>
          <p className="text-gray-600">Manage social media links for footer</p>
        </div>
        <Button onClick={() => { resetForm(); setShowModal(true) }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Link
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search social links..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <Card key={item.id} className={!item.active ? 'opacity-60' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  {item.icon ? (
                    <span className="text-xl">{item.icon}</span>
                  ) : (
                    <Share2 className="w-5 h-5 text-primary-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold capitalize">{item.platform}</h3>
                  <p className="text-xs text-gray-500">Order: {item.order}</p>
                </div>
                {!item.active && (
                  <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded">Inactive</span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-3 truncate">{item.url}</p>
              <div className="flex gap-2">
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
              No social links found
            </CardContent>
          </Card>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg m-4">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{editingItem ? 'Edit Social Link' : 'Add Social Link'}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => { setShowModal(false); resetForm() }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Platform *</label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="">Select platform</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Twitter">Twitter</option>
                    <option value="Instagram">Instagram</option>
                    <option value="YouTube">YouTube</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">URL *</label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="https://facebook.com/yourpage"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Icon (emoji or text)</label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="🔗 or icon name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Order</label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
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

