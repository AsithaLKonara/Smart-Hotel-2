"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  Plus, Edit, Trash2, Search, Filter, Bed, Users, DollarSign, 
  Loader2, Save, X, Image as ImageIcon, Eye, Star, Layers, Calendar, 
  CheckCircle2, AlertCircle, Sparkles, Building2, ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import toast from 'react-hot-toast'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import { formatPrice } from '@/lib/utils'
import { useProperty } from '@/contexts/property-context'
import { useApi } from '@/hooks/use-api'
import { useLuxuryConfirm } from '@/components/ui/luxury-confirm-dialog'

interface RoomType {
  id: string;
  name: string;
  baseRate: number;
  capacity?: number;
  description?: string;
  amenities?: string[];
  images?: string[];
  _count?: { rooms: number };
}

interface Room {
  id: string
  number: string
  roomTypeId: string
  roomType: {
    name: string
    baseRate: number
    capacity: number
    description: string
    amenities: string[]
    images: string[]
  }
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED' | 'DIRTY' | 'OUT_OF_ORDER'
  floor?: number
  size?: number
  roomImages?: { imageUrl: string }[]
  propertyId?: string
}

export default function AdminRoomsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { activePropertyId } = useProperty()
  const { confirm } = useLuxuryConfirm()

  // Top Tabs: Rooms vs Room Types
  const [activeTab, setActiveTab] = useState<'rooms' | 'types'>('rooms')

  // Rooms Data
  const { data: rawRooms, mutate: fetchRooms, isLoading: loadingRooms } = useApi('/api/rooms')
  const { data: rawRoomTypes, mutate: fetchRoomTypes, isLoading: loadingTypes } = useApi('/api/room-types')
  
  const rooms: Room[] = Array.isArray(rawRooms) ? rawRooms : Array.isArray(rawRooms?.rooms) ? rawRooms.rooms : []
  const roomTypes: RoomType[] = Array.isArray(rawRoomTypes) ? rawRoomTypes 
    : Array.isArray(rawRoomTypes?.roomTypes) ? rawRoomTypes.roomTypes 
    : Array.isArray(rawRoomTypes?.data) ? rawRoomTypes.data : []

  // Room Filter States
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')

  // Room Form States
  const [showModal, setShowModal] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [formData, setFormData] = useState({
    number: '',
    roomTypeId: '',
    price: '',
    floor: '',
    size: '',
    status: 'AVAILABLE',
    images: [] as string[],
  })
  const [uploadingImages, setUploadingImages] = useState(false)
  const [pendingImageFiles, setPendingImageFiles] = useState<{file: File, preview: string}[]>([])

  // Room View Dossier Modal State
  const [viewingRoom, setViewingRoom] = useState<Room | null>(null)
  const [roomBookings, setRoomBookings] = useState<any[]>([])
  const [loadingBookings, setLoadingBookings] = useState(false)

  // Room Type Form States (For embedded Room Types tab)
  const [showTypeModal, setShowTypeModal] = useState(false)
  const [editingType, setEditingType] = useState<RoomType | null>(null)
  const [typeFormData, setTypeFormData] = useState({
    name: '',
    description: '',
    baseRate: '',
    capacity: '2',
    amenities: '',
    images: [] as string[]
  })
  const [savingType, setSavingType] = useState(false)

  // When opening Room Dossier Modal, query room's booking history
  useEffect(() => {
    if (viewingRoom) {
      setLoadingBookings(true)
      fetch(`/api/bookings?roomId=${viewingRoom.id}`)
        .then(res => res.json())
        .then(data => {
          const list = Array.isArray(data) ? data : (data.bookings || data.items || [])
          setRoomBookings(list.slice(0, 5))
        })
        .catch(err => console.error('Failed to load room bookings', err))
        .finally(() => setLoadingBookings(false))
    } else {
      setRoomBookings([])
    }
  }, [viewingRoom])

  // --- ROOM HANDLERS ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.roomTypeId) {
      toast.error("Please select a Room Type");
      return;
    }

    setUploadingImages(true)
    let finalImages = [...formData.images]

    try {
      if (formData.roomTypeId && formData.price) {
        const priceNum = parseFloat(formData.price)
        if (!isNaN(priceNum) && priceNum >= 0) {
          const selected = roomTypes.find(rt => rt.id === formData.roomTypeId)
          if (selected && Number(selected.baseRate) !== priceNum) {
            try {
              await fetch(`/api/room-types/${formData.roomTypeId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: selected.name,
                  baseRate: priceNum
                })
              })
            } catch (e) {
              console.error("Base rate sync error:", e)
            }
          }
        }
      }

      if (pendingImageFiles.length > 0) {
        for (const pf of pendingImageFiles) {
          const upData = new FormData()
          upData.append('file', pf.file)
          upData.append('folder', 'rooms')
          const upRes = await fetch('/api/upload', { method: 'POST', body: upData })
          if (upRes.ok) {
            const upJson = await upRes.json()
            if (upJson.url) finalImages.push(upJson.url)
          }
        }
      }

      const payload = {
        number: formData.number,
        roomTypeId: formData.roomTypeId,
        floor: formData.floor ? parseInt(formData.floor) : null,
        size: formData.size ? parseInt(formData.size) : null,
        status: formData.status,
        images: finalImages
      }

      const url = editingRoom ? `/api/rooms/${editingRoom.id}` : '/api/rooms'
      const method = editingRoom ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save room')
      }

      toast.success(editingRoom ? 'Room updated successfully' : 'Room created successfully')
      setShowModal(false)
      setEditingRoom(null)
      resetForm()
      fetchRooms()
      fetchRoomTypes()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save room')
    } finally {
      setUploadingImages(false)
    }
  }

  const handleEdit = (room: Room) => {
    setEditingRoom(room)
    setFormData({
      number: room.number,
      roomTypeId: room.roomTypeId || '',
      price: room.roomType?.baseRate ? room.roomType.baseRate.toString() : '',
      floor: room.floor !== null && room.floor !== undefined ? room.floor.toString() : '',
      size: room.size !== null && room.size !== undefined ? room.size.toString() : '',
      status: room.status,
      images: room.roomImages ? room.roomImages.map((img: any) => img.imageUrl) : []
    })
    setPendingImageFiles([])
    setShowModal(true)
  }

  const handleDelete = async (roomId: string, roomNumber: string) => {
    const approved = await confirm({
      title: `Delete Room ${roomNumber}?`,
      description: 'Are you sure you want to delete this room? This action will remove the physical room and cannot be undone.',
      confirmText: 'Delete Room',
      variant: 'danger'
    })

    if (!approved) return

    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'DELETE',
        headers: { 'x-property-id': activePropertyId || 'all' }
      })

      if (!response.ok) throw new Error('Failed to delete room')
      toast.success(`Room ${roomNumber} deleted successfully`)
      fetchRooms()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete room')
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const validFiles: {file: File, preview: string}[] = []
    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      validFiles.push({ file: f, preview: URL.createObjectURL(f) })
    }
    setPendingImageFiles(prev => [...prev, ...validFiles])
  }

  const handleDeleteImage = (index: number) => {
    const newImages = [...formData.images]
    newImages.splice(index, 1)
    setFormData(prev => ({ ...prev, images: newImages }))
  }

  const handleDeletePendingImage = (index: number) => {
    setPendingImageFiles(prev => {
      const newPending = [...prev]
      URL.revokeObjectURL(newPending[index].preview)
      newPending.splice(index, 1)
      return newPending
    })
  }

  const resetForm = () => {
    setFormData({
      number: '',
      roomTypeId: '',
      price: '',
      floor: '',
      size: '',
      status: 'AVAILABLE',
      images: [],
    })
    pendingImageFiles.forEach(pf => URL.revokeObjectURL(pf.preview))
    setPendingImageFiles([])
  }

  // --- ROOM TYPE HANDLERS (Embedded Tab) ---
  const handleOpenCreateType = () => {
    setEditingType(null)
    setTypeFormData({
      name: '',
      description: '',
      baseRate: '',
      capacity: '2',
      amenities: 'King Bed, Ocean View, High-Speed WiFi, Mini Bar, Marble Bath',
      images: []
    })
    setShowTypeModal(true)
  }

  const handleOpenEditType = (type: RoomType) => {
    setEditingType(type)
    setTypeFormData({
      name: type.name,
      description: type.description || '',
      baseRate: String(type.baseRate),
      capacity: String(type.capacity || 2),
      amenities: Array.isArray(type.amenities) ? type.amenities.join(', ') : '',
      images: type.images || []
    })
    setShowTypeModal(true)
  }

  const handleTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingType(true)
    try {
      const amenitiesArray = typeFormData.amenities.split(',').map(a => a.trim()).filter(Boolean)
      const payload = {
        name: typeFormData.name.trim(),
        description: typeFormData.description.trim(),
        baseRate: parseFloat(typeFormData.baseRate) || 0,
        capacity: parseInt(typeFormData.capacity) || 2,
        amenities: amenitiesArray,
        images: typeFormData.images
      }

      const url = editingType ? `/api/room-types/${editingType.id}` : '/api/room-types'
      const method = editingType ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error('Failed to save room type')
      toast.success(editingType ? 'Room type updated' : 'Room type created')
      setShowTypeModal(false)
      fetchRoomTypes()
    } catch (err: any) {
      toast.error(err.message || 'Error saving room type')
    } finally {
      setSavingType(false)
    }
  }

  const handleDeleteType = async (type: RoomType) => {
    const approved = await confirm({
      title: `Delete Suite Type "${type.name}"?`,
      description: 'Are you sure you want to delete this room type? Rooms currently assigned to this type may be affected.',
      confirmText: 'Delete Suite Type',
      variant: 'danger'
    })

    if (!approved) return

    try {
      const res = await fetch(`/api/room-types/${type.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete room type')
      toast.success('Room type deleted successfully')
      fetchRoomTypes()
    } catch (err: any) {
      toast.error(err.message || 'Error deleting room type')
    }
  }

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          room.roomType?.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || room.status === filterStatus
    const matchesType = filterType === 'all' || room.roomType?.name.toLowerCase() === filterType.toLowerCase()
    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
      case 'OCCUPIED':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
      case 'DIRTY':
      case 'CLEANING':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
      case 'MAINTENANCE':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
      case 'OUT_OF_ORDER':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
      default:
        return 'bg-white/5 text-white/60 border border-white/10'
    }
  }

  if (status === 'loading' || (loadingRooms && loadingTypes)) {
    return (
      <div className="flex items-center justify-center h-screen bg-transparent">
        <PremiumSpinner size="lg" text="Loading Room Management Center..." />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-white">
      <Breadcrumbs
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Rooms Directory' },
        ]}
        className="mb-2"
      />

      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-luxury">
              <Bed className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-bold text-white tracking-wide">
                Room Directory & Suites
              </h1>
              <p className="text-white/50 text-xs mt-0.5">
                Manage physical rooms, live occupancy, suite types, and photo archives
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher: [ Rooms | Room Types ] */}
        <div className="flex items-center bg-[#111116] border border-white/10 p-1.5 rounded-2xl gap-1 shadow-lg">
          <button
            onClick={() => setActiveTab('rooms')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'rooms'
                ? 'bg-primary text-black font-black shadow-luxury'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <Bed className="w-4 h-4" />
            <span>Rooms ({rooms.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('types')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'types'
                ? 'bg-primary text-black font-black shadow-luxury'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Room Types ({roomTypes.length})</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: PHYSICAL ROOMS DIRECTORY */}
      {/* ======================================================== */}
      {activeTab === 'rooms' && (
        <div className="space-y-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-[#0f0f13] border-white/10">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider font-bold text-white/40">Total Rooms</p>
                  <p className="text-3xl font-serif font-bold text-white mt-1">{rooms.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary">
                  <Bed className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0f0f13] border-white/10">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider font-bold text-white/40">Available Now</p>
                  <p className="text-3xl font-serif font-bold text-emerald-400 mt-1">
                    {rooms.filter(r => r.status === 'AVAILABLE').length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0f0f13] border-white/10">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider font-bold text-white/40">Occupied</p>
                  <p className="text-3xl font-serif font-bold text-blue-400 mt-1">
                    {rooms.filter(r => r.status === 'OCCUPIED').length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <Users className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0f0f13] border-white/10">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider font-bold text-white/40">Maintenance / Dirty</p>
                  <p className="text-3xl font-serif font-bold text-amber-400 mt-1">
                    {rooms.filter(r => ['MAINTENANCE', 'DIRTY', 'OUT_OF_ORDER'].includes(r.status)).length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters & Actions */}
          <div className="bg-[#0f0f13] border border-white/10 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-3 w-full md:w-auto flex-1">
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search room number or suite..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 text-xs text-white pl-10 pr-4 py-2.5 rounded-xl placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-black/40 border border-white/10 text-xs text-white px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="OCCUPIED">Occupied</option>
                <option value="DIRTY">Dirty</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="OUT_OF_ORDER">Out of Order</option>
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-black/40 border border-white/10 text-xs text-white px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Room Types</option>
                {roomTypes.map(rt => (
                  <option key={rt.id} value={rt.name.toLowerCase()}>{rt.name}</option>
                ))}
              </select>
            </div>

            <Button
              onClick={() => {
                setEditingRoom(null)
                resetForm()
                fetchRoomTypes()
                setShowModal(true)
              }}
              className="bg-gold-gradient hover:opacity-90 text-white font-bold text-xs uppercase tracking-wider px-6 h-11 rounded-xl shadow-luxury border-none w-full md:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Room
            </Button>
          </div>

          {/* Rooms Grid with Photography */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRooms.map((room) => {
              const primaryImage = 
                room.roomImages?.[0]?.imageUrl || 
                room.roomType?.images?.[0] || 
                'https://images.unsplash.com/photo-1590490359683-658d3d23f972?auto=format&fit=crop&q=80&w=800'

              return (
                <Card 
                  key={room.id} 
                  className="bg-[#0f0f13] border-white/10 overflow-hidden flex flex-col justify-between hover:border-primary/40 transition-all duration-300 group shadow-lg"
                >
                  <div>
                    {/* Room Thumbnail Photography */}
                    <div className="relative aspect-[16/10] w-full bg-black/40 overflow-hidden">
                      <Image
                        src={primaryImage}
                        alt={`Room ${room.number}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                      {/* Room Number & Status Badge */}
                      <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1 rounded-xl border border-white/20">
                        <span className="text-white font-serif font-bold text-sm">Room {room.number}</span>
                      </div>

                      <div className="absolute top-3 right-3">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${getStatusColor(room.status)}`}>
                          {room.status}
                        </span>
                      </div>

                      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                        <div className="bg-black/80 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10">
                          <span className="text-emerald-400 font-serif font-bold text-sm">
                            {formatPrice(room.roomType?.baseRate || 0)}
                          </span>
                          <span className="text-white/40 text-[10px] ml-1">/night</span>
                        </div>

                        <div className="flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10 text-xs text-white/70">
                          <Users className="w-3.5 h-3.5 text-primary" />
                          <span>{room.roomType?.capacity || 2}</span>
                        </div>
                      </div>
                    </div>

                    {/* Room Specs */}
                    <div className="p-4 space-y-2">
                      <h3 className="text-lg font-serif font-bold text-white group-hover:text-primary transition-colors truncate">
                        {room.roomType?.name || 'Luxury Suite'}
                      </h3>
                      
                      <div className="flex items-center gap-3 text-xs text-white/50 font-light">
                        {room.floor !== undefined && room.floor !== null && (
                          <span>Floor {room.floor}</span>
                        )}
                        {room.size !== undefined && room.size !== null && (
                          <>
                            <span>&bull;</span>
                            <span>{room.size} m²</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions: View Dossier, Edit, Delete */}
                  <div className="p-4 pt-0 border-t border-white/5 mt-2 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewingRoom(room)}
                      className="flex-1 bg-white/5 border-white/10 hover:border-primary/50 text-white/90 hover:text-white h-9 rounded-xl text-xs font-bold"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5 text-primary" />
                      View Dossier
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(room)}
                      className="border-white/10 text-white/70 hover:text-white h-9 rounded-xl text-xs px-2.5"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(room.id, room.number)}
                      className="border-rose-500/20 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/40 h-9 rounded-xl text-xs px-2.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>

          {filteredRooms.length === 0 && (
            <Card className="p-16 text-center bg-[#0f0f13] border-white/10 space-y-4">
              <Bed className="w-16 h-16 mx-auto text-white/20" />
              <h3 className="text-2xl font-serif font-bold text-white">No Physical Rooms Found</h3>
              <p className="text-white/50 text-xs max-w-sm mx-auto font-light">
                No rooms matched your active filters. Try adjusting your search query or add a new room.
              </p>
              <Button onClick={() => setShowModal(true)} className="bg-gold-gradient text-white font-bold text-xs uppercase px-6 h-10 rounded-xl">
                <Plus className="w-4 h-4 mr-2" /> Add First Room
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: ROOM TYPES CONFIGURATION */}
      {/* ======================================================== */}
      {activeTab === 'types' && (
        <div className="space-y-6">
          <div className="bg-[#0f0f13] border border-white/10 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-serif font-bold text-white">Suite & Room Type Catalog</h2>
              <p className="text-white/50 text-xs mt-0.5">
                Define master suite tiers, base rates, guest capacities, and luxury amenity offerings
              </p>
            </div>
            <Button
              onClick={handleOpenCreateType}
              className="bg-gold-gradient text-white font-bold text-xs uppercase px-6 h-11 rounded-xl shadow-luxury border-none"
            >
              <Plus className="w-4 h-4 mr-2" /> Create Suite Type
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roomTypes.map((type) => (
              <Card key={type.id} className="bg-[#0f0f13] border-white/10 overflow-hidden flex flex-col justify-between hover:border-primary/40 transition-all duration-300">
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-white">{type.name}</h3>
                      <p className="text-primary font-serif font-bold text-lg mt-1">
                        {formatPrice(Number(type.baseRate))}<span className="text-xs text-white/50 font-sans">/night</span>
                      </p>
                    </div>
                    <Badge variant="outline" className="border-white/10 text-white/70 bg-white/5">
                      Max {type.capacity || 2} Guests
                    </Badge>
                  </div>

                  <p className="text-xs text-white/60 font-light leading-relaxed line-clamp-3">
                    {type.description || 'No description provided.'}
                  </p>

                  {/* Amenities Preview */}
                  {Array.isArray(type.amenities) && type.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {type.amenities.slice(0, 4).map((a, i) => (
                        <span key={i} className="text-[10px] bg-white/5 border border-white/10 text-white/70 px-2.5 py-1 rounded-lg">
                          {a}
                        </span>
                      ))}
                      {type.amenities.length > 4 && (
                        <span className="text-[10px] text-primary px-1 self-center">
                          +{type.amenities.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-5 pt-0 border-t border-white/5 flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEditType(type)}
                    className="flex-1 border-white/10 hover:border-primary/40 text-white/80 hover:text-white h-9 rounded-xl text-xs"
                  >
                    <Edit className="w-3.5 h-3.5 mr-1.5 text-primary" /> Edit Suite
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteType(type)}
                    className="border-rose-500/20 text-rose-400 hover:bg-rose-500/10 h-9 rounded-xl text-xs px-3"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ROOM DOSSIER MODAL (ALL DETAILS POPUP) */}
      {/* ======================================================== */}
      <Dialog open={!!viewingRoom} onOpenChange={(open) => !open && setViewingRoom(null)}>
        <DialogContent className="bg-[#111116] border-white/10 text-white max-w-3xl p-6 rounded-2xl max-h-[90vh] overflow-y-auto">
          {viewingRoom && (
            <div className="space-y-6">
              <DialogHeader className="border-b border-white/10 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-serif font-bold text-white">
                      Room {viewingRoom.number}
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getStatusColor(viewingRoom.status)}`}>
                      {viewingRoom.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-primary">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                    <span className="text-xs font-bold ml-1 text-white">5.0 Star Luxury</span>
                  </div>
                </div>
                <DialogDescription className="text-white/60 text-xs">
                  {viewingRoom.roomType?.name} &bull; Floor {viewingRoom.floor ?? 1} &bull; {viewingRoom.size ?? 30} m²
                </DialogDescription>
              </DialogHeader>

              {/* Photos Gallery */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 relative aspect-[16/10] rounded-xl overflow-hidden bg-black/40 border border-white/10">
                  <Image
                    src={viewingRoom.roomImages?.[0]?.imageUrl || viewingRoom.roomType?.images?.[0] || 'https://images.unsplash.com/photo-1590490359683-658d3d23f972?auto=format&fit=crop&q=80&w=1200'}
                    alt={`Room ${viewingRoom.number}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <div className="relative aspect-video flex-1 rounded-xl overflow-hidden bg-black/40 border border-white/10">
                    <Image
                      src={viewingRoom.roomImages?.[1]?.imageUrl || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=800'}
                      alt="Interior"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="relative aspect-video flex-1 rounded-xl overflow-hidden bg-black/40 border border-white/10">
                    <Image
                      src={viewingRoom.roomImages?.[2]?.imageUrl || 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef4?auto=format&fit=crop&q=80&w=800'}
                      alt="Balcony"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Specs & Description */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <h4 className="text-xs uppercase tracking-wider font-bold text-white/50">Suite Overview</h4>
                    <p className="text-sm text-white/80 font-light mt-1 leading-relaxed">
                      {viewingRoom.roomType?.description || 'A sanctuary of sophisticated comfort featuring panoramic views, artisan decor, and world-class luxury bedding.'}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs uppercase tracking-wider font-bold text-white/50 mb-2">Exclusive Amenities</h4>
                    <div className="flex flex-wrap gap-2">
                      {(viewingRoom.roomType?.amenities || ['King Bed', 'Rain Shower', 'Private Balcony', 'Butler Call', 'Espresso Bar']).map((amenity, idx) => (
                        <span key={idx} className="bg-white/5 border border-white/10 text-white/80 text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-primary" />
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-3 h-fit">
                  <h4 className="text-xs uppercase tracking-wider font-bold text-primary">Financial Telemetry</h4>
                  <div>
                    <span className="text-white/40 text-xs">Standard Nightly Rate:</span>
                    <p className="text-2xl font-serif font-bold text-white">
                      {formatPrice(viewingRoom.roomType?.baseRate || 0)}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/5 text-xs text-white/60 space-y-1.5">
                    <div className="flex justify-between">
                      <span>Capacity:</span>
                      <span className="text-white font-bold">{viewingRoom.roomType?.capacity || 2} Guests</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Floor Level:</span>
                      <span className="text-white font-bold">Floor {viewingRoom.floor ?? 1}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Room Size:</span>
                      <span className="text-white font-bold">{viewingRoom.size ?? 30} m²</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent & Upcoming Reservations */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs uppercase tracking-wider font-bold text-white/50 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Reservations on this Room
                  </h4>
                  {loadingBookings && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
                </div>

                {roomBookings.length === 0 ? (
                  <p className="text-xs text-white/40 italic py-2">
                    {loadingBookings ? 'Loading reservation telemetry...' : 'No upcoming bookings recorded on this physical room.'}
                  </p>
                ) : (
                  <div className="border border-white/5 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/5 text-white/40 uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5">Guest</th>
                          <th className="p-2.5">Dates</th>
                          <th className="p-2.5">Status</th>
                          <th className="p-2.5 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-white/80">
                        {roomBookings.map((b: any) => (
                          <tr key={b.id} className="hover:bg-white/[0.02]">
                            <td className="p-2.5 font-medium">{b.guest?.name || 'Guest'}</td>
                            <td className="p-2.5 text-white/60">
                              {new Date(b.checkIn).toLocaleDateString()} &rarr; {new Date(b.checkOut).toLocaleDateString()}
                            </td>
                            <td className="p-2.5">
                              <span className="text-[10px] font-bold text-primary uppercase">{b.status}</span>
                            </td>
                            <td className="p-2.5 text-right font-mono text-emerald-400">
                              {formatPrice(Number(b.totalAmount))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <DialogFooter className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setViewingRoom(null)}
                  className="border-white/10 text-white rounded-xl text-xs"
                >
                  Close Dossier
                </Button>
                <Button
                  onClick={() => {
                    const toEdit = viewingRoom
                    setViewingRoom(null)
                    handleEdit(toEdit)
                  }}
                  className="bg-gold-gradient text-white font-bold text-xs uppercase px-5 rounded-xl border-none shadow-luxury"
                >
                  <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit Room Details
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* ADD / EDIT PHYSICAL ROOM MODAL */}
      {/* ======================================================== */}
      <Modal
        open={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingRoom(null)
          resetForm()
        }}
        title={editingRoom ? 'Edit Room' : 'Add New Room'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">
                Room Number *
              </label>
              <input
                type="text"
                value={formData.number || ''}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">
                Room Type *
              </label>
              <select
                value={formData.roomTypeId || ''}
                onChange={(e) => {
                  const typeId = e.target.value
                  const selected = roomTypes.find(rt => rt.id === typeId)
                  setFormData(prev => ({
                    ...prev,
                    roomTypeId: typeId,
                    price: selected?.baseRate != null ? selected.baseRate.toString() : (prev.price || '')
                  }))
                }}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                required
              >
                <option value="">{roomTypes.length === 0 ? '-- No Room Types (Create First) --' : 'Select Room Type'}</option>
                {roomTypes.map(rt => (
                  <option key={rt.id} value={rt.id}>
                    {rt.name} {rt.baseRate ? `($${Number(rt.baseRate).toFixed(2)}/night)` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">
              Nightly Rate / Price ($/night) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 150.00"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full pl-7 pr-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">Floor</label>
              <input
                type="number"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">Size (m²)</label>
              <input
                type="number"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                placeholder="25"
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Room Photography</span>
              {uploadingImages && <Loader2 className="w-3 h-3 animate-spin" />}
            </label>
            <div className="flex gap-2 flex-wrap mb-2">
              {formData.images.map((url, idx) => (
                <div key={`existing-${idx}`} className="relative w-20 h-20 bg-black/40 border border-white/10 rounded-lg overflow-hidden group">
                  <Image src={url} alt={`Preview ${idx}`} fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <button type="button" onClick={() => handleDeleteImage(idx)} className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {pendingImageFiles.map((pf, idx) => (
                <div key={`pending-${idx}`} className="relative w-20 h-20 bg-black/40 border border-white/10 rounded-lg overflow-hidden group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pf.preview} alt={`Pending Preview ${idx}`} className="w-full h-full object-cover" />
                  <div className="absolute top-1 right-1 bg-primary text-[8px] px-1 rounded uppercase font-bold text-white z-10">Pending</div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-20">
                    <button type="button" onClick={() => handleDeletePendingImage(idx)} className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <label className="w-20 h-20 flex flex-col items-center justify-center border border-dashed border-white/20 rounded-lg cursor-pointer hover:bg-white/5 hover:border-white/40 transition-colors">
                <ImageIcon className="w-5 h-5 text-slate-400 mb-1" />
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Upload</span>
                <input 
                  type="file" 
                  accept="image/webp,image/jpeg,image/png,image/heic" 
                  multiple 
                  className="hidden" 
                  onChange={handleImageSelect}
                  disabled={uploadingImages}
                />
              </label>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">
              Status *
            </label>
            <select
              value={formData.status || 'AVAILABLE'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
              required
            >
              <option value="AVAILABLE">Available</option>
              <option value="OCCUPIED">Occupied</option>
              <option value="DIRTY">Dirty</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="OUT_OF_ORDER">Out of Order</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5 mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowModal(false)
                setEditingRoom(null)
                resetForm()
              }}
              className="text-slate-400 hover:text-white hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-white min-w-[100px]">
              {editingRoom ? 'Update Room' : 'Create Room'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* CREATE / EDIT ROOM TYPE MODAL */}
      {/* ======================================================== */}
      <Dialog open={showTypeModal} onOpenChange={setShowTypeModal}>
        <DialogContent className="bg-[#111116] border-white/10 text-white max-w-lg p-6 rounded-2xl">
          <DialogHeader className="border-b border-white/10 pb-4">
            <DialogTitle className="text-xl font-serif font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              {editingType ? 'Edit Suite Type' : 'Create New Suite Type'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleTypeSubmit} className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider font-bold text-white/70">Suite Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Presidential Penthouse Suite"
                value={typeFormData.name}
                onChange={e => setTypeFormData({ ...typeFormData, name: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-bold text-white/70">Base Rate ($/night) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="450.00"
                  value={typeFormData.baseRate}
                  onChange={e => setTypeFormData({ ...typeFormData, baseRate: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-bold text-white/70">Max Capacity *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={typeFormData.capacity}
                  onChange={e => setTypeFormData({ ...typeFormData, capacity: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider font-bold text-white/70">Description</label>
              <textarea
                rows={3}
                placeholder="Describe suite features, view, and architecture..."
                value={typeFormData.description}
                onChange={e => setTypeFormData({ ...typeFormData, description: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider font-bold text-white/70">Amenities (comma-separated)</label>
              <input
                type="text"
                placeholder="King Bed, Ocean View, High-Speed WiFi, Mini Bar, Marble Bath"
                value={typeFormData.amenities}
                onChange={e => setTypeFormData({ ...typeFormData, amenities: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-white/10 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowTypeModal(false)}
                className="border-white/10 text-white rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingType}
                className="bg-gold-gradient text-white font-bold text-xs uppercase px-5 rounded-xl border-none shadow-luxury"
              >
                {savingType ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                {editingType ? 'Update Suite' : 'Create Suite'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
