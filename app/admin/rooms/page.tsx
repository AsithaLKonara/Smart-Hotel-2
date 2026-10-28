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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import toast from 'react-hot-toast'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import { formatPrice } from '@/lib/utils'
import { useProperty } from '@/contexts/property-context'
import { useApi } from '@/hooks/use-api'
import { useLuxuryConfirm } from '@/components/ui/luxury-confirm-dialog'
import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell'
import { cn } from '@/lib/utils'

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
      toast.error("Please select a Room Type")
      return
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

  // Status badge classes matching Section 6.A
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      case 'OCCUPIED':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
      case 'DIRTY':
      case 'CLEANING':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      case 'MAINTENANCE':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/20'
      case 'OUT_OF_ORDER':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20'
      default:
        return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20'
    }
  }

  if (status === 'loading' || (loadingRooms && loadingTypes)) {
    return (
      <div className="flex items-center justify-center py-24">
        <PremiumSpinner size="lg" text="Loading Room Inventory..." />
      </div>
    )
  }

  return (
    <AdminPageShell
      title="Room Inventory & Directory"
      subtitle="Manage physical rooms, real-time occupancy status, suite tiers, and photo archives."
      onRefresh={() => { fetchRooms(); fetchRoomTypes(); }}
      actions={
        <div className="flex items-center gap-2">
          {/* Tab Switcher: [ Rooms | Room Types ] */}
          <div className="flex items-center bg-[#121417] border border-[#1E2227] p-1 rounded-xl gap-1">
            <button
              onClick={() => setActiveTab('rooms')}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all",
                activeTab === 'rooms'
                  ? "bg-[#181A1D] text-white border border-[#2B3037] shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-[#16181B]"
              )}
            >
              <Bed className="w-3.5 h-3.5" />
              <span>Rooms ({rooms.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('types')}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all",
                activeTab === 'types'
                  ? "bg-[#181A1D] text-white border border-[#2B3037] shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-[#16181B]"
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Suite Types ({roomTypes.length})</span>
            </button>
          </div>
        </div>
      }
    >
      {/* ======================================================== */}
      {/* TAB 1: PHYSICAL ROOMS DIRECTORY */}
      {/* ======================================================== */}
      {activeTab === 'rooms' && (
        <div className="space-y-6">
          {/* Stats Bar (Section 4.D) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between hover:border-zinc-700 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Rooms</span>
                  <div className="w-7 h-7 rounded-lg bg-[#181A1D] border border-[#2B3037] flex items-center justify-center text-zinc-400">
                    <Bed className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                  {rooms.length}
                </div>
              </div>
              <div className="pt-2 mt-3 border-t border-[#1C2025] text-[11px] text-zinc-500 font-mono">
                Physical Inventory
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between hover:border-zinc-700 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Available Now</span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight">
                  {rooms.filter(r => r.status === 'AVAILABLE').length}
                </div>
              </div>
              <div className="pt-2 mt-3 border-t border-[#1C2025] text-[11px] text-emerald-500/70 font-mono">
                Ready for check-in
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between hover:border-zinc-700 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Occupied</span>
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-blue-400 font-mono tracking-tight">
                  {rooms.filter(r => r.status === 'OCCUPIED').length}
                </div>
              </div>
              <div className="pt-2 mt-3 border-t border-[#1C2025] text-[11px] text-blue-500/70 font-mono">
                Active in-house guests
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between hover:border-zinc-700 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Maintenance / Dirty</span>
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <AlertCircle className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight">
                  {rooms.filter(r => ['MAINTENANCE', 'DIRTY', 'OUT_OF_ORDER'].includes(r.status)).length}
                </div>
              </div>
              <div className="pt-2 mt-3 border-t border-[#1C2025] text-[11px] text-amber-500/70 font-mono">
                Service attention required
              </div>
            </div>
          </div>

          {/* Filters & Actions */}
          <div className="bg-[#121417] border border-[#1E2227] p-3.5 rounded-2xl flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto flex-1">
              <div className="relative w-full md:w-72">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search room number or suite..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#181A1D] border border-[#2B3037] text-xs font-mono text-white pl-9 pr-3 py-2 rounded-xl placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-[#181A1D] border border-[#2B3037] text-xs font-mono text-white px-3 py-2 rounded-xl focus:outline-none focus:border-zinc-400"
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
                className="bg-[#181A1D] border border-[#2B3037] text-xs font-mono text-white px-3 py-2 rounded-xl focus:outline-none focus:border-zinc-400"
              >
                <option value="all">All Room Types</option>
                {roomTypes.map(rt => (
                  <option key={rt.id} value={rt.name.toLowerCase()}>{rt.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setEditingRoom(null)
                resetForm()
                fetchRoomTypes()
                setShowModal(true)
              }}
              className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs tracking-wider uppercase px-4 h-9 rounded-xl transition-all shadow-sm flex items-center gap-1.5 w-full md:w-auto justify-center"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Room</span>
            </button>
          </div>

          {/* Rooms Grid with Photography */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredRooms.map((room) => {
              const primaryImage = 
                room.roomImages?.[0]?.imageUrl || 
                room.roomType?.images?.[0] || 
                'https://images.unsplash.com/photo-1590490359683-658d3d23f972?auto=format&fit=crop&q=80&w=800'

              return (
                <div 
                  key={room.id} 
                  className="rounded-2xl bg-[#121417] border border-[#1E2227] hover:border-zinc-700 transition-all duration-200 group overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* Room Thumbnail Photography */}
                    <div className="relative aspect-[16/10] w-full bg-[#090A0C] overflow-hidden">
                      <Image
                        src={primaryImage}
                        alt={`Room ${room.number}`}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#121417] via-transparent to-transparent" />

                      {/* Room Number Pill */}
                      <div className="absolute top-2.5 left-2.5 bg-[#090A0C]/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-[#22262B]">
                        <span className="text-white font-mono font-bold text-xs">Room {room.number}</span>
                      </div>

                      {/* Status Badge */}
                      <div className="absolute top-2.5 right-2.5">
                        <span className={cn(
                          "font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full border tracking-wide uppercase",
                          getStatusBadge(room.status)
                        )}>
                          {room.status}
                        </span>
                      </div>

                      {/* Price Tag & Capacity */}
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end justify-between">
                        <div className="bg-[#090A0C]/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-[#22262B]">
                          <span className="text-emerald-400 font-mono font-bold text-xs">
                            {formatPrice(room.roomType?.baseRate || 0)}
                          </span>
                          <span className="text-zinc-500 text-[10px] ml-1 font-mono">/night</span>
                        </div>

                        <div className="flex items-center gap-1 bg-[#090A0C]/90 backdrop-blur-md px-2 py-1 rounded-lg border border-[#22262B] text-[11px] text-zinc-300 font-mono">
                          <Users className="w-3 h-3 text-zinc-400" />
                          <span>{room.roomType?.capacity || 2}</span>
                        </div>
                      </div>
                    </div>

                    {/* Room Specs */}
                    <div className="p-4 space-y-1.5">
                      <h3 className="text-sm font-semibold text-white group-hover:text-zinc-200 transition-colors truncate">
                        {room.roomType?.name || 'Standard Room'}
                      </h3>
                      
                      <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
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
                  <div className="p-3 pt-0 border-t border-[#1C2025] mt-2 flex items-center gap-2">
                    <button
                      onClick={() => setViewingRoom(room)}
                      className="flex-1 bg-[#181A1D] hover:bg-[#20242A] border border-[#2B3037] text-zinc-200 text-xs font-mono h-8 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Dossier</span>
                    </button>

                    <button
                      onClick={() => handleEdit(room)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#181A1D] hover:bg-[#20242A] border border-[#2B3037] text-zinc-400 hover:text-white transition-colors"
                      title="Edit Room"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDelete(room.id, room.number)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#181A1D] hover:bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:border-rose-500/40 transition-colors"
                      title="Delete Room"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredRooms.length === 0 && (
            <div className="p-16 text-center rounded-2xl bg-[#121417] border border-[#1E2227] space-y-4">
              <Bed className="w-12 h-12 mx-auto text-zinc-600" />
              <h3 className="text-lg font-semibold text-white">No Physical Rooms Found</h3>
              <p className="text-zinc-400 text-xs max-w-sm mx-auto">
                No rooms matched your active filters. Try adjusting your search query or add a new room.
              </p>
              <button 
                onClick={() => setShowModal(true)} 
                className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs uppercase px-5 h-9 rounded-xl inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add First Room
              </button>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: ROOM TYPES CONFIGURATION */}
      {/* ======================================================== */}
      {activeTab === 'types' && (
        <div className="space-y-6">
          <div className="bg-[#121417] border border-[#1E2227] p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-white">Suite & Room Type Catalog</h2>
              <p className="text-zinc-400 text-xs mt-0.5">
                Define master suite tiers, base rates, guest capacities, and luxury amenity offerings.
              </p>
            </div>
            <button
              onClick={handleOpenCreateType}
              className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs tracking-wider uppercase px-4 h-9 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Create Suite Type
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {roomTypes.map((type) => (
              <div 
                key={type.id} 
                className="rounded-2xl bg-[#121417] border border-[#1E2227] hover:border-zinc-700 transition-all p-5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-white">{type.name}</h3>
                      <p className="text-emerald-400 font-mono font-bold text-lg mt-0.5">
                        {formatPrice(Number(type.baseRate))}<span className="text-xs text-zinc-500 font-mono">/night</span>
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-zinc-300 bg-[#181A1D] border border-[#2B3037] px-2.5 py-0.5 rounded-full">
                      Max {type.capacity || 2} Guests
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">
                    {type.description || 'No description provided.'}
                  </p>

                  {/* Amenities Preview */}
                  {Array.isArray(type.amenities) && type.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {type.amenities.slice(0, 4).map((a, i) => (
                        <span key={i} className="text-[10px] font-mono bg-[#181A1D] border border-[#2B3037] text-zinc-300 px-2 py-0.5 rounded-md">
                          {a}
                        </span>
                      ))}
                      {type.amenities.length > 4 && (
                        <span className="text-[10px] text-zinc-500 font-mono self-center">
                          +{type.amenities.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-[#1C2025] mt-4 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditType(type)}
                    className="flex-1 bg-[#181A1D] hover:bg-[#20242A] border border-[#2B3037] text-zinc-200 text-xs font-mono h-8 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5 text-zinc-400" /> Edit Suite
                  </button>
                  <button
                    onClick={() => handleDeleteType(type)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#181A1D] hover:bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:border-rose-500/40 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ROOM DOSSIER MODAL (ALL DETAILS POPUP) */}
      {/* ======================================================== */}
      <Dialog open={!!viewingRoom} onOpenChange={(open) => !open && setViewingRoom(null)}>
        <DialogContent className="max-w-2xl bg-[#121417] border border-[#2B3037] p-6 rounded-2xl max-h-[90vh] overflow-y-auto">
          {viewingRoom && (
            <div className="space-y-5">
              <DialogHeader className="border-b border-[#1E2227] pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-white font-mono">
                      Room {viewingRoom.number}
                    </span>
                    <span className={cn(
                      "font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full border tracking-wide uppercase",
                      getStatusBadge(viewingRoom.status)
                    )}>
                      {viewingRoom.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-zinc-400">
                    <span className="text-xs font-mono text-zinc-400">Inventory Verified</span>
                  </div>
                </div>
                <DialogDescription className="text-zinc-400 text-xs mt-1 font-mono">
                  {viewingRoom.roomType?.name} &bull; Floor {viewingRoom.floor ?? 1} &bull; {viewingRoom.size ?? 30} m²
                </DialogDescription>
              </DialogHeader>

              {/* Photos Gallery */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 relative aspect-[16/10] rounded-xl overflow-hidden bg-[#090A0C] border border-[#1E2227]">
                  <Image
                    src={viewingRoom.roomImages?.[0]?.imageUrl || viewingRoom.roomType?.images?.[0] || 'https://images.unsplash.com/photo-1590490359683-658d3d23f972?auto=format&fit=crop&q=80&w=1200'}
                    alt={`Room ${viewingRoom.number}`}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <div className="relative aspect-video flex-1 rounded-xl overflow-hidden bg-[#090A0C] border border-[#1E2227]">
                    <Image
                      src={viewingRoom.roomImages?.[1]?.imageUrl || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=800'}
                      alt="Interior"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                  <div className="relative aspect-video flex-1 rounded-xl overflow-hidden bg-[#090A0C] border border-[#1E2227]">
                    <Image
                      src={viewingRoom.roomImages?.[2]?.imageUrl || 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef4?auto=format&fit=crop&q=80&w=800'}
                      alt="Balcony"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Specs & Description */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                <div className="md:col-span-2 space-y-3">
                  <div>
                    <h4 className="text-xs uppercase tracking-wider font-semibold text-zinc-400">Suite Overview</h4>
                    <p className="text-xs text-zinc-300 font-normal mt-1 leading-relaxed">
                      {viewingRoom.roomType?.description || 'Sophisticated accommodations featuring modern design, high-speed amenities, and ergonomic comfort.'}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs uppercase tracking-wider font-semibold text-zinc-400 mb-1.5">Amenities</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {(viewingRoom.roomType?.amenities || ['King Bed', 'Rain Shower', 'Private Balcony', 'High-Speed WiFi', 'Work Desk']).map((amenity, idx) => (
                        <span key={idx} className="bg-[#181A1D] border border-[#2B3037] text-zinc-300 text-[11px] font-mono px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-zinc-400" />
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-[#181A1D] border border-[#2B3037] rounded-xl p-3.5 space-y-2.5 h-fit font-mono">
                  <h4 className="text-xs uppercase tracking-wider font-semibold text-zinc-400">Rate & Capacity</h4>
                  <div>
                    <span className="text-zinc-500 text-[10px]">Standard Rate:</span>
                    <p className="text-lg font-bold text-emerald-400">
                      {formatPrice(viewingRoom.roomType?.baseRate || 0)}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#22262B] text-xs text-zinc-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Capacity:</span>
                      <span className="text-zinc-200">{viewingRoom.roomType?.capacity || 2} Guests</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Floor:</span>
                      <span className="text-zinc-200">Floor {viewingRoom.floor ?? 1}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span className="text-zinc-200">{viewingRoom.size ?? 30} m²</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent & Upcoming Reservations */}
              <div className="pt-3 border-t border-[#1E2227] space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs uppercase tracking-wider font-semibold text-zinc-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    Reservations on this Room
                  </h4>
                  {loadingBookings && <Loader2 className="w-3 h-3 animate-spin text-zinc-500" />}
                </div>

                {roomBookings.length === 0 ? (
                  <p className="text-xs text-zinc-500 font-mono py-1">
                    {loadingBookings ? 'Loading reservation records...' : 'No upcoming bookings recorded on this physical room.'}
                  </p>
                ) : (
                  <div className="border border-[#1E2227] rounded-xl overflow-hidden bg-[#181A1D]">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-[#141619] border-b border-[#1E2227] text-zinc-400 uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5">Guest</th>
                          <th className="p-2.5">Dates</th>
                          <th className="p-2.5">Status</th>
                          <th className="p-2.5 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1C2025] text-zinc-300">
                        {roomBookings.map((b: any) => (
                          <tr key={b.id} className="hover:bg-[#16181B]">
                            <td className="p-2.5 font-medium text-white">{b.guest?.name || 'Guest'}</td>
                            <td className="p-2.5 text-zinc-400">
                              {new Date(b.checkIn).toLocaleDateString()} &rarr; {new Date(b.checkOut).toLocaleDateString()}
                            </td>
                            <td className="p-2.5">
                              <span className="text-[10px] font-semibold text-zinc-300 uppercase">{b.status}</span>
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

              <DialogFooter className="pt-3 border-t border-[#1E2227] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setViewingRoom(null)}
                  className="px-4 py-2 rounded-xl bg-transparent border border-[#2B3037] text-zinc-300 hover:text-white text-xs font-mono transition-colors"
                >
                  Close Dossier
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const toEdit = viewingRoom
                    setViewingRoom(null)
                    handleEdit(toEdit)
                  }}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit Room Details
                </button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* ADD / EDIT PHYSICAL ROOM MODAL */}
      {/* ======================================================== */}
      <Dialog open={showModal} onOpenChange={(open) => {
        if (!open) {
          setShowModal(false)
          setEditingRoom(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-lg bg-[#121417] border border-[#2B3037] p-6 rounded-2xl">
          <DialogHeader className="border-b border-[#1E2227] pb-4">
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Bed className="w-4 h-4 text-zinc-400" />
              {editingRoom ? `Edit Room ${editingRoom.number}` : 'Add New Physical Room'}
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Configure room parameters, assigned suite tier, and photo media.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1 block">
                  Room Number *
                </label>
                <input
                  type="text"
                  value={formData.number || ''}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  placeholder="e.g. 101"
                  className="w-full px-3 py-2 bg-[#181A1D] border border-[#2B3037] rounded-xl text-white font-mono text-xs placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1 block">
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
                  className="w-full px-3 py-2 bg-[#181A1D] border border-[#2B3037] rounded-xl text-white font-mono text-xs focus:outline-none focus:border-zinc-400"
                  required
                >
                  <option value="">{roomTypes.length === 0 ? '-- No Types (Create First) --' : 'Select Type'}</option>
                  {roomTypes.map(rt => (
                    <option key={rt.id} value={rt.id}>
                      {rt.name} ({formatPrice(Number(rt.baseRate))})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1 block">
                Nightly Rate (LKR) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 15000"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 bg-[#181A1D] border border-[#2B3037] rounded-xl text-white font-mono text-xs focus:outline-none focus:border-zinc-400"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1 block">Floor</label>
                <input
                  type="number"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  className="w-full px-3 py-2 bg-[#181A1D] border border-[#2B3037] rounded-xl text-white font-mono text-xs placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400"
                  placeholder="1"
                  min="0"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1 block">Size (m²)</label>
                <input
                  type="number"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  className="w-full px-3 py-2 bg-[#181A1D] border border-[#2B3037] rounded-xl text-white font-mono text-xs placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400"
                  placeholder="30"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Room Photography</span>
                {uploadingImages && <Loader2 className="w-3 h-3 animate-spin text-zinc-400" />}
              </label>
              <div className="flex gap-2 flex-wrap mb-2">
                {formData.images.map((url, idx) => (
                  <div key={`existing-${idx}`} className="relative w-16 h-16 bg-[#090A0C] border border-[#2B3037] rounded-lg overflow-hidden group">
                    <Image src={url} alt={`Preview ${idx}`} fill unoptimized className="object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <button type="button" onClick={() => handleDeleteImage(idx)} className="text-rose-400 hover:text-rose-300">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {pendingImageFiles.map((pf, idx) => (
                  <div key={`pending-${idx}`} className="relative w-16 h-16 bg-[#090A0C] border border-[#2B3037] rounded-lg overflow-hidden group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={pf.preview} alt={`Pending Preview ${idx}`} className="w-full h-full object-cover" />
                    <div className="absolute top-1 right-1 bg-zinc-700 text-[8px] font-mono px-1 rounded uppercase font-bold text-white z-10">Queue</div>
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-20">
                      <button type="button" onClick={() => handleDeletePendingImage(idx)} className="text-rose-400 hover:text-rose-300">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                <label className="w-16 h-16 flex flex-col items-center justify-center border border-dashed border-[#2B3037] rounded-lg cursor-pointer hover:bg-[#181A1D] hover:border-zinc-500 transition-colors">
                  <ImageIcon className="w-4 h-4 text-zinc-500 mb-0.5" />
                  <span className="text-[9px] text-zinc-500 font-mono uppercase">Upload</span>
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
              <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1 block">
                Status *
              </label>
              <select
                value={formData.status || 'AVAILABLE'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 bg-[#181A1D] border border-[#2B3037] rounded-xl text-white font-mono text-xs focus:outline-none focus:border-zinc-400"
                required
              >
                <option value="AVAILABLE">Available</option>
                <option value="OCCUPIED">Occupied</option>
                <option value="DIRTY">Dirty</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="OUT_OF_ORDER">Out of Order</option>
              </select>
            </div>

            <DialogFooter className="pt-3 border-t border-[#1E2227] flex justify-end gap-2.5 mt-4">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false)
                  setEditingRoom(null)
                  resetForm()
                }}
                className="px-4 py-2 rounded-xl bg-transparent border border-[#2B3037] text-zinc-400 hover:text-white text-xs font-mono transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs font-mono uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
              >
                {editingRoom ? 'Update Room' : 'Create Room'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* CREATE / EDIT ROOM TYPE MODAL */}
      {/* ======================================================== */}
      <Dialog open={showTypeModal} onOpenChange={setShowTypeModal}>
        <DialogContent className="max-w-lg bg-[#121417] border border-[#2B3037] p-6 rounded-2xl">
          <DialogHeader className="border-b border-[#1E2227] pb-4">
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-zinc-400" />
              {editingType ? 'Edit Suite Type' : 'Create New Suite Type'}
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Configure master suite tier rates, guest capacity, and amenities.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleTypeSubmit} className="space-y-4 pt-3">
            <div>
              <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1 block">Suite Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Deluxe Ocean Suite"
                value={typeFormData.name}
                onChange={e => setTypeFormData({ ...typeFormData, name: e.target.value })}
                className="w-full bg-[#181A1D] border border-[#2B3037] rounded-xl px-3 py-2 text-xs font-mono text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1 block">Base Rate (LKR/night) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="25000"
                  value={typeFormData.baseRate}
                  onChange={e => setTypeFormData({ ...typeFormData, baseRate: e.target.value })}
                  className="w-full bg-[#181A1D] border border-[#2B3037] rounded-xl px-3 py-2 text-xs font-mono text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1 block">Max Capacity *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={typeFormData.capacity}
                  onChange={e => setTypeFormData({ ...typeFormData, capacity: e.target.value })}
                  className="w-full bg-[#181A1D] border border-[#2B3037] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-zinc-400"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1 block">Description</label>
              <textarea
                rows={3}
                placeholder="Describe suite features, view, and architecture..."
                value={typeFormData.description}
                onChange={e => setTypeFormData({ ...typeFormData, description: e.target.value })}
                className="w-full bg-[#181A1D] border border-[#2B3037] rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 resize-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1 block">Amenities (comma-separated)</label>
              <input
                type="text"
                placeholder="King Bed, Ocean View, High-Speed WiFi, Mini Bar"
                value={typeFormData.amenities}
                onChange={e => setTypeFormData({ ...typeFormData, amenities: e.target.value })}
                className="w-full bg-[#181A1D] border border-[#2B3037] rounded-xl px-3 py-2 text-xs font-mono text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-[#1E2227] flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowTypeModal(false)}
                className="px-4 py-2 rounded-xl bg-transparent border border-[#2B3037] text-zinc-400 hover:text-white text-xs font-mono transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingType}
                className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs font-mono uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
              >
                {savingType && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{editingType ? 'Update Suite' : 'Create Suite'}</span>
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  )
}
