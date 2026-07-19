"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, Search, Filter, Loader2, Save, X, ImageIcon, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import toast from 'react-hot-toast'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import { formatPrice } from '@/lib/utils'

interface RoomType {
  id: string
  name: string
  description: string
  baseRate: number
  capacity: number
  amenities: string[]
  images: string[]
  minLengthOfStay: number
  maxLengthOfStay: number
  _count?: {
    rooms: number
  }
}

export default function AdminRoomTypesPage() {
  const { status } = useSession()
  const router = useRouter()
  
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [showModal, setShowModal] = useState(false)
  const [editingType, setEditingType] = useState<RoomType | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    baseRate: '',
    capacity: '',
    amenities: '',
    images: [] as string[]
  })
  
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    fetchRoomTypes()
  }, [status])

  const fetchRoomTypes = async () => {
    try {
      const response = await fetch('/api/room-types')
      if (!response.ok) throw new Error('Failed to fetch room types')
      const data = await response.json()
      setRoomTypes(data || [])
    } catch (error) {
      toast.error('Failed to load room types')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      const amenitiesArray = formData.amenities.split(',').map(a => a.trim()).filter(Boolean)
      
      const payload = {
        name: formData.name,
        description: formData.description,
        baseRate: parseFloat(formData.baseRate),
        capacity: parseInt(formData.capacity),
        amenities: amenitiesArray,
        images: formData.images,
      }

      const url = editingType ? `/api/room-types/${editingType.id}` : '/api/room-types'
      const method = editingType ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save room type')
      }

      toast.success(`Room type ${editingType ? 'updated' : 'created'} successfully`)
      setShowModal(false)
      fetchRoomTypes()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this room type?')) return

    try {
      const response = await fetch(`/api/room-types/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete room type')
      }

      toast.success('Room type deleted successfully')
      fetchRoomTypes()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const openModal = (roomType?: RoomType) => {
    if (roomType) {
      setEditingType(roomType)
      setFormData({
        name: roomType.name,
        description: roomType.description || '',
        baseRate: roomType.baseRate.toString(),
        capacity: roomType.capacity.toString(),
        amenities: roomType.amenities.join(', '),
        images: roomType.images || []
      })
    } else {
      setEditingType(null)
      setFormData({
        name: '',
        description: '',
        baseRate: '',
        capacity: '2',
        amenities: '',
        images: []
      })
    }
    setShowModal(true)
  }

  const filteredTypes = roomTypes.filter(type => 
    type.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <PremiumSpinner size="lg" text="Loading Room Types..." />
      </div>
    )
  }

  return (
    <div className="p-6">
      <Breadcrumbs items={[
        { label: "Dashboard", href: "/admin/dashboard" },
        { label: "Rooms", href: "/admin/rooms" },
        { label: "Room Types", href: "/admin/room-types" }
      ]} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 mt-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Room Types</h1>
          <p className="text-slate-400 mt-1">Manage global configurations and pricing for room classes.</p>
        </div>
        <Button onClick={() => openModal()} className="bg-primary hover:bg-primary/90 text-white font-medium">
          <Plus className="mr-2 h-4 w-4" /> Add Room Type
        </Button>
      </div>

      <Card className="bg-[#0f0f13] border-white/5 shadow-2xl mb-6">
        <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row gap-4 bg-white/[0.02]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search room types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-black/40 border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Base Rate</th>
                <th className="px-6 py-4 font-medium">Capacity</th>
                <th className="px-6 py-4 font-medium">Linked Rooms</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTypes.map((type) => (
                <tr key={type.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 flex-shrink-0">
                        {type.images?.[0] ? (
                          <img src={type.images[0]} alt={type.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200">{type.name}</div>
                        <div className="text-xs text-slate-500 truncate max-w-[200px]">{type.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-emerald-400 font-medium">
                    {formatPrice(type.baseRate)}
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {type.capacity} Guests
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    <Badge variant="outline" className="border-white/10 bg-white/5">{type._count?.rooms || 0} Rooms</Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openModal(type)} className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(type.id)} className="h-8 w-8 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTypes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Info className="h-8 w-8 mb-2 opacity-50" />
                      <p>No room types found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingType ? 'Edit Room Type' : 'Add Room Type'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
              required
              placeholder="e.g. Deluxe Suite"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">Base Rate ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.baseRate}
                onChange={(e) => setFormData({ ...formData, baseRate: e.target.value })}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">Capacity</label>
              <input
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm h-20 resize-none"
              placeholder="Room type description..."
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">Amenities (comma separated)</label>
            <input
              type="text"
              value={formData.amenities}
              onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
              placeholder="WiFi, TV, Minibar..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5 mt-6">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white hover:bg-white/5">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 text-white min-w-[100px]">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingType ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
