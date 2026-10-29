"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  Sparkles, Plus, Edit, Trash2, Search, Filter, 
  DollarSign, Check, X, Upload, Loader2, Image as ImageIcon,
  Building2, Tag, ArrowUpDown, Layers, CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import toast from 'react-hot-toast'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import { formatPrice } from '@/lib/utils'
import { useProperty } from '@/contexts/property-context'
import { useLuxuryConfirm } from '@/components/ui/luxury-confirm-dialog'
import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell'

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
  const [propertyFilter, setPropertyFilter] = useState<string>('all')
  const [activeFilter, setActiveFilter] = useState<string>('all')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<ExtraService | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    price: '',
    priceType: 'PER_STAY' as 'PER_STAY' | 'PER_NIGHT' | 'PER_GUEST',
    imageUrl: '',
    icon: '🥐',
    active: true,
    order: 0,
    propertyId: '',
  })
  const [uploadingImage, setUploadingImage] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    if (status === 'authenticated') {
      fetchServices()
    }
  }, [status, activePropertyId])

  const fetchServices = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/stay-services')
      if (res.ok) {
        const data = await res.json()
        setServices(data.services || [])
      } else {
        toast.error('Failed to load stay extra services')
      }
    } catch (err) {
      console.error(err)
      toast.error('Network error loading extra services')
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
      icon: '🥐',
      active: true,
      order: 0,
      propertyId: activePropertyId && activePropertyId !== 'all' ? activePropertyId : '',
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (service: ExtraService) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      code: service.code,
      description: service.description,
      price: String(service.price),
      priceType: service.priceType,
      imageUrl: service.imageUrl || '',
      icon: service.icon || '✨',
      active: service.active,
      order: service.order || 0,
      propertyId: service.propertyId || '',
    })
    setIsModalOpen(true)
  }

  const handleToggleActive = async (service: ExtraService) => {
    try {
      const res = await fetch(`/api/admin/stay-services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !service.active }),
      })
      if (res.ok) {
        toast.success(`Service ${!service.active ? 'activated' : 'deactivated'}`)
        fetchServices()
      } else {
        toast.error('Failed to toggle status')
      }
    } catch (err) {
      toast.error('Error toggling service status')
    }
  }

  const handleDelete = async (service: ExtraService) => {
    const approved = await confirm({
      title: 'Remove Stay Service',
      message: `Are you sure you want to delete "${service.name}"? This action cannot be undone.`,
      confirmText: 'Delete Service',
      isDestructive: true,
    })
    if (!approved) return

    try {
      const res = await fetch(`/api/admin/stay-services/${service.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success('Service successfully removed')
        fetchServices()
      } else {
        toast.error('Failed to delete service')
      }
    } catch (err) {
      toast.error('Error deleting service')
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    const uploadToast = toast.loading('Uploading media asset...')
    try {
      const form = new FormData()
      form.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: form,
      })

      if (res.ok) {
        const data = await res.json()
        setFormData(prev => ({ ...prev, imageUrl: data.url }))
        toast.success('Asset uploaded successfully', { id: uploadToast })
      } else {
        toast.error('Failed to upload image', { id: uploadToast })
      }
    } catch (err) {
      toast.error('Upload error', { id: uploadToast })
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const url = editingService
        ? `/api/admin/stay-services/${editingService.id}`
        : '/api/admin/stay-services'
      const method = editingService ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price) || 0,
          propertyId: formData.propertyId || null,
        }),
      })

      if (res.ok) {
        toast.success(editingService ? 'Service updated' : 'Service created')
        setIsModalOpen(false)
        fetchServices()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Operation failed')
      }
    } catch (err: any) {
      toast.error(err.message || 'Operation failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filtered Services
  const filteredServices = services.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesProperty =
      propertyFilter === 'all'
        ? true
        : propertyFilter === 'global'
        ? !s.propertyId
        : s.propertyId === propertyFilter

    const matchesActive =
      activeFilter === 'all'
        ? true
        : activeFilter === 'active'
        ? s.active
        : !s.active

    return matchesSearch && matchesProperty && matchesActive
  })

  if (loading && services.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#090A0C]">
        <PremiumSpinner size="lg" text="Loading Extra Services Studio..." />
      </div>
    )
  }

  return (
    <AdminPageShell
      title="Stay Extra Services"
      subtitle="Manage bespoke ancillary amenities, luxury packages, pricing models & guest options."
      actions={
        <Button
          onClick={handleOpenCreate}
          className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs font-mono uppercase tracking-wider h-9"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Add Extra Service
        </Button>
      }
    >
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-[#121417] border border-[#1E2227] rounded-xl shadow-none">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider font-mono text-zinc-500">Total Extras</p>
                <p className="text-2xl font-bold font-mono text-white mt-1">{services.length}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-[#181A1D] border border-[#2B3037] flex items-center justify-center text-zinc-400">
                <Sparkles className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#121417] border border-[#1E2227] rounded-xl shadow-none">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider font-mono text-zinc-500">Active in Booking</p>
                <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                  {services.filter(s => s.active).length}
                </p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Check className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#121417] border border-[#1E2227] rounded-xl shadow-none">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider font-mono text-zinc-500">Global Portfolio Extras</p>
                <p className="text-2xl font-bold font-mono text-white mt-1">
                  {services.filter(s => !s.propertyId).length}
                </p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-[#181A1D] border border-[#2B3037] flex items-center justify-center text-zinc-400">
                <Building2 className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#121417] border border-[#1E2227] rounded-xl shadow-none">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider font-mono text-zinc-500">Avg. Add-On Price</p>
                <p className="text-2xl font-bold font-mono text-white mt-1">
                  {formatPrice(
                    services.length > 0
                      ? services.reduce((acc, s) => acc + Number(s.price), 0) / services.length
                      : 0
                  )}
                </p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-[#181A1D] border border-[#2B3037] flex items-center justify-center text-zinc-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="bg-[#121417] border border-[#1E2227] p-3 rounded-xl flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search service name, code, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#181A1D] border border-[#2B3037] text-xs text-white pl-9 pr-3 py-2 rounded-lg font-mono placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
            <select
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
              className="bg-[#181A1D] border border-[#2B3037] text-xs text-zinc-200 px-3 py-2 rounded-lg font-mono focus:outline-none focus:border-zinc-500"
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
              className="bg-[#181A1D] border border-[#2B3037] text-xs text-zinc-200 px-3 py-2 rounded-lg font-mono focus:outline-none focus:border-zinc-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServices.map((service) => (
            <Card 
              key={service.id} 
              className="bg-[#121417] border border-[#1E2227] rounded-xl overflow-hidden flex flex-col justify-between hover:border-[#2B3037] transition-all group shadow-none"
            >
              <div>
                {/* Media Header */}
                <div className="relative aspect-[16/9] w-full bg-[#090A0C] overflow-hidden">
                  {service.imageUrl ? (
                    <Image
                      src={service.imageUrl}
                      alt={service.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600">
                      <span className="text-4xl mb-1">{service.icon || '✨'}</span>
                      <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">No Image Configured</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121417] via-transparent to-transparent" />
                  
                  {/* Floating Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="text-base bg-black/70 backdrop-blur-md w-7 h-7 rounded-md flex items-center justify-center border border-white/10">
                      {service.icon || '✨'}
                    </span>
                    <Badge className="bg-black/70 backdrop-blur-md border border-white/15 text-zinc-200 font-mono text-[10px]">
                      {service.code}
                    </Badge>
                  </div>

                  <div className="absolute top-3 right-3">
                    <button
                      onClick={() => handleToggleActive(service)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider border backdrop-blur-md transition-all ${
                        service.active
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {service.active ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between">
                    <div className="bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10">
                      <span className="text-white font-mono font-bold text-base">
                        {formatPrice(Number(service.price))}
                      </span>
                      <span className="text-zinc-400 text-[10px] ml-1 font-mono uppercase">
                        / {service.priceType.replace('PER_', '').toLowerCase()}
                      </span>
                    </div>

                    <span className="text-[10px] text-zinc-400 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded border border-white/10 font-mono">
                      {service.property ? service.property.city : 'All Resorts'}
                    </span>
                  </div>
                </div>

                {/* Service Info */}
                <div className="p-4 space-y-1.5">
                  <h3 className="text-sm font-semibold text-white font-mono group-hover:text-zinc-200 transition-colors">
                    {service.name}
                  </h3>
                  <p className="text-zinc-400 text-xs font-sans leading-relaxed line-clamp-3">
                    {service.description}
                  </p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 pt-0 border-t border-[#1E2227] mt-3 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEdit(service)}
                  className="flex-1 border-[#1E2227] bg-[#141619] hover:bg-[#181A1D] text-zinc-300 hover:text-white h-8 rounded-lg text-xs font-mono"
                >
                  <Edit className="w-3 h-3 mr-1.5 text-zinc-400" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(service)}
                  className="border-rose-500/20 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/40 h-8 rounded-lg text-xs px-2.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center py-16 bg-[#121417] border border-[#1E2227] rounded-xl space-y-3">
            <Sparkles className="w-8 h-8 text-zinc-600 mx-auto" />
            <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">No Extra Services Found</h3>
            <p className="text-zinc-500 text-xs max-w-md mx-auto font-sans">
              No stay extras matched your active search or destination filters. Try adjusting filters or create a new service.
            </p>
            <Button 
              onClick={handleOpenCreate} 
              className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs font-mono uppercase tracking-wider h-8 px-4"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Extra Service
            </Button>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-[#121417] border border-[#1E2227] text-zinc-100 max-w-xl p-6 rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-[#1E2227] pb-3">
            <DialogTitle className="text-base font-semibold text-white flex items-center gap-2 font-mono uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-zinc-400" />
              {editingService ? 'Edit Stay Extra Service' : 'Create New Stay Extra Service'}
            </DialogTitle>
            <DialogDescription className="text-zinc-500 text-xs">
              Configure ancillary stay add-ons, pricing models, and media displayed to guests.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Service Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Champagne Breakfast"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#181A1D] border border-[#2B3037] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BREAKFAST"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full bg-[#181A1D] border border-[#2B3037] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-zinc-500 uppercase"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Description *</label>
              <textarea
                required
                rows={3}
                placeholder="Describe what the guest receives with this service..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-[#181A1D] border border-[#2B3037] rounded-lg px-3 py-2 text-xs text-white font-sans focus:outline-none focus:border-zinc-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Price ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="50.00"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: e.target.value })}
                  className="w-full bg-[#181A1D] border border-[#2B3037] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Frequency</label>
                <select
                  value={formData.priceType}
                  onChange={e => setFormData({ ...formData, priceType: e.target.value as any })}
                  className="w-full bg-[#181A1D] border border-[#2B3037] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-zinc-500"
                >
                  <option value="PER_STAY">Per Stay (One-time)</option>
                  <option value="PER_NIGHT">Per Night</option>
                  <option value="PER_GUEST">Per Guest</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Emoji / Icon</label>
                <input
                  type="text"
                  placeholder="🥐"
                  value={formData.icon}
                  onChange={e => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full bg-[#181A1D] border border-[#2B3037] rounded-lg px-3 py-2 text-xs text-white text-center text-base focus:outline-none focus:border-zinc-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Property Scope</label>
                <select
                  value={formData.propertyId}
                  onChange={e => setFormData({ ...formData, propertyId: e.target.value })}
                  className="w-full bg-[#181A1D] border border-[#2B3037] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-zinc-500"
                >
                  <option value="">Global (All Resorts)</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.city})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Display Order</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  className="w-full bg-[#181A1D] border border-[#2B3037] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-zinc-500"
                />
              </div>
            </div>

            {/* Image Upload / URL */}
            <div className="space-y-2 pt-2 border-t border-[#1E2227]">
              <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                <span>Service Image</span>
                {uploadingImage && <span className="text-zinc-400 text-[10px] font-mono flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Uploading...</span>}
              </label>

              <div className="flex gap-3 items-center">
                <div className="relative w-20 h-20 rounded-lg border border-[#2B3037] bg-[#090A0C] overflow-hidden shrink-0 flex items-center justify-center">
                  {formData.imageUrl ? (
                    <Image src={formData.imageUrl} alt="Preview" fill className="object-cover" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-zinc-600" />
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer bg-[#181A1D] hover:bg-[#20242A] border border-[#2B3037] rounded-lg px-3 py-1.5 text-xs font-mono text-white flex items-center gap-1.5 transition-all">
                      <Upload className="w-3.5 h-3.5 text-zinc-400" />
                      Upload File
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                    <span className="text-[10px] text-zinc-500 font-mono">or enter direct URL</span>
                  </div>

                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.imageUrl}
                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full bg-[#181A1D] border border-[#2B3037] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <input
                type="checkbox"
                id="activeToggle"
                checked={formData.active}
                onChange={e => setFormData({ ...formData, active: e.target.checked })}
                className="w-4 h-4 rounded text-white border-[#2B3037] bg-[#181A1D] accent-white cursor-pointer"
              />
              <label htmlFor="activeToggle" className="text-xs text-zinc-300 font-mono cursor-pointer">
                Active (Display immediately on booking flow for guest selection)
              </label>
            </div>

            <DialogFooter className="pt-3 border-t border-[#1E2227] flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
                className="text-xs text-zinc-400 hover:text-white font-mono h-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs font-mono uppercase tracking-wider h-8 px-4"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                {editingService ? 'Save Changes' : 'Create Service'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  )
}
