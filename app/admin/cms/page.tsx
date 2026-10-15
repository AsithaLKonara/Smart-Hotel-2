"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useProperty } from '@/contexts/property-context'
import { 
  Globe, 
  MapPin, 
  Image as ImageIcon, 
  Sparkles, 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  ExternalLink, 
  Clock, 
  DollarSign, 
  Tag, 
  Layers, 
  Check, 
  Loader2,
  Eye,
  Filter,
  Navigation,
  ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { useLuxuryConfirm } from '@/components/ui/luxury-confirm-dialog'

type CmsTab = 'properties' | 'gallery' | 'experiences' | 'facilities'

export default function AdminCmsStudioPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const confirm = useLuxuryConfirm()
  const { activePropertyId, properties: contextProperties } = useProperty()

  const [activeTab, setActiveTab] = useState<CmsTab>('properties')
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  // Data states
  const [properties, setProperties] = useState<any[]>([])
  const [galleryItems, setGalleryItems] = useState<any[]>([])
  const [experiences, setExperiences] = useState<any[]>([])
  const [facilities, setFacilities] = useState<any[]>([])

  // Modal states
  const [propertyModalOpen, setPropertyModalOpen] = useState(false)
  const [galleryModalOpen, setGalleryModalOpen] = useState(false)
  const [experienceModalOpen, setExperienceModalOpen] = useState(false)
  const [facilityModalOpen, setFacilityModalOpen] = useState(false)

  // Edit states
  const [editingItem, setEditingItem] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  // Form states
  const [propertyForm, setPropertyForm] = useState({
    name: '',
    description: '',
    mainImage: '',
    address: '',
    city: '',
    country: '',
    phone: '',
    email: '',
    latitude: '',
    longitude: '',
    googleMapsUrl: '',
  })

  const [galleryForm, setGalleryForm] = useState({
    title: '',
    imageUrl: '',
    category: 'ROOMS',
    caption: '',
    order: 0,
    featured: false,
    propertyId: '',
  })

  const [experienceForm, setExperienceForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    imageUrl: '',
    icon: '✨',
    category: 'LUXURY',
    duration: '',
    price: '',
    order: 0,
    active: true,
    propertyId: '',
  })

  const [facilityForm, setFacilityForm] = useState({
    name: '',
    type: 'POOL',
    subtitle: '',
    description: '',
    imageUrl: '',
    features: '',
    operatingHours: '09:00 - 18:00',
    status: 'ACTIVE',
    featured: true,
    order: 0,
    propertyId: '',
  })

  // Sync activePropertyId if set
  useEffect(() => {
    if (activePropertyId && activePropertyId !== 'all') {
      setSelectedPropertyFilter(activePropertyId)
    }
  }, [activePropertyId])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    if (status === 'authenticated') {
      fetchAllData()
    }
  }, [status, selectedPropertyFilter])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      const propParam = selectedPropertyFilter !== 'all' ? `?propertyId=${selectedPropertyFilter}` : ''

      const [propsRes, gallRes, expRes, facRes] = await Promise.all([
        fetch('/api/admin/cms/properties'),
        fetch(`/api/admin/cms/gallery${propParam}`),
        fetch(`/api/admin/cms/experiences${propParam}`),
        fetch(`/api/admin/cms/facilities${propParam}`),
      ])

      if (propsRes.ok) {
        const data = await propsRes.json()
        setProperties(data.properties || [])
      }
      if (gallRes.ok) {
        const data = await gallRes.json()
        setGalleryItems(data.items || [])
      }
      if (expRes.ok) {
        const data = await expRes.json()
        setExperiences(data.items || [])
      }
      if (facRes.ok) {
        const data = await facRes.json()
        setFacilities(data.items || [])
      }
    } catch (error) {
      console.error('Failed to load CMS data:', error)
      toast.error('Failed to load CMS data')
    } finally {
      setLoading(false)
    }
  }

  // ==========================================
  // PROPERTY ACTIONS
  // ==========================================

  const handleEditProperty = (prop: any) => {
    setEditingItem(prop)
    setPropertyForm({
      name: prop.name || '',
      description: prop.description || '',
      mainImage: prop.mainImage || '',
      address: prop.address || '',
      city: prop.city || '',
      country: prop.country || '',
      phone: prop.phone || '',
      email: prop.email || '',
      latitude: prop.latitude !== null && prop.latitude !== undefined ? String(prop.latitude) : '',
      longitude: prop.longitude !== null && prop.longitude !== undefined ? String(prop.longitude) : '',
      googleMapsUrl: prop.googleMapsUrl || '',
    })
    setPropertyModalOpen(true)
  }

  const handleSaveProperty = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/cms/properties/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...propertyForm,
          latitude: propertyForm.latitude ? parseFloat(propertyForm.latitude) : null,
          longitude: propertyForm.longitude ? parseFloat(propertyForm.longitude) : null,
        })
      })
      if (!res.ok) throw new Error('Failed to update property')
      toast.success('Property location & details updated')
      setPropertyModalOpen(false)
      fetchAllData()
    } catch (err: any) {
      toast.error(err.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  // ==========================================
  // GALLERY ACTIONS
  // ==========================================

  const handleOpenGalleryModal = (item?: any) => {
    if (item) {
      setEditingItem(item)
      setGalleryForm({
        title: item.title,
        imageUrl: item.imageUrl,
        category: item.category,
        caption: item.caption || '',
        order: item.order || 0,
        featured: !!item.featured,
        propertyId: item.propertyId,
      })
    } else {
      setEditingItem(null)
      const defaultPropId = selectedPropertyFilter !== 'all' ? selectedPropertyFilter : (properties[0]?.id || '')
      setGalleryForm({
        title: '',
        imageUrl: '',
        category: 'ROOMS',
        caption: '',
        order: galleryItems.length + 1,
        featured: false,
        propertyId: defaultPropId,
      })
    }
    setGalleryModalOpen(true)
  }

  const handleSaveGallery = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const url = editingItem ? `/api/admin/cms/gallery/${editingItem.id}` : '/api/admin/cms/gallery'
      const method = editingItem ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(galleryForm)
      })
      if (!res.ok) throw new Error(editingItem ? 'Failed to update' : 'Failed to create')
      toast.success(editingItem ? 'Gallery item updated' : 'Gallery item created')
      setGalleryModalOpen(false)
      fetchAllData()
    } catch (err: any) {
      toast.error(err.message || 'Operation failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteGallery = async (id: string) => {
    const approved = await confirm({
      title: 'Remove Gallery Item',
      message: 'Are you sure you want to delete this photo from the public hotel gallery? This action is immediate.',
      confirmText: 'Delete Photo',
      isDestructive: true
    })
    if (!approved) return
    try {
      const res = await fetch(`/api/admin/cms/gallery/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Gallery item removed')
      fetchAllData()
    } catch (err: any) {
      toast.error(err.message || 'Delete failed')
    }
  }

  // ==========================================
  // EXPERIENCE ACTIONS
  // ==========================================

  const handleOpenExperienceModal = (item?: any) => {
    if (item) {
      setEditingItem(item)
      setExperienceForm({
        title: item.title,
        subtitle: item.subtitle || '',
        description: item.description,
        imageUrl: item.imageUrl,
        icon: item.icon || '✨',
        category: item.category || 'LUXURY',
        duration: item.duration || '',
        price: item.price ? String(item.price) : '',
        order: item.order || 0,
        active: !!item.active,
        propertyId: item.propertyId,
      })
    } else {
      setEditingItem(null)
      const defaultPropId = selectedPropertyFilter !== 'all' ? selectedPropertyFilter : (properties[0]?.id || '')
      setExperienceForm({
        title: '',
        subtitle: '',
        description: '',
        imageUrl: '',
        icon: '✨',
        category: 'LUXURY',
        duration: '2 Hours',
        price: '',
        order: experiences.length + 1,
        active: true,
        propertyId: defaultPropId,
      })
    }
    setExperienceModalOpen(true)
  }

  const handleSaveExperience = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const url = editingItem ? `/api/admin/cms/experiences/${editingItem.id}` : '/api/admin/cms/experiences'
      const method = editingItem ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...experienceForm,
          price: experienceForm.price ? parseFloat(experienceForm.price) : null
        })
      })
      if (!res.ok) throw new Error(editingItem ? 'Failed to update' : 'Failed to create')
      toast.success(editingItem ? 'Experience updated' : 'Experience created')
      setExperienceModalOpen(false)
      fetchAllData()
    } catch (err: any) {
      toast.error(err.message || 'Operation failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteExperience = async (id: string) => {
    const approved = await confirm({
      title: 'Remove Signature Experience',
      message: 'Are you sure you want to delete this signature experience from the public catalog?',
      confirmText: 'Delete Experience',
      isDestructive: true
    })
    if (!approved) return
    try {
      const res = await fetch(`/api/admin/cms/experiences/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Experience removed')
      fetchAllData()
    } catch (err: any) {
      toast.error(err.message || 'Delete failed')
    }
  }

  // ==========================================
  // FACILITY ACTIONS
  // ==========================================

  const handleOpenFacilityModal = (item?: any) => {
    if (item) {
      setEditingItem(item)
      setFacilityForm({
        name: item.name,
        type: item.type,
        subtitle: item.subtitle || '',
        description: item.description || '',
        imageUrl: item.imageUrl || '',
        features: item.features || '',
        operatingHours: item.operatingHours || '09:00 - 18:00',
        status: item.status || 'ACTIVE',
        featured: !!item.featured,
        order: item.order || 0,
        propertyId: item.propertyId,
      })
    } else {
      setEditingItem(null)
      const defaultPropId = selectedPropertyFilter !== 'all' ? selectedPropertyFilter : (properties[0]?.id || '')
      setFacilityForm({
        name: '',
        type: 'POOL',
        subtitle: '',
        description: '',
        imageUrl: '',
        features: '',
        operatingHours: '08:00 - 22:00',
        status: 'ACTIVE',
        featured: true,
        order: facilities.length + 1,
        propertyId: defaultPropId,
      })
    }
    setFacilityModalOpen(true)
  }

  const handleSaveFacility = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const url = editingItem ? `/api/admin/cms/facilities/${editingItem.id}` : '/api/admin/cms/facilities'
      const method = editingItem ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(facilityForm)
      })
      if (!res.ok) throw new Error(editingItem ? 'Failed to update' : 'Failed to create')
      toast.success(editingItem ? 'Facility updated' : 'Facility created')
      setFacilityModalOpen(false)
      fetchAllData()
    } catch (err: any) {
      toast.error(err.message || 'Operation failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteFacility = async (id: string) => {
    const approved = await confirm({
      title: 'Remove Resort Facility',
      message: 'Are you sure you want to delete this facility? It will no longer appear on the public facilities showcase.',
      confirmText: 'Delete Facility',
      isDestructive: true
    })
    if (!approved) return
    try {
      const res = await fetch(`/api/admin/cms/facilities/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Facility removed')
      fetchAllData()
    } catch (err: any) {
      toast.error(err.message || 'Delete failed')
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 lg:p-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-primary uppercase tracking-[0.25em] text-xs font-bold mb-2">
            <Globe className="w-4 h-4" />
            <span>Content Management Studio</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-serif font-bold tracking-tight">
            Hotel & Website <span className="text-primary italic">CMS</span>
          </h1>
          <p className="text-white/50 text-sm mt-1">
            Orchestrate multi-property imagery, map pinpoints, signature experiences, and luxury facilities.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Property Selector */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
            <Filter className="w-4 h-4 text-primary" />
            <span className="text-xs text-white/50">Property:</span>
            <select
              value={selectedPropertyFilter}
              onChange={(e) => setSelectedPropertyFilter(e.target.value)}
              className="bg-transparent text-xs font-medium text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#121118] text-white">All Properties</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#121118] text-white">
                  {p.name} ({p.city})
                </option>
              ))}
            </select>
          </div>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider text-white transition-all"
          >
            <Eye className="w-3.5 h-3.5 text-primary" />
            <span>Preview Site</span>
          </a>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4 overflow-x-auto custom-scrollbar">
        {[
          { id: 'properties', label: 'Properties & Map Pins', icon: MapPin, count: properties.length },
          { id: 'gallery', label: 'Gallery Hub', icon: ImageIcon, count: galleryItems.length },
          { id: 'experiences', label: 'Signature Experiences', icon: Sparkles, count: experiences.length },
          { id: 'facilities', label: 'Facilities & Amenities', icon: Building2, count: facilities.length },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as CmsTab)}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-primary/20 text-primary border border-primary/40 shadow-luxury'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                isActive ? 'bg-primary text-black font-extrabold' : 'bg-white/10 text-white/60'
              }`}>
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Main Content Areas */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-4 text-white/50">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-light">Loading CMS assets...</p>
        </div>
      ) : (
        <>
          {/* ======================================================== */}
          {/* TAB 1: PROPERTIES & MAP PINS */}
          {/* ======================================================== */}
          {activeTab === 'properties' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-serif font-bold">Property Profiles & Geolocation Pins</h3>
                  <p className="text-xs text-white/50">Configure geographic coordinates (`lat`, `lng`), addresses, and hero photography for interactive website pinpoints.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((prop) => (
                  <div
                    key={prop.id}
                    className="group bg-[#121118] border border-white/10 hover:border-primary/40 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-[16/9] w-full overflow-hidden bg-black/40">
                        <Image
                          src={prop.mainImage || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=800'}
                          alt={prop.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                          unoptimized={!!prop.mainImage}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-black/70 text-primary border border-primary/30 uppercase tracking-widest text-[9px]">
                            {prop.code}
                          </Badge>
                        </div>
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                          <span className="text-xs font-bold text-white flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-primary" />
                            {prop.city}, {prop.country}
                          </span>
                          <span className="text-[10px] text-white/70 uppercase tracking-wider bg-black/60 px-2 py-0.5 rounded">
                            {prop.status}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 space-y-4">
                        <div>
                          <h4 className="text-lg font-serif font-bold text-white group-hover:text-primary transition-colors">
                            {prop.name}
                          </h4>
                          <p className="text-xs text-white/60 line-clamp-2 mt-1">
                            {prop.description || 'No description configured.'}
                          </p>
                        </div>

                        {/* Coordinates & Location Pin Box */}
                        <div className="bg-white/5 border border-white/5 rounded-xl p-3 space-y-2 text-xs">
                          <div className="flex items-center justify-between text-white/70">
                            <span className="flex items-center gap-1.5 text-primary font-bold">
                              <Navigation className="w-3.5 h-3.5" />
                              Coordinates:
                            </span>
                            <span className="font-mono text-[11px] text-white">
                              {prop.latitude && prop.longitude ? `${prop.latitude.toFixed(4)}, ${prop.longitude.toFixed(4)}` : 'Not set'}
                            </span>
                          </div>
                          <div className="text-[11px] text-white/50 truncate">
                            <span className="text-white/70 font-medium">Address:</span> {prop.address}
                          </div>
                        </div>

                        {/* CMS Counts */}
                        <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-white/60 pt-1">
                          <div className="bg-white/5 py-1.5 rounded-lg border border-white/5">
                            <span className="block font-bold text-white text-xs">{prop._count?.galleries || 0}</span>
                            <span>Photos</span>
                          </div>
                          <div className="bg-white/5 py-1.5 rounded-lg border border-white/5">
                            <span className="block font-bold text-white text-xs">{prop._count?.experiences || 0}</span>
                            <span>Experiences</span>
                          </div>
                          <div className="bg-white/5 py-1.5 rounded-lg border border-white/5">
                            <span className="block font-bold text-white text-xs">{prop._count?.resortFacilities || 0}</span>
                            <span>Facilities</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 pt-0 flex gap-2">
                      <Button
                        onClick={() => handleEditProperty(prop)}
                        className="flex-1 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 h-9 rounded-xl text-xs font-bold"
                      >
                        <Edit className="w-3.5 h-3.5 mr-1.5" />
                        Edit Geolocation
                      </Button>
                      {prop.googleMapsUrl && (
                        <a
                          href={prop.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 h-9 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 hover:text-white transition-colors"
                          title="View on Google Maps"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: GALLERY HUB */}
          {/* ======================================================== */}
          {activeTab === 'gallery' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-serif font-bold">Multi-Property Gallery Media</h3>
                  <p className="text-xs text-white/50">Manage high-resolution photography, categorized suites, lobbies, and wellness assets.</p>
                </div>
                <Button
                  onClick={() => handleOpenGalleryModal()}
                  className="bg-gold-gradient text-white h-10 px-5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-luxury"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Media
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {galleryItems.map((item) => (
                  <div
                    key={item.id}
                    className="group relative bg-[#121118] border border-white/10 rounded-2xl overflow-hidden shadow-luxury flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-square w-full overflow-hidden bg-black/40">
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                        
                        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                          <Badge className="bg-black/60 text-primary border border-primary/30 text-[9px] uppercase tracking-wider">
                            {item.category}
                          </Badge>
                          {item.featured && (
                            <Badge className="bg-primary text-black font-bold text-[9px] uppercase tracking-wider">
                              Featured
                            </Badge>
                          )}
                        </div>

                        <div className="absolute bottom-2.5 left-2.5 right-2.5">
                          <p className="text-xs font-bold text-white truncate">{item.title}</p>
                          {item.caption && (
                            <p className="text-[10px] text-white/60 truncate">{item.caption}</p>
                          )}
                        </div>
                      </div>

                      <div className="p-3 text-[11px] text-white/50 flex items-center justify-between">
                        <span>Property:</span>
                        <span className="text-white font-medium truncate max-w-[120px]">
                          {item.property?.name || 'Assigned'}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 pt-0 flex gap-2">
                      <Button
                        onClick={() => handleOpenGalleryModal(item)}
                        variant="outline"
                        className="flex-1 border-white/10 hover:border-primary/40 h-8 rounded-lg text-[11px] text-white/80 hover:text-white"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDeleteGallery(item.id)}
                        variant="outline"
                        className="border-red-500/20 hover:bg-red-500/20 text-red-400 h-8 px-2.5 rounded-lg text-[11px]"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: SIGNATURE EXPERIENCES */}
          {/* ======================================================== */}
          {activeTab === 'experiences' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-serif font-bold">Signature Resort Experiences</h3>
                  <p className="text-xs text-white/50">Manage bespoke guest journeys, culinary tastings, wellness rituals, and yacht charters.</p>
                </div>
                <Button
                  onClick={() => handleOpenExperienceModal()}
                  className="bg-gold-gradient text-white h-10 px-5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-luxury"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Experience
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {experiences.map((exp) => (
                  <div
                    key={exp.id}
                    className="group bg-[#121118] border border-white/10 hover:border-primary/40 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/40">
                        <Image
                          src={exp.imageUrl}
                          alt={exp.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                        
                        <div className="absolute top-3 left-3 flex items-center gap-2">
                          <span className="w-8 h-8 rounded-lg bg-black/70 border border-primary/30 flex items-center justify-center text-lg shadow-luxury">
                            {exp.icon || '✨'}
                          </span>
                          <Badge className="bg-black/60 text-primary border border-primary/30 text-[9px] uppercase tracking-wider">
                            {exp.category}
                          </Badge>
                        </div>

                        <div className="absolute top-3 right-3">
                          <Badge className={exp.active ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/10 text-white/50'}>
                            {exp.active ? 'Active' : 'Archived'}
                          </Badge>
                        </div>

                        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                          <div>
                            <span className="text-[10px] text-primary uppercase tracking-widest font-bold">
                              {exp.subtitle || exp.property?.name}
                            </span>
                            <h4 className="text-lg font-serif font-bold text-white group-hover:text-primary transition-colors leading-tight">
                              {exp.title}
                            </h4>
                          </div>
                          {exp.price && (
                            <div className="bg-black/80 border border-primary/30 px-2.5 py-1 rounded-lg text-primary font-serif italic text-sm">
                              ${exp.price}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-5 space-y-3">
                        <p className="text-xs text-white/60 line-clamp-3 leading-relaxed">
                          {exp.description}
                        </p>

                        <div className="flex items-center justify-between text-xs text-white/50 pt-2 border-t border-white/5">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            {exp.duration || 'Flexible'}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-primary" />
                            {exp.property?.city || 'All Destinations'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 pt-0 flex gap-2">
                      <Button
                        onClick={() => handleOpenExperienceModal(exp)}
                        variant="outline"
                        className="flex-1 border-white/10 hover:border-primary/40 h-9 rounded-xl text-xs text-white/80 hover:text-white"
                      >
                        <Edit className="w-3.5 h-3.5 mr-1.5" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDeleteExperience(exp.id)}
                        variant="outline"
                        className="border-red-500/20 hover:bg-red-500/20 text-red-400 h-9 px-3 rounded-xl"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: FACILITIES MANAGEMENT */}
          {/* ======================================================== */}
          {activeTab === 'facilities' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-serif font-bold">Resort Facilities & Amenities</h3>
                  <p className="text-xs text-white/50">Manage infinity pools, elite fitness suites, wellness spas, and business boardrooms.</p>
                </div>
                <Button
                  onClick={() => handleOpenFacilityModal()}
                  className="bg-gold-gradient text-white h-10 px-5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-luxury"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Facility
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {facilities.map((fac) => {
                  const featureList = fac.features ? fac.features.split(',').map((f: string) => f.trim()).filter(Boolean) : []
                  return (
                    <div
                      key={fac.id}
                      className="group bg-[#121118] border border-white/10 hover:border-primary/40 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/40">
                          <Image
                            src={fac.imageUrl || 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&q=80&w=800'}
                            alt={fac.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                          <div className="absolute top-3 left-3 flex items-center gap-2">
                            <Badge className="bg-black/70 text-primary border border-primary/30 uppercase tracking-widest text-[9px]">
                              {fac.type}
                            </Badge>
                            {fac.featured && (
                              <Badge className="bg-primary text-black font-bold text-[9px] uppercase tracking-wider">
                                Featured
                              </Badge>
                            )}
                          </div>

                          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                            <div>
                              <span className="text-[10px] text-primary uppercase tracking-widest font-bold">
                                {fac.subtitle || fac.property?.name}
                              </span>
                              <h4 className="text-lg font-serif font-bold text-white group-hover:text-primary transition-colors leading-tight">
                                {fac.name}
                              </h4>
                            </div>
                            <span className="text-[10px] text-white/70 bg-black/60 px-2 py-0.5 rounded border border-white/10">
                              {fac.status}
                            </span>
                          </div>
                        </div>

                        <div className="p-5 space-y-4">
                          <p className="text-xs text-white/60 line-clamp-3 leading-relaxed">
                            {fac.description || 'No detailed description.'}
                          </p>

                          <div className="flex items-center gap-2 text-xs text-white/70 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                            <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="font-medium">Hours: {fac.operatingHours}</span>
                          </div>

                          {featureList.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {featureList.slice(0, 3).map((feat: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="text-[10px] bg-white/5 border border-white/5 text-white/70 px-2 py-0.5 rounded-md"
                                >
                                  {feat}
                                </span>
                              ))}
                              {featureList.length > 3 && (
                                <span className="text-[10px] text-primary font-bold px-1.5 py-0.5">
                                  +{featureList.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-5 pt-0 flex gap-2">
                        <Button
                          onClick={() => handleOpenFacilityModal(fac)}
                          variant="outline"
                          className="flex-1 border-white/10 hover:border-primary/40 h-9 rounded-xl text-xs text-white/80 hover:text-white"
                        >
                          <Edit className="w-3.5 h-3.5 mr-1.5" />
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDeleteFacility(fac.id)}
                          variant="outline"
                          className="border-red-500/20 hover:bg-red-500/20 text-red-400 h-9 px-3 rounded-xl"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: EDIT PROPERTY & GEOLOCATION */}
      {/* ======================================================== */}
      <Dialog open={propertyModalOpen} onOpenChange={setPropertyModalOpen}>
        <DialogContent className="bg-[#121118] border border-white/10 text-white max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif font-bold text-white">
              Edit Property Location & Coordinates
            </DialogTitle>
            <DialogDescription className="text-xs text-white/50">
              Configure coordinates and address details used for the website interactive location pin.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProperty} className="space-y-4 pt-2">
            <div>
              <label className="text-xs text-white/70 font-medium">Property Name</label>
              <Input
                value={propertyForm.name}
                onChange={(e) => setPropertyForm({ ...propertyForm, name: e.target.value })}
                required
                className="bg-black/40 border-white/10 text-white text-xs mt-1"
              />
            </div>

            <div>
              <label className="text-xs text-white/70 font-medium">Hero Image URL</label>
              <Input
                value={propertyForm.mainImage}
                onChange={(e) => setPropertyForm({ ...propertyForm, mainImage: e.target.value })}
                placeholder="https://..."
                className="bg-black/40 border-white/10 text-white text-xs mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-primary font-bold">Latitude (e.g. 25.7617)</label>
                <Input
                  type="number"
                  step="any"
                  value={propertyForm.latitude}
                  onChange={(e) => setPropertyForm({ ...propertyForm, latitude: e.target.value })}
                  placeholder="25.7617"
                  className="bg-black/40 border-primary/30 text-white text-xs mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-primary font-bold">Longitude (e.g. -80.1918)</label>
                <Input
                  type="number"
                  step="any"
                  value={propertyForm.longitude}
                  onChange={(e) => setPropertyForm({ ...propertyForm, longitude: e.target.value })}
                  placeholder="-80.1918"
                  className="bg-black/40 border-primary/30 text-white text-xs mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-white/70 font-medium">Google Maps Navigation URL</label>
              <Input
                value={propertyForm.googleMapsUrl}
                onChange={(e) => setPropertyForm({ ...propertyForm, googleMapsUrl: e.target.value })}
                placeholder="https://www.google.com/maps/..."
                className="bg-black/40 border-white/10 text-white text-xs mt-1"
              />
            </div>

            <div>
              <label className="text-xs text-white/70 font-medium">Address</label>
              <Input
                value={propertyForm.address}
                onChange={(e) => setPropertyForm({ ...propertyForm, address: e.target.value })}
                required
                className="bg-black/40 border-white/10 text-white text-xs mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/70 font-medium">City</label>
                <Input
                  value={propertyForm.city}
                  onChange={(e) => setPropertyForm({ ...propertyForm, city: e.target.value })}
                  required
                  className="bg-black/40 border-white/10 text-white text-xs mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-white/70 font-medium">Country</label>
                <Input
                  value={propertyForm.country}
                  onChange={(e) => setPropertyForm({ ...propertyForm, country: e.target.value })}
                  required
                  className="bg-black/40 border-white/10 text-white text-xs mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-white/70 font-medium">Description</label>
              <Textarea
                rows={3}
                value={propertyForm.description}
                onChange={(e) => setPropertyForm({ ...propertyForm, description: e.target.value })}
                className="bg-black/40 border-white/10 text-white text-xs mt-1"
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPropertyModalOpen(false)}
                className="border-white/10 text-white text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-gold-gradient text-white text-xs font-bold shadow-luxury"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* MODAL 2: GALLERY ITEM MODAL */}
      {/* ======================================================== */}
      <Dialog open={galleryModalOpen} onOpenChange={setGalleryModalOpen}>
        <DialogContent className="bg-[#121118] border border-white/10 text-white max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif font-bold text-white">
              {editingItem ? 'Edit Gallery Photo' : 'Add Media to Gallery'}
            </DialogTitle>
            <DialogDescription className="text-xs text-white/50">
              Upload or assign high-definition photography to property galleries.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveGallery} className="space-y-4 pt-2">
            <div>
              <label className="text-xs text-white/70 font-medium">Title</label>
              <Input
                value={galleryForm.title}
                onChange={(e) => setGalleryForm({ ...galleryForm, title: e.target.value })}
                placeholder="The Celestial Suite"
                required
                className="bg-black/40 border-white/10 text-white text-xs mt-1"
              />
            </div>

            <div>
              <label className="text-xs text-white/70 font-medium">Image URL</label>
              <Input
                value={galleryForm.imageUrl}
                onChange={(e) => setGalleryForm({ ...galleryForm, imageUrl: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                required
                className="bg-black/40 border-white/10 text-white text-xs mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/70 font-medium">Category</label>
                <select
                  value={galleryForm.category}
                  onChange={(e) => setGalleryForm({ ...galleryForm, category: e.target.value })}
                  className="w-full h-9 bg-black/40 border border-white/10 rounded-md px-3 text-xs text-white mt-1"
                >
                  <option value="ROOMS">Rooms & Suites</option>
                  <option value="DINING">Dining & Bar</option>
                  <option value="WELLNESS">Spa & Wellness</option>
                  <option value="LOBBY">Lobby & Architecture</option>
                  <option value="EVENTS">Events & Banquets</option>
                  <option value="EXTERIOR">Grounds & Exterior</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-white/70 font-medium">Property</label>
                <select
                  value={galleryForm.propertyId}
                  onChange={(e) => setGalleryForm({ ...galleryForm, propertyId: e.target.value })}
                  className="w-full h-9 bg-black/40 border border-white/10 rounded-md px-3 text-xs text-white mt-1"
                  required
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-white/70 font-medium">Editorial Caption</label>
              <Input
                value={galleryForm.caption}
                onChange={(e) => setGalleryForm({ ...galleryForm, caption: e.target.value })}
                placeholder="Panoramic views of the skyline..."
                className="bg-black/40 border-white/10 text-white text-xs mt-1"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="featGallery"
                checked={galleryForm.featured}
                onChange={(e) => setGalleryForm({ ...galleryForm, featured: e.target.checked })}
                className="w-4 h-4 rounded border-white/20 bg-black/40 text-primary cursor-pointer"
              />
              <label htmlFor="featGallery" className="text-xs text-white cursor-pointer select-none">
                Featured on Website Showcase
              </label>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setGalleryModalOpen(false)}
                className="border-white/10 text-white text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-gold-gradient text-white text-xs font-bold shadow-luxury"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                Save Media
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* MODAL 3: EXPERIENCE MODAL */}
      {/* ======================================================== */}
      <Dialog open={experienceModalOpen} onOpenChange={setExperienceModalOpen}>
        <DialogContent className="bg-[#121118] border border-white/10 text-white max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif font-bold text-white">
              {editingItem ? 'Edit Signature Experience' : 'New Signature Experience'}
            </DialogTitle>
            <DialogDescription className="text-xs text-white/50">
              Create curated luxury activities and guest packages.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveExperience} className="space-y-4 pt-2">
            <div>
              <label className="text-xs text-white/70 font-medium">Title</label>
              <Input
                value={experienceForm.title}
                onChange={(e) => setExperienceForm({ ...experienceForm, title: e.target.value })}
                placeholder="Michelin Culinary Journey"
                required
                className="bg-black/40 border-white/10 text-white text-xs mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/70 font-medium">Subtitle / Teaser</label>
                <Input
                  value={experienceForm.subtitle}
                  onChange={(e) => setExperienceForm({ ...experienceForm, subtitle: e.target.value })}
                  placeholder="Chef de Cuisine Table"
                  className="bg-black/40 border-white/10 text-white text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-white/70 font-medium">Icon Emoji</label>
                <Input
                  value={experienceForm.icon}
                  onChange={(e) => setExperienceForm({ ...experienceForm, icon: e.target.value })}
                  placeholder="🍷"
                  className="bg-black/40 border-white/10 text-white text-xs mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-white/70 font-medium">Photo URL</label>
              <Input
                value={experienceForm.imageUrl}
                onChange={(e) => setExperienceForm({ ...experienceForm, imageUrl: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                required
                className="bg-black/40 border-white/10 text-white text-xs mt-1"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-white/70 font-medium">Category</label>
                <select
                  value={experienceForm.category}
                  onChange={(e) => setExperienceForm({ ...experienceForm, category: e.target.value })}
                  className="w-full h-9 bg-black/40 border border-white/10 rounded-md px-3 text-xs text-white mt-1"
                >
                  <option value="DINING">Dining</option>
                  <option value="WELLNESS">Wellness</option>
                  <option value="LUXURY">Luxury</option>
                  <option value="ADVENTURE">Adventure</option>
                  <option value="CULTURE">Culture</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-white/70 font-medium">Duration</label>
                <Input
                  value={experienceForm.duration}
                  onChange={(e) => setExperienceForm({ ...experienceForm, duration: e.target.value })}
                  placeholder="3 Hours"
                  className="bg-black/40 border-white/10 text-white text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-white/70 font-medium">Price ($ USD)</label>
                <Input
                  type="number"
                  value={experienceForm.price}
                  onChange={(e) => setExperienceForm({ ...experienceForm, price: e.target.value })}
                  placeholder="250"
                  className="bg-black/40 border-white/10 text-white text-xs mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-white/70 font-medium">Property</label>
              <select
                value={experienceForm.propertyId}
                onChange={(e) => setExperienceForm({ ...experienceForm, propertyId: e.target.value })}
                className="w-full h-9 bg-black/40 border border-white/10 rounded-md px-3 text-xs text-white mt-1"
                required
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-white/70 font-medium">Narrative Description</label>
              <Textarea
                rows={3}
                value={experienceForm.description}
                onChange={(e) => setExperienceForm({ ...experienceForm, description: e.target.value })}
                required
                placeholder="A bespoke 7-course degustation menu..."
                className="bg-black/40 border-white/10 text-white text-xs mt-1"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="activeExp"
                checked={experienceForm.active}
                onChange={(e) => setExperienceForm({ ...experienceForm, active: e.target.checked })}
                className="w-4 h-4 rounded border-white/20 bg-black/40 text-primary cursor-pointer"
              />
              <label htmlFor="activeExp" className="text-xs text-white cursor-pointer select-none">
                Active & Visible on Guest Website
              </label>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setExperienceModalOpen(false)}
                className="border-white/10 text-white text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-gold-gradient text-white text-xs font-bold shadow-luxury"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                Save Experience
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* MODAL 4: FACILITY MODAL */}
      {/* ======================================================== */}
      <Dialog open={facilityModalOpen} onOpenChange={setFacilityModalOpen}>
        <DialogContent className="bg-[#121118] border border-white/10 text-white max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif font-bold text-white">
              {editingItem ? 'Edit Facility' : 'New Resort Facility'}
            </DialogTitle>
            <DialogDescription className="text-xs text-white/50">
              Manage facilities, operational schedules, and luxury highlights.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveFacility} className="space-y-4 pt-2">
            <div>
              <label className="text-xs text-white/70 font-medium">Facility Name</label>
              <Input
                value={facilityForm.name}
                onChange={(e) => setFacilityForm({ ...facilityForm, name: e.target.value })}
                placeholder="Celestial Infinity Pool"
                required
                className="bg-black/40 border-white/10 text-white text-xs mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/70 font-medium">Type</label>
                <select
                  value={facilityForm.type}
                  onChange={(e) => setFacilityForm({ ...facilityForm, type: e.target.value })}
                  className="w-full h-9 bg-black/40 border border-white/10 rounded-md px-3 text-xs text-white mt-1"
                >
                  <option value="POOL">Pool</option>
                  <option value="SPA">Spa & Wellness</option>
                  <option value="FITNESS">Fitness & Gym</option>
                  <option value="DINING">Dining & Bar</option>
                  <option value="BUSINESS">Business Boardroom</option>
                  <option value="RECREATION">Recreation</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-white/70 font-medium">Subtitle</label>
                <Input
                  value={facilityForm.subtitle}
                  onChange={(e) => setFacilityForm({ ...facilityForm, subtitle: e.target.value })}
                  placeholder="Above the Clouds"
                  className="bg-black/40 border-white/10 text-white text-xs mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-white/70 font-medium">Showcase Image URL</label>
              <Input
                value={facilityForm.imageUrl}
                onChange={(e) => setFacilityForm({ ...facilityForm, imageUrl: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="bg-black/40 border-white/10 text-white text-xs mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/70 font-medium">Operating Hours</label>
                <Input
                  value={facilityForm.operatingHours}
                  onChange={(e) => setFacilityForm({ ...facilityForm, operatingHours: e.target.value })}
                  placeholder="06:00 - 22:00"
                  className="bg-black/40 border-white/10 text-white text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-white/70 font-medium">Property</label>
                <select
                  value={facilityForm.propertyId}
                  onChange={(e) => setFacilityForm({ ...facilityForm, propertyId: e.target.value })}
                  className="w-full h-9 bg-black/40 border border-white/10 rounded-md px-3 text-xs text-white mt-1"
                  required
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-white/70 font-medium">Features (Comma separated)</label>
              <Input
                value={facilityForm.features}
                onChange={(e) => setFacilityForm({ ...facilityForm, features: e.target.value })}
                placeholder="Temperature Controlled, Private Cabanas, Poolside Lounge"
                className="bg-black/40 border-white/10 text-white text-xs mt-1"
              />
            </div>

            <div>
              <label className="text-xs text-white/70 font-medium">Description</label>
              <Textarea
                rows={3}
                value={facilityForm.description}
                onChange={(e) => setFacilityForm({ ...facilityForm, description: e.target.value })}
                placeholder="Our heated rooftop infinity pool offers a seamless blend of water and sky..."
                className="bg-black/40 border-white/10 text-white text-xs mt-1"
              />
            </div>

            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featFacility"
                  checked={facilityForm.featured}
                  onChange={(e) => setFacilityForm({ ...facilityForm, featured: e.target.checked })}
                  className="w-4 h-4 rounded border-white/20 bg-black/40 text-primary cursor-pointer"
                />
                <label htmlFor="featFacility" className="text-xs text-white cursor-pointer select-none">
                  Featured
                </label>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-white/70">Status:</label>
                <select
                  value={facilityForm.status}
                  onChange={(e) => setFacilityForm({ ...facilityForm, status: e.target.value })}
                  className="h-8 bg-black/40 border border-white/10 rounded px-2 text-xs text-white"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                  <option value="SEASONAL_CLOSED">SEASONAL_CLOSED</option>
                </select>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFacilityModalOpen(false)}
                className="border-white/10 text-white text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-gold-gradient text-white text-xs font-bold shadow-luxury"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                Save Facility
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
