"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { canAccessManagerFeatures } from '@/lib/rbac-helpers'
import { Plus, Edit, Trash2, Search, UtensilsCrossed, DollarSign, Clock, Loader2, Save, X, Image as ImageIcon, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell'
import toast from 'react-hot-toast'
import { useLuxuryConfirm } from '@/components/ui/luxury-confirm-dialog'

interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  category: string
  image?: string
  available: boolean
  preparationTime?: number
}

export default function AdminMenuPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const confirm = useLuxuryConfirm()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterAvailability, setFilterAvailability] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'MAIN_COURSE',
    preparationTime: '',
    images: [] as string[],
    available: true
  })
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!canAccessManagerFeatures(session)) {
      router.push('/auth/signin')
      return
    }

    fetchMenuItems()
  }, [session, status]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMenuItems = async () => {
    try {
      const response = await fetch('/api/restaurant/menu')
      if (!response.ok) throw new Error('Failed to fetch menu items')
      const data = await response.json()
      setMenuItems(data)
    } catch (error) {
      console.error('Error fetching menu items:', error)
      toast.error('Failed to load menu items')
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
        price: parseFloat(formData.price),
        category: formData.category,
        preparationTime: formData.preparationTime ? parseInt(formData.preparationTime) : undefined,
        images: formData.images,
        available: formData.available
      }

      const url = editingItem ? `/api/restaurant/menu/${editingItem.id}` : '/api/restaurant/menu'
      const method = editingItem ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      })

      if (!response.ok) throw new Error(editingItem ? 'Failed to update menu item' : 'Failed to create menu item')

      toast.success(editingItem ? 'Menu item updated successfully' : 'Menu item created successfully')
      setShowModal(false)
      setEditingItem(null)
      resetForm()
      fetchMenuItems()
    } catch (error) {
      console.error('Error saving menu item:', error)
      toast.error(editingItem ? 'Failed to update menu item' : 'Failed to create menu item')
    }
  }

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      category: item.category,
      preparationTime: item.preparationTime?.toString() || '',
      images: (item as any).images || [],
      available: item.available
    })
    setShowModal(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    try {
      setIsUploading(true)
      
      const uploadPromises = files.map(async (file) => {
        const uploadData = new FormData()
        uploadData.append('file', file)
        uploadData.append('folder', 'menu')

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: uploadData,
        })

        if (!response.ok) throw new Error('Upload failed')
        const data = await response.json()
        return data.url
      })

      const newUrls = await Promise.all(uploadPromises)
      
      setFormData(prev => ({ 
        ...prev, 
        images: [...prev.images, ...newUrls] 
      }))
      toast.success(`${newUrls.length} image(s) uploaded successfully`)
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload images')
    } finally {
      setIsUploading(false)
      // Reset input
      e.target.value = ''
    }
  }
  
  const removeImage = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove)
    }))
  }

  const handleDelete = async (itemId: string) => {
    const approved = await confirm({
      title: 'Delete Menu Item',
      message: 'Are you sure you want to remove this dish from the restaurant menu?',
      confirmText: 'Delete Dish',
      isDestructive: true
    })
    if (!approved) return

    try {
      const response = await fetch(`/api/restaurant/menu/${itemId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete menu item')

      toast.success('Menu item deleted successfully')
      fetchMenuItems()
    } catch (error) {
      console.error('Error deleting menu item:', error)
      toast.error('Failed to delete menu item')
    }
  }

  const toggleAvailability = async (itemId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/restaurant/menu/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: !currentStatus })
      })

      if (!response.ok) throw new Error('Failed to update availability')

      toast.success(`Menu item ${!currentStatus ? 'enabled' : 'disabled'}`)
      fetchMenuItems()
    } catch (error) {
      console.error('Error updating availability:', error)
      toast.error('Failed to update availability')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'MAIN_COURSE',
      preparationTime: '',
      images: [],
      available: true
    })
  }

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory
    const matchesAvailability = filterAvailability === 'all' || 
                               (filterAvailability === 'available' && item.available) ||
                               (filterAvailability === 'unavailable' && !item.available)
    return matchesSearch && matchesCategory && matchesAvailability
  })

  const categories = [
    'BREAKFAST', 'LUNCH', 'DINNER', 'BEVERAGES', 'DESSERTS', 
    'SNACKS', 'APPETIZERS', 'MAIN_COURSE', 'SIDES'
  ]

  const statsData = {
    total: menuItems.length,
    available: menuItems.filter(i => i.available).length,
    unavailable: menuItems.filter(i => !i.available).length,
    avgPrice: menuItems.length > 0 
      ? (menuItems.reduce((sum, i) => sum + Number(i.price || 0), 0) / menuItems.length).toFixed(2)
      : '0.00'
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <AdminPageShell
      title="Restaurant Menu Catalog"
      subtitle="Configure kitchen culinary offerings, inventory pricing, prep times, and catalog availability."
      actions={
        <Button
          onClick={() => {
            setEditingItem(null)
            resetForm()
            setShowModal(true)
          }}
          className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs px-3.5 py-2 rounded-lg font-mono tracking-wider uppercase transition-all shadow-sm flex items-center gap-2 h-9"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Menu Item
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-[#121417] border border-[#1E2227] rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">Total Offerings</p>
                <p className="text-2xl font-mono font-bold text-zinc-100 mt-1">{statsData.total}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-[#181A1D] border border-[#1E2227] flex items-center justify-center text-zinc-400">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
            </div>
          </Card>

          <Card className="bg-[#121417] border border-[#1E2227] rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">Active & Available</p>
                <p className="text-2xl font-mono font-bold text-emerald-400 mt-1">{statsData.available}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
            </div>
          </Card>

          <Card className="bg-[#121417] border border-[#1E2227] rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">86'd / Suspended</p>
                <p className="text-2xl font-mono font-bold text-rose-400 mt-1">{statsData.unavailable}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
            </div>
          </Card>

          <Card className="bg-[#121417] border border-[#1E2227] rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">Average Price</p>
                <p className="text-2xl font-mono font-bold text-zinc-100 mt-1">${statsData.avgPrice}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-[#181A1D] border border-[#1E2227] flex items-center justify-center text-zinc-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters Bar */}
        <div className="p-3 bg-[#121417] border border-[#1E2227] rounded-xl flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex flex-1 flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search catalog items, ingredients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#181A1D] border border-[#2B3037] text-xs text-zinc-100 placeholder:text-zinc-500 rounded-lg pl-9 pr-3 py-2 outline-none focus:border-zinc-400 transition-all"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-[#181A1D] border border-[#2B3037] text-xs text-zinc-100 rounded-lg px-3 py-2 outline-none focus:border-zinc-400"
            >
              <option value="all" className="bg-[#181A1D] text-zinc-100">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat} className="bg-[#181A1D] text-zinc-100">{cat.replace('_', ' ')}</option>
              ))}
            </select>

            <select
              value={filterAvailability}
              onChange={(e) => setFilterAvailability(e.target.value)}
              className="bg-[#181A1D] border border-[#2B3037] text-xs text-zinc-100 rounded-lg px-3 py-2 outline-none focus:border-zinc-400"
            >
              <option value="all" className="bg-[#181A1D] text-zinc-100">All Statuses</option>
              <option value="available" className="bg-[#181A1D] text-zinc-100">Available Only</option>
              <option value="unavailable" className="bg-[#181A1D] text-zinc-100">Suspended / 86'd</option>
            </select>
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className="bg-[#121417] border border-[#1E2227] hover:border-[#2B3037] transition-all rounded-xl overflow-hidden flex flex-col justify-between shadow-sm">
              <CardHeader className="p-4 pb-3 relative">
                {((item as any).images?.length > 0) && (
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-xl overflow-hidden opacity-70 hover:opacity-100 transition-opacity border-b border-l border-[#1E2227]">
                    <Image src={(item as any).images[0]} alt={item.name} fill className="object-cover" />
                  </div>
                )}
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex-1 pr-24 space-y-2">
                    <CardTitle className="text-sm font-semibold text-zinc-100">{item.name}</CardTitle>
                    <div className="flex gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#181A1D] text-zinc-300 border border-[#2B3037]">
                        {item.category.replace('_', ' ')}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium ${
                        item.available 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {item.available ? 'AVAILABLE' : '86’D / OFF'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                {item.description && (
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-[#1E2227]">
                  <div className="flex items-center gap-1 text-zinc-100 font-mono font-bold text-base">
                    <span>${Number(item.price || 0).toFixed(2)}</span>
                  </div>
                  {item.preparationTime && (
                    <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-400">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      <span>{item.preparationTime} MIN PREP</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2 border-t border-[#1E2227]">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleAvailability(item.id, item.available)}
                    className="flex-1 h-8 bg-[#181A1D] hover:bg-[#20242A] border-[#2B3037] text-zinc-200 text-xs font-mono font-medium"
                  >
                    {item.available ? 'Suspend Item' : 'Activate Item'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(item)}
                    className="h-8 w-8 p-0 bg-[#181A1D] hover:bg-[#20242A] border-[#2B3037] text-zinc-300"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(item.id)}
                    className="h-8 w-8 p-0 bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/20 text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <Card className="bg-[#121417] border border-[#1E2227] p-12 text-center rounded-xl">
            <UtensilsCrossed className="w-12 h-12 mx-auto text-zinc-600 mb-3" />
            <h3 className="text-sm font-semibold text-zinc-200 mb-1">No catalog offerings found</h3>
            <p className="text-xs text-zinc-500 font-mono">
              {searchTerm || filterCategory !== 'all' || filterAvailability !== 'all'
                ? 'Try adjusting current search filters or category toggles.'
                : 'Create your first menu item to initialize the kitchen catalog.'}
            </p>
          </Card>
        )}
      </div>

      {/* Add/Edit Menu Item Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] bg-[#121417] border border-[#1E2227] rounded-xl shadow-2xl overflow-y-auto">
            <CardHeader className="px-6 py-4 border-b border-[#1E2227]">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-zinc-100">
                    {editingItem ? 'Edit Culinary Catalog Item' : 'New Catalog Item'}
                  </CardTitle>
                  <p className="text-xs text-zinc-500 font-mono mt-0.5">Kitchen POS & guest digital dining integration</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowModal(false)
                    setEditingItem(null)
                    resetForm()
                  }}
                  className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-100 hover:bg-[#181A1D]"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">Item Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#181A1D] border border-[#2B3037] text-xs text-zinc-100 rounded-lg px-3.5 py-2.5 outline-none focus:border-zinc-400"
                    placeholder="e.g. Pan-Seared Salmon Fillet"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">Menu Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-[#181A1D] border border-[#2B3037] text-xs text-zinc-100 rounded-lg px-3.5 py-2.5 outline-none focus:border-zinc-400 resize-none h-24"
                    placeholder="Describe flavor notes, allergies, preparation details..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">Unit Price ($) *</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full bg-[#181A1D] border border-[#2B3037] text-xs text-zinc-100 rounded-lg px-3.5 py-2.5 outline-none focus:border-zinc-400 font-mono"
                      required
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">Menu Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-[#181A1D] border border-[#2B3037] text-xs text-zinc-100 rounded-lg px-3.5 py-2.5 outline-none focus:border-zinc-400"
                      required
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat} className="bg-[#181A1D] text-zinc-100">{cat.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">Item Photos</label>
                  <div className="flex flex-col gap-3">
                    {formData.images.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.images.map((img, idx) => (
                          <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#1E2227] group">
                            <Image src={img} alt={`Preview ${idx}`} fill className="object-cover" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Button 
                                type="button" 
                                variant="destructive" 
                                size="icon" 
                                className="w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-500"
                                onClick={() => removeImage(idx)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <label className="flex items-center justify-center w-full px-4 py-5 border border-dashed border-[#2B3037] rounded-lg cursor-pointer bg-[#181A1D]/40 hover:bg-[#181A1D] transition-colors">
                      <div className="flex flex-col items-center gap-1.5 text-zinc-400">
                        {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                        <span className="font-mono text-xs text-zinc-300">{isUploading ? 'Uploading assets...' : 'Upload catalog imagery'}</span>
                        <span className="text-[10px] font-mono text-zinc-500">PNG, JPG, WEBP up to 5MB</span>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        disabled={isUploading}
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">Preparation Time (minutes)</label>
                  <input
                    type="number"
                    value={formData.preparationTime}
                    onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                    className="w-full bg-[#181A1D] border border-[#2B3037] text-xs text-zinc-100 rounded-lg px-3.5 py-2.5 outline-none focus:border-zinc-400 font-mono"
                    min="0"
                    placeholder="e.g. 15"
                  />
                </div>

                <div className="flex items-center gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="available"
                    checked={formData.available}
                    onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                    className="w-4 h-4 rounded bg-[#181A1D] border-[#2B3037] accent-emerald-500"
                  />
                  <label htmlFor="available" className="text-xs text-zinc-300 font-mono">
                    Available for live POS & room service ordering
                  </label>
                </div>

                <div className="flex gap-3 pt-4 border-t border-[#1E2227]">
                  <Button type="submit" className="flex-1 bg-white hover:bg-zinc-200 text-black font-semibold text-xs font-mono uppercase tracking-wider rounded-lg h-9">
                    <Save className="w-3.5 h-3.5 mr-2" />
                    {editingItem ? 'Update Item' : 'Save To Catalog'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowModal(false)
                      setEditingItem(null)
                      resetForm()
                    }}
                    className="flex-1 bg-[#181A1D] hover:bg-[#20242A] border-[#2B3037] text-zinc-300 text-xs font-mono uppercase tracking-wider rounded-lg h-9"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </AdminPageShell>
  )
}










