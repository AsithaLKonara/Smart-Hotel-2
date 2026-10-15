'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import * as Dialog from '@radix-ui/react-dialog'
import {
  Building2, Users, DollarSign, Plus, Edit, Trash2, X, CheckCircle,
  MapPin, Star, ToggleLeft, ToggleRight, CalendarDays, BookOpen, Search
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useProperty } from '@/contexts/property-context'
import { useRouter } from 'next/navigation'
import { useLuxuryConfirm } from '@/components/ui/luxury-confirm-dialog'

const HALL_TYPES = ['HALL', 'CONFERENCE_ROOM', 'BALLROOM', 'BOARDROOM', 'OUTDOOR'] as const
type HallType = typeof HALL_TYPES[number]

const HALL_TYPE_LABELS: Record<HallType, string> = {
  HALL: 'Hall',
  CONFERENCE_ROOM: 'Conference Room',
  BALLROOM: 'Ballroom',
  BOARDROOM: 'Boardroom',
  OUTDOOR: 'Outdoor Venue'
}

const HALL_TYPE_COLORS: Record<HallType, string> = {
  HALL: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  CONFERENCE_ROOM: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  BALLROOM: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  BOARDROOM: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  OUTDOOR: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
}

const DEFAULT_AMENITIES = [
  'WiFi', 'Projector', 'Screen', 'Whiteboard', 'Air Conditioning',
  'PA System', 'Stage', 'Dance Floor', 'Bar Setup', 'Parking',
  'Outdoor Garden', 'Natural Lighting', 'Blackout Curtains', 'Catering Kitchen'
]

interface Hall {
  id: string
  name: string
  description?: string
  type: HallType
  capacity: number
  floorNumber?: number
  hourlyRate: number
  dailyRate: number
  amenities: string[]
  images: string[]
  isActive: boolean
  propertyId: string
  _count?: { bookings: number }
}

function ModalShell({ open, onClose, title, children }: {
  open: boolean, onClose: () => void, title: string, children: React.ReactNode
}) {
  return (
    <Dialog.Root open={open} onOpenChange={o => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl p-6 z-50 max-h-[92vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function FormField({ label, children, hint }: { label: string, children: React.ReactNode, hint?: string }) {
  return (
    <div>
      <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1.5 block">{label}</label>
      {children}
      {hint && <p className="text-xs text-white/30 mt-1">{hint}</p>}
    </div>
  )
}

const emptyForm = {
  name: '', description: '', type: 'HALL' as HallType,
  capacity: '', floorNumber: '', hourlyRate: '', dailyRate: '',
  amenities: [] as string[], images: [] as string[], isActive: true
}

export default function HallsPage() {
  const { activePropertyId } = useProperty()
  const router = useRouter()
  const confirm = useLuxuryConfirm()
  const [halls, setHalls] = useState<Hall[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('ALL')
  const [showModal, setShowModal] = useState(false)
  const [editingHall, setEditingHall] = useState<Hall | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)

  const fetchHalls = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/halls', {
        headers: { 'x-property-id': activePropertyId || '' }
      })
      const data = await res.json()
      setHalls(data.data || [])
    } catch {
      toast.error('Failed to load halls')
    } finally {
      setLoading(false)
    }
  }, [activePropertyId])

  useEffect(() => {
    if (activePropertyId) fetchHalls()
  }, [activePropertyId, fetchHalls])

  const openCreate = () => {
    setEditingHall(null)
    setForm({ ...emptyForm })
    setShowModal(true)
  }

  const openEdit = (hall: Hall) => {
    setEditingHall(hall)
    setForm({
      name: hall.name,
      description: hall.description || '',
      type: hall.type,
      capacity: hall.capacity.toString(),
      floorNumber: hall.floorNumber?.toString() || '',
      hourlyRate: hall.hourlyRate.toString(),
      dailyRate: hall.dailyRate.toString(),
      amenities: [...hall.amenities],
      images: [...hall.images],
      isActive: hall.isActive
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activePropertyId || activePropertyId === 'all') {
      toast.error('Please select a specific property first')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        capacity: parseInt(form.capacity),
        floorNumber: form.floorNumber ? parseInt(form.floorNumber) : null,
        hourlyRate: parseFloat(form.hourlyRate),
        dailyRate: parseFloat(form.dailyRate),
      }

      const url = editingHall ? `/api/admin/halls/${editingHall.id}` : '/api/admin/halls'
      const method = editingHall ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-property-id': activePropertyId || '' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(editingHall ? 'Hall updated!' : 'Hall created!')
        setShowModal(false)
        fetchHalls()
      } else {
        toast.error(data.error || 'Failed to save hall')
      }
    } catch {
      toast.error('Error saving hall')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (hall: Hall) => {
    const approved = await confirm({
      title: 'Delete Event Hall',
      message: `Are you sure you want to delete "${hall.name}"? This action cannot be undone.`,
      confirmText: 'Delete Hall',
      isDestructive: true
    })
    if (!approved) return
    try {
      const res = await fetch(`/api/admin/halls/${hall.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        toast.success('Hall deleted')
        fetchHalls()
      } else {
        toast.error(data.error || 'Failed to delete')
      }
    } catch {
      toast.error('Error deleting hall')
    }
  }

  const handleToggleActive = async (hall: Hall) => {
    try {
      const res = await fetch(`/api/admin/halls/${hall.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !hall.isActive })
      })
      if (res.ok) {
        toast.success(hall.isActive ? 'Hall deactivated' : 'Hall activated')
        fetchHalls()
      } else {
        toast.error('Failed to update status')
      }
    } catch {
      toast.error('Error updating status')
    }
  }

  const toggleAmenity = (amenity: string) => {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(amenity)
        ? f.amenities.filter(a => a !== amenity)
        : [...f.amenities, amenity]
    }))
  }

  const filtered = halls.filter(h => {
    const matchSearch = h.name.toLowerCase().includes(search.toLowerCase()) ||
      (h.description || '').toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'ALL' || h.type === filterType
    return matchSearch && matchType
  })

  const stats = {
    total: halls.length,
    active: halls.filter(h => h.isActive).length,
    totalCapacity: halls.filter(h => h.isActive).reduce((s, h) => s + h.capacity, 0),
    types: HALL_TYPES.filter(t => halls.some(h => h.type === t)).length
  }

  return (
    <AdminPageShell
      title="Halls & Venues"
      subtitle="Manage event halls, ballrooms, and conference rooms."
      onRefresh={fetchHalls}
    >
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Venues', value: stats.total, icon: Building2, color: 'text-blue-400' },
          { label: 'Active', value: stats.active, icon: CheckCircle, color: 'text-emerald-400' },
          { label: 'Total Capacity', value: stats.totalCapacity.toLocaleString(), icon: Users, color: 'text-violet-400' },
          { label: 'Venue Types', value: stats.types, icon: Star, color: 'text-amber-400' },
        ].map(stat => (
          <Card key={stat.label} className="bg-white/5 border-white/10">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-white/5 rounded-lg">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/50">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters + Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 justify-between">
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              placeholder="Search halls..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white w-56"
            />
          </div>
          <div className="flex gap-1 bg-white/5 p-1 rounded-xl">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterType === 'ALL' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}
            >All</button>
            {HALL_TYPES.map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterType === t ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}
              >{HALL_TYPE_LABELS[t]}</button>
            ))}
          </div>
        </div>
        <Button onClick={openCreate} className="bg-primary text-white">
          <Plus className="w-4 h-4 mr-2" /> New Hall
        </Button>
      </div>

      {/* Halls Grid */}
      {loading ? (
        <div className="py-20 flex justify-center"><PremiumSpinner /></div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(hall => (
            <Card
              key={hall.id}
              className={`bg-white/5 border-white/10 hover:border-white/20 transition-all shadow-xl group cursor-pointer ${!hall.isActive ? 'opacity-60' : ''}`}
            >
              {/* Hall Image or Gradient Hero */}
              <div
                className="relative h-44 overflow-hidden rounded-t-xl bg-gradient-to-br from-primary/20 via-violet-900/20 to-slate-900"
                onClick={() => router.push(`/admin/halls/${hall.id}`)}
              >
                {hall.images?.[0] ? (
                  <img src={hall.images[0]} alt={hall.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Building2 className="w-16 h-16 text-white/10" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3 flex gap-2">
                  <Badge className={`text-xs px-2 py-0.5 border ${HALL_TYPE_COLORS[hall.type]}`}>
                    {HALL_TYPE_LABELS[hall.type]}
                  </Badge>
                  {!hall.isActive && (
                    <Badge className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 border-red-500/30 border">
                      Inactive
                    </Badge>
                  )}
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    onClick={e => { e.stopPropagation(); openEdit(hall) }}
                    className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(hall) }}
                    className="p-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <CardContent className="p-5 flex flex-col gap-3">
                <div>
                  <h3 className="font-bold text-white text-lg leading-tight">{hall.name}</h3>
                  {hall.floorNumber != null && (
                    <p className="text-xs text-white/40 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> Floor {hall.floorNumber}
                    </p>
                  )}
                  {hall.description && (
                    <p className="text-xs text-white/50 mt-2 line-clamp-2">{hall.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-[#1a1a24] p-2.5 rounded-xl border border-white/5 text-center">
                    <Users className="w-3.5 h-3.5 text-violet-400 mx-auto mb-1" />
                    <p className="text-xs text-white/40">Capacity</p>
                    <p className="font-bold text-white text-sm">{hall.capacity}</p>
                  </div>
                  <div className="bg-[#1a1a24] p-2.5 rounded-xl border border-white/5 text-center">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400 mx-auto mb-1" />
                    <p className="text-xs text-white/40">Hourly</p>
                    <p className="font-bold text-emerald-400 text-sm">${Number(hall.hourlyRate).toFixed(0)}</p>
                  </div>
                  <div className="bg-[#1a1a24] p-2.5 rounded-xl border border-white/5 text-center">
                    <CalendarDays className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
                    <p className="text-xs text-white/40">Daily</p>
                    <p className="font-bold text-amber-400 text-sm">${Number(hall.dailyRate).toFixed(0)}</p>
                  </div>
                </div>

                {hall.amenities?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {hall.amenities.slice(0, 4).map(a => (
                      <span key={a} className="text-xs px-2 py-0.5 bg-white/5 text-white/50 rounded-full border border-white/10">
                        {a}
                      </span>
                    ))}
                    {hall.amenities.length > 4 && (
                      <span className="text-xs px-2 py-0.5 bg-white/5 text-white/30 rounded-full border border-white/10">
                        +{hall.amenities.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                <div className="pt-3 border-t border-white/10 flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 text-xs"
                    onClick={() => router.push(`/admin/halls/${hall.id}`)}
                  >
                    <BookOpen className="w-3.5 h-3.5 mr-1" /> View & Book
                  </Button>
                  <button
                    onClick={() => handleToggleActive(hall)}
                    className={`px-3 rounded-lg border text-xs font-bold transition-colors ${
                      hall.isActive
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400'
                        : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400'
                    }`}
                    title={hall.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {hall.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}

          {filtered.length === 0 && !loading && (
            <div className="col-span-full py-16 text-center border-2 border-dashed border-white/10 rounded-xl text-white/40">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-bold">No halls found</p>
              <p className="text-sm mt-1">Click "New Hall" to create your first venue.</p>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      <ModalShell
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingHall ? `Edit: ${editingHall.name}` : 'Create New Hall / Venue'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FormField label="Hall Name">
                <Input
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="bg-[#1a1a24] border-white/10 text-white"
                  placeholder="e.g. Grand Ballroom"
                />
              </FormField>
            </div>

            <FormField label="Type">
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value as HallType })}
                className="w-full bg-[#1a1a24] border border-white/10 rounded-lg p-2.5 text-sm text-white"
              >
                {HALL_TYPES.map(t => <option key={t} value={t}>{HALL_TYPE_LABELS[t]}</option>)}
              </select>
            </FormField>

            <FormField label="Floor Number (Optional)">
              <Input
                type="number"
                value={form.floorNumber}
                onChange={e => setForm({ ...form, floorNumber: e.target.value })}
                className="bg-[#1a1a24] border-white/10 text-white"
                placeholder="e.g. 2"
              />
            </FormField>

            <FormField label="Capacity (persons)">
              <Input
                type="number"
                required
                min="1"
                value={form.capacity}
                onChange={e => setForm({ ...form, capacity: e.target.value })}
                className="bg-[#1a1a24] border-white/10 text-white"
              />
            </FormField>

            <FormField label="Hourly Rate ($)">
              <Input
                type="number"
                required
                min="0"
                step="0.01"
                value={form.hourlyRate}
                onChange={e => setForm({ ...form, hourlyRate: e.target.value })}
                className="bg-[#1a1a24] border-white/10 text-white"
              />
            </FormField>

            <FormField label="Daily Rate ($)">
              <Input
                type="number"
                required
                min="0"
                step="0.01"
                value={form.dailyRate}
                onChange={e => setForm({ ...form, dailyRate: e.target.value })}
                className="bg-[#1a1a24] border-white/10 text-white"
              />
            </FormField>

            <div className="col-span-2">
              <FormField label="Description">
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-[#1a1a24] border border-white/10 rounded-lg p-2.5 text-sm text-white resize-none"
                  rows={3}
                  placeholder="Describe this venue..."
                />
              </FormField>
            </div>

            <div className="col-span-2">
              <FormField label="Amenities" hint="Click to toggle amenities">
                <div className="flex flex-wrap gap-2 mt-2">
                  {DEFAULT_AMENITIES.map(a => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleAmenity(a)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${
                        form.amenities.includes(a)
                          ? 'bg-primary/20 border-primary/50 text-primary'
                          : 'bg-white/5 border-white/10 text-white/50 hover:border-white/30 hover:text-white'
                      }`}
                    >
                      {form.amenities.includes(a) && <CheckCircle className="w-3 h-3 inline mr-1" />}
                      {a}
                    </button>
                  ))}
                </div>
              </FormField>
            </div>

            <div className="col-span-2">
              <FormField label="Image URLs (one per line)" hint="Paste direct image links">
                <textarea
                  value={form.images.join('\n')}
                  onChange={e => setForm({ ...form, images: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })}
                  className="w-full bg-[#1a1a24] border border-white/10 rounded-lg p-2.5 text-sm text-white resize-none font-mono"
                  rows={2}
                  placeholder="https://example.com/hall.jpg"
                />
              </FormField>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" className="bg-primary text-white" disabled={saving}>
              {saving ? 'Saving...' : editingHall ? 'Update Hall' : 'Create Hall'}
            </Button>
          </div>
        </form>
      </ModalShell>
    </AdminPageShell>
  )
}
