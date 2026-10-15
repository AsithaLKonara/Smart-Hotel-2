"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  Sparkles, Plus, Edit, Trash2, Search, Filter, 
  DollarSign, Check, X, Upload, Loader2, Image as ImageIcon,
  Building2, Tag, ArrowUpDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import toast from 'react-hot-toast'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import { formatPrice } from '@/lib/utils'
import { useProperty } from '@/contexts/property-context'
import { useLuxuryConfirm } from '@/components/ui/luxury-confirm-dialog'

interface ExtraService {
  id: string
  name: string
  code: string
  description: string
  price: number | string
  priceType: 'PER_STAY' | 'PER_NIGHT' | 'PER_GUEST'
  imageUrl?: string | null
  icon?: string | null
  active: boolean
  order: number
  propertyId?: string | null
  property?: {
    id: string
    name: string
    city: string
    code: string
  } | null
}

export default function AdminStayServicesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { properties, activePropertyId } = useProperty()
  const { confirm } = useLuxuryConfirm()

  const [services, setServices] = useState<ExtraService[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [propertyFilter, setPropertyFilter] = useState('all')
  const [activeFilter, setActiveFilter] = useState('all')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<ExtraService | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    price: '',
    priceType: 'PER_STAY' as 'PER_STAY' | 'PER_NIGHT' | 'PER_GUEST',
    imageUrl: '',
    icon: '✨',
    active: true,
    order: 0,
    propertyId: ''
  })

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/stay-services')
      if (!res.ok) throw new Error('Failed to load services')
      const data = await res.json()
      setServices(data.items || [])
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to load stay extra services')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenCreate = () => {
    setEditingService(null)
    setFormData({
      name: '',
      code: '',
      description: '',
      price: '',
      priceType: 'PER_STAY',
      imageUrl: '',
      icon: '✨',
      active: true,
      order: services.length + 1,
      propertyId: (activePropertyId && activePropertyId !== 'all') ? activePropertyId : ''
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (item: ExtraService) => {
    setEditingService(item)
    setFormData({
      name: item.name,
      code: item.code,
      description: item.description,
      price: String(item.price),
      priceType: item.priceType,
      imageUrl: item.imageUrl || '',
      icon: item.icon || '✨',
      active: item.active,
      order: item.order,
      propertyId: item.propertyId || ''
    })
    setIsModalOpen(true)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    const uploadForm = new FormData()
    uploadForm.append('file', file)
    uploadForm.append('folder', 'stay-extras')

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadForm
      })

      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      if (data.url) {
        setFormData(prev => ({ ...prev, imageUrl: data.url }))
        toast.success('Image uploaded successfully')
      }
    } catch (err: any) {
      toast.error('Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('Name and code are required')
      return
    }

    const priceNum = parseFloat(formData.price)
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error('Please enter a valid price')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim(),
        price: priceNum,
        priceType: formData.priceType,
        imageUrl: formData.imageUrl.trim() || null,
        icon: formData.icon.trim() || '✨',
        active: formData.active,
        order: Number(formData.order) || 0,
        propertyId: formData.propertyId || null
      }

      const url = editingService 
        ? `/api/admin/stay-services/${editingService.id}`
        : '/api/admin/stay-services'
      const method = editingService ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to save service')
      }

      toast.success(editingService ? 'Extra service updated' : 'Extra service created')
      setIsModalOpen(false)
      fetchServices()
    } catch (err: any) {
      toast.error(err.message || 'Error saving service')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (item: ExtraService) => {
    const approved = await confirm({
      title: `Delete "${item.name}"?`,
      description: 'This will remove this stay extra service from current and future guest reservation options. This action cannot be undone.',
      confirmText: 'Delete Service',
      variant: 'danger'
    })

    if (!approved) return

    try {
      const res = await fetch(`/api/admin/stay-services/${item.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete service')
      toast.success('Extra service deleted')
      fetchServices()
    } catch (err: any) {
      toast.error(err.message || 'Error deleting service')
    }
  }

  const handleToggleActive = async (item: ExtraService) => {
    try {
      const res = await fetch(`/api/admin/stay-services/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !item.active })
      })

      if (!res.ok) throw new Error('Failed to toggle status')
      toast.success(`Service is now ${!item.active ? 'Active' : 'Inactive'}`)
      fetchServices()
    } catch (err: any) {
      toast.error('Failed to update status')
    }
  }

  const filteredServices = services.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesProperty = 
      propertyFilter === 'all' || 
      (propertyFilter === 'global' && !item.propertyId) ||
      item.propertyId === propertyFilter

    const matchesActive = 
      activeFilter === 'all' ||
      (activeFilter === 'active' && item.active) ||
      (activeFilter === 'inactive' && !item.active)

    return matchesSearch && matchesProperty && matchesActive
  })

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-transparent">
        <PremiumSpinner size="lg" text="Loading Stay Extra Services..." />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-white">
      <Breadcrumbs
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Stay Extra Services' },
        ]}
        className="mb-2"
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-luxury">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-bold text-white tracking-wide">
                Stay Extra Services
              </h1>
              <p className="text-white/50 text-xs mt-0.5">
                Manage bespoke ancillary amenities, luxury packages, pricing, and guest options
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-gold-gradient hover:opacity-90 text-white font-bold text-xs uppercase tracking-wider px-6 h-11 rounded-xl shadow-luxury border-none"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Extra Service
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#0f0f13] border-white/10">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-white/40">Total Extras</p>
              <p className="text-3xl font-serif font-bold text-white mt-1">{services.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0f0f13] border-white/10">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-white/40">Active in Booking</p>
              <p className="text-3xl font-serif font-bold text-emerald-400 mt-1">
                {services.filter(s => s.active).length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Check className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0f0f13] border-white/10">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-white/40">Global Portfolio Extras</p>
              <p className="text-3xl font-serif font-bold text-primary mt-1">
                {services.filter(s => !s.propertyId).length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Building2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0f0f13] border-white/10">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-white/40">Avg. Add-On Price</p>
              <p className="text-3xl font-serif font-bold text-white mt-1">
                {formatPrice(
                  services.length > 0
                    ? services.reduce((acc, s) => acc + Number(s.price), 0) / services.length
                    : 0
                )}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-amber-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-[#0f0f13] border border-white/10 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search service name, code, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/10 text-xs text-white pl-10 pr-4 py-2.5 rounded-xl placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <select
            value={propertyFilter}
            onChange={(e) => setPropertyFilter(e.target.value)}
            className="bg-black/40 border border-white/10 text-xs text-white px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Destinations</option>
            <option value="global">Global (All Resorts)</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.city})</option>
            ))}
          </select>

          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="bg-black/40 border border-white/10 text-xs text-white px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <Card 
            key={service.id} 
            className="bg-[#0f0f13] border-white/10 overflow-hidden flex flex-col justify-between hover:border-primary/40 transition-all duration-300 group shadow-lg"
          >
            <div>
              {/* Media Header */}
              <div className="relative aspect-[16/9] w-full bg-black/40 overflow-hidden">
                {service.imageUrl ? (
                  <Image
                    src={service.imageUrl}
                    alt={service.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20">
                    <span className="text-5xl mb-2">{service.icon || '✨'}</span>
                    <span className="text-xs uppercase tracking-wider font-bold">No Image Configured</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                
                {/* Floating Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="text-xl bg-black/60 backdrop-blur-md w-8 h-8 rounded-lg flex items-center justify-center border border-white/10">
                    {service.icon || '✨'}
                  </span>
                  <Badge variant="outline" className="bg-black/60 backdrop-blur-md border-white/20 text-white font-mono text-[10px]">
                    {service.code}
                  </Badge>
                </div>

                <div className="absolute top-3 right-3">
                  <button
                    onClick={() => handleToggleActive(service)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md transition-all ${
                      service.active
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {service.active ? 'Active' : 'Inactive'}
                  </button>
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                  <div className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                    <span className="text-primary font-serif font-bold text-lg">
                      {formatPrice(Number(service.price))}
                    </span>
                    <span className="text-white/50 text-[10px] ml-1 uppercase">
                      / {service.priceType.replace('PER_', '').toLowerCase()}
                    </span>
                  </div>

                  <span className="text-[10px] text-white/60 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                    {service.property ? service.property.city : 'All Resorts'}
                  </span>
                </div>
              </div>

              {/* Service Info */}
              <div className="p-5 space-y-2">
                <h3 className="text-xl font-serif font-bold text-white group-hover:text-primary transition-colors">
                  {service.name}
                </h3>
                <p className="text-white/60 text-xs font-light leading-relaxed line-clamp-3">
                  {service.description}
                </p>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-5 pt-0 border-t border-white/5 mt-4 flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenEdit(service)}
                className="flex-1 border-white/10 hover:border-primary/40 text-white/80 hover:text-white h-9 rounded-xl text-xs"
              >
                <Edit className="w-3.5 h-3.5 mr-1.5 text-primary" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(service)}
                className="border-rose-500/20 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/40 h-9 rounded-xl text-xs px-3"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-20 bg-[#0f0f13] border border-white/10 rounded-2xl space-y-4">
          <Sparkles className="w-12 h-12 text-white/20 mx-auto" />
          <h3 className="text-xl font-serif font-bold text-white">No Extra Services Found</h3>
          <p className="text-white/50 text-xs max-w-md mx-auto font-light">
            No stay extras matched your active search or destination filters. Try adjusting filters or create a new service.
          </p>
          <Button onClick={handleOpenCreate} className="bg-gold-gradient text-white font-bold text-xs uppercase px-6 h-10 rounded-xl">
            <Plus className="w-4 h-4 mr-2" /> Add Extra Service
          </Button>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-[#111116] border-white/10 text-white max-w-xl p-6 rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-white/10 pb-4">
            <DialogTitle className="text-2xl font-serif font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {editingService ? 'Edit Stay Extra Service' : 'Create New Stay Extra Service'}
            </DialogTitle>
            <DialogDescription className="text-white/50 text-xs">
              Configure ancillary stay add-ons, pricing models, and luxury imagery displayed to guests.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-bold text-white/70">Service Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Champagne Breakfast"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-bold text-white/70">Unique Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BREAKFAST"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-primary font-mono focus:outline-none focus:ring-1 focus:ring-primary uppercase"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider font-bold text-white/70">Description *</label>
              <textarea
                required
                rows={3}
                placeholder="Describe what the guest receives with this service..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-bold text-white/70">Price ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="50.00"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-bold text-white/70">Pricing Frequency</label>
                <select
                  value={formData.priceType}
                  onChange={e => setFormData({ ...formData, priceType: e.target.value as any })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="PER_STAY">Per Stay (One-time)</option>
                  <option value="PER_NIGHT">Per Night</option>
                  <option value="PER_GUEST">Per Guest</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-bold text-white/70">Emoji / Icon</label>
                <input
                  type="text"
                  placeholder="🥐"
                  value={formData.icon}
                  onChange={e => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white text-center text-lg focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-bold text-white/70">Property Scope</label>
                <select
                  value={formData.propertyId}
                  onChange={e => setFormData({ ...formData, propertyId: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Global (All Resorts)</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.city})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-bold text-white/70">Display Order</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Image Upload / URL */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <label className="text-xs uppercase tracking-wider font-bold text-white/70 flex items-center justify-between">
                <span>Service Image</span>
                {uploadingImage && <span className="text-primary text-[10px] flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Uploading...</span>}
              </label>

              <div className="flex gap-4 items-center">
                <div className="relative w-24 h-24 rounded-xl border border-white/10 bg-black/40 overflow-hidden shrink-0 flex items-center justify-center">
                  {formData.imageUrl ? (
                    <Image src={formData.imageUrl} alt="Preview" fill className="object-cover" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-white/20" />
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3.5 py-2 text-xs font-bold text-white flex items-center gap-2 transition-all">
                      <Upload className="w-3.5 h-3.5 text-primary" />
                      Upload File
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                    <span className="text-[10px] text-white/40">or enter direct URL</span>
                  </div>

                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.imageUrl}
                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="activeToggle"
                checked={formData.active}
                onChange={e => setFormData({ ...formData, active: e.target.checked })}
                className="w-4 h-4 rounded text-primary focus:ring-primary border-white/20 bg-black/40 cursor-pointer"
              />
              <label htmlFor="activeToggle" className="text-xs text-white/80 cursor-pointer">
                Active (Display immediately on booking flow for guest selection)
              </label>
            </div>

            <DialogFooter className="pt-4 border-t border-white/10 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="border-white/10 text-white/70 hover:text-white rounded-xl text-xs uppercase"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gold-gradient text-white font-bold text-xs uppercase px-6 rounded-xl border-none shadow-luxury"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingService ? 'Save Changes' : 'Create Service'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
