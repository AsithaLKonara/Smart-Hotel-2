"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { canAccessManagerFeatures } from '@/lib/rbac-helpers'
import { Plus, Edit, Trash2, Search, HelpCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import toast from 'react-hot-toast'

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
  order: number
  active: boolean
}

export default function AdminFAQPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [items, setItems] = useState<FAQItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<FAQItem | null>(null)
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'General',
    order: 0,
    active: true
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!canAccessManagerFeatures(session)) {
      router.push('/auth/signin')
      return
    }

    fetchFAQs()
  }, [session, status]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchFAQs = async () => {
    try {
      const response = await fetch('/api/faq?activeOnly=false')
      if (!response.ok) throw new Error('Failed to fetch FAQs')
      const data = await response.json()
      setItems(Array.isArray(data) ? data : (data.items || []))
    } catch (error) {
      console.error('Error fetching FAQs:', error)
      toast.error('Failed to load FAQs')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingItem ? `/api/faq/${editingItem.id}` : '/api/faq'
      const method = editingItem ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error(editingItem ? 'Failed to update FAQ' : 'Failed to add FAQ')

      toast.success(editingItem ? 'FAQ updated successfully' : 'FAQ added successfully')
      setShowModal(false)
      setEditingItem(null)
      resetForm()
      fetchFAQs()
    } catch (error) {
      console.error('Error saving FAQ:', error)
      toast.error(editingItem ? 'Failed to update FAQ' : 'Failed to add FAQ')
    }
  }

  const handleEdit = (item: FAQItem) => {
    setEditingItem(item)
    setFormData({
      question: item.question,
      answer: item.answer,
      category: item.category,
      order: item.order,
      active: item.active
    })
    setShowModal(true)
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return

    try {
      const response = await fetch(`/api/faq/${itemId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete FAQ')

      toast.success('FAQ deleted successfully')
      fetchFAQs()
    } catch (error) {
      console.error('Error deleting FAQ:', error)
      toast.error('Failed to delete FAQ')
    }
  }

  const resetForm = () => {
    setFormData({
      question: '',
      answer: '',
      category: 'General',
      order: 0,
      active: true
    })
    setEditingItem(null)
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const categories = Array.from(new Set(items.map(item => item.category)))

  if (status === 'loading' || loading) {
    return <div className="flex items-center justify-center h-screen"><div className="animate-spin">Loading...</div></div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">FAQ Management</h1>
          <p className="text-gray-600">Manage frequently asked questions</p>
        </div>
        <Button onClick={() => { resetForm(); setShowModal(true) }}>
          <Plus className="w-4 h-4 mr-2" />
          Add FAQ
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
                  placeholder="Search FAQs..."
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
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <HelpCircle className="w-5 h-5 text-primary-500" />
                    <h3 className="font-semibold text-lg">{item.question}</h3>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded">{item.category}</span>
                    {!item.active && <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded">Inactive</span>}
                  </div>
                  <p className="text-gray-600 mb-2">{item.answer}</p>
                  <p className="text-xs text-gray-400">Order: {item.order}</p>
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
              No FAQs found
            </CardContent>
          </Card>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{editingItem ? 'Edit FAQ' : 'Add FAQ'}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => { setShowModal(false); resetForm() }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Question *</label>
                  <input
                    type="text"
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Answer *</label>
                  <textarea
                    value={formData.answer}
                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
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
                    {editingItem ? 'Update' : 'Create'} FAQ
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

