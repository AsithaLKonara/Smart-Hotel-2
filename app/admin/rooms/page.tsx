"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Plus, Edit, Trash2, Search, Filter, Bed, Users, DollarSign, Loader2, Save, X, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import toast from 'react-hot-toast'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import { formatPrice } from '@/lib/utils'
import { useProperty } from '@/contexts/property-context'

interface RoomType {
  id: string;
  name: string;
  baseRate: number;
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
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED'
  floor?: number
  size?: number
}

export default function AdminRoomsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { activePropertyId } = useProperty()
  const [rooms, setRooms] = useState<Room[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  
  const [formData, setFormData] = useState({
    number: '',
    roomTypeId: '',
    price: '',
    floor: '',
    size: '',
    status: 'AVAILABLE',
  })

  useEffect(() => {
    if (status === 'loading') return
    fetchRooms()
    fetchRoomTypes()
  }, [status, activePropertyId]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRooms = async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)
      const response = await fetch('/api/rooms', {
        signal: controller.signal,
        cache: 'no-store',
        credentials: 'include',
        headers: {
          'x-property-id': activePropertyId || 'all'
        }
      })
      clearTimeout(timeoutId)
      if (!response.ok) throw new Error('Failed to fetch rooms')
      const data = await response.json()

      const roomsArray: Room[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.rooms)
        ? data.rooms
        : []

      setRooms(roomsArray)
    } catch (error) {
      console.error('Error fetching rooms:', error)
      toast.error('Failed to load rooms')
      setRooms([])
    } finally {
      setLoading(false)
    }
  }

  const fetchRoomTypes = async () => {
    try {
      const response = await fetch('/api/room-types', { 
        cache: 'no-store',
        headers: {
          'x-property-id': activePropertyId || 'all'
        }
      })
      if (!response.ok) return;
      const data = await response.json()
      const list = Array.isArray(data) 
        ? data 
        : Array.isArray(data?.roomTypes) 
        ? data.roomTypes 
        : Array.isArray(data?.data) 
        ? data.data 
        : []
      setRoomTypes(list)
    } catch (error) {
      console.error('Error fetching room types:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.roomTypeId) {
      toast.error("Please select a Room Type");
      return;
    }

    try {
      // 1. Sync Base Rate to Room Type if custom price provided
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
              console.error('Failed to update room type rate:', e)
            }
          }
        }
      }

      // 2. Save Room
      const roomData = {
        number: formData.number,
        roomTypeId: formData.roomTypeId,
        status: formData.status,
        floor: formData.floor ? parseInt(formData.floor) : undefined,
        size: formData.size ? parseInt(formData.size) : undefined
      }

      const url = editingRoom ? `/api/rooms/${editingRoom.id}` : '/api/rooms'
      const method = editingRoom ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'x-property-id': activePropertyId || 'all'
        },
        body: JSON.stringify(roomData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || (editingRoom ? 'Failed to update room' : 'Failed to create room'))
      }

      toast.success(editingRoom ? 'Room updated successfully' : 'Room created successfully')
      setShowModal(false)
      setEditingRoom(null)
      resetForm()
      fetchRooms()
      fetchRoomTypes()
    } catch (error: any) {
      console.error('Error saving room:', error)
      toast.error(error.message || 'Failed to save room')
    }
  }

  const handleEdit = (room: Room) => {
    setEditingRoom(room)
    setFormData({
      number: room.number,
      roomTypeId: room.roomTypeId || '',
      price: room.roomType?.baseRate ? room.roomType.baseRate.toString() : '',
      floor: room.floor?.toString() || '',
      size: room.size?.toString() || '',
      status: room.status,
    })
    setShowModal(true)
  }

  const handleDelete = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return

    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'DELETE',
        headers: {
          'x-property-id': activePropertyId || 'all'
        }
      })

      if (!response.ok) throw new Error('Failed to delete room')

      toast.success('Room deleted successfully')
      fetchRooms()
    } catch (error) {
      console.error('Error deleting room:', error)
      toast.error('Failed to delete room')
    }
  }

  const resetForm = () => {
    setFormData({
      number: '',
      roomTypeId: '',
      price: '',
      floor: '',
      size: '',
      status: 'AVAILABLE',
    })
  }

  const safeRoomsArray = Array.isArray(rooms) ? rooms : []

  const filteredRooms = safeRoomsArray.filter(room => {
    const matchesSearch = room.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.roomType?.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || room.status === filterStatus
    const matchesType = filterType === 'all' || room.roomType?.name.toLowerCase() === filterType.toLowerCase()
    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'OCCUPIED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'MAINTENANCE':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'RESERVED':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50/50">
        <PremiumSpinner size="lg" text="Loading Rooms..." />
      </div>
    )
  }

  return (
    <div className="p-6">
      <Breadcrumbs
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Rooms' },
        ]}
        className="mb-4"
      />
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Room Directory</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage physical rooms and their availability
          </p>
        </div>
        <Button onClick={() => router.push('/admin/room-types')} variant="outline" className="mr-2 border-primary/30 text-primary">
          <ImageIcon className="w-4 h-4 mr-2" />
          Manage Room Types
        </Button>
      </div>

      {/* Filters and Actions */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search rooms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg w-full focus:ring-2 focus:ring-primary-500 bg-black/40 text-white"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 bg-black/40 text-white"
          >
            <option value="all">All Status</option>
            <option value="AVAILABLE">Available</option>
            <option value="OCCUPIED">Occupied</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="RESERVED">Reserved</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 bg-black/40 text-white"
          >
            <option value="all">All Types</option>
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
          className="w-full md:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Room
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-[#0f0f13] border-white/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Rooms</p>
                <p className="text-2xl font-bold text-white">{rooms.length}</p>
              </div>
              <Bed className="w-8 h-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0f0f13] border-white/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Available</p>
                <p className="text-2xl font-bold text-emerald-400">
                  {rooms.filter(r => r.status === 'AVAILABLE').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center">
                <Bed className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0f0f13] border-white/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Occupied</p>
                <p className="text-2xl font-bold text-blue-400">
                  {rooms.filter(r => r.status === 'OCCUPIED').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0f0f13] border-white/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Maintenance</p>
                <p className="text-2xl font-bold text-rose-400">
                  {rooms.filter(r => r.status === 'MAINTENANCE').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-rose-500/10 rounded-full flex items-center justify-center">
                <Bed className="w-5 h-5 text-rose-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredRooms.map((room) => (
          <Card key={room.id} className="hover:shadow-lg transition-shadow bg-[#0f0f13] border-white/5">
            <CardHeader className="pb-3 border-b border-white/5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-white">Room {room.number}</CardTitle>
                <Badge className={getStatusColor(room.status)}>
                  {room.status}
                </Badge>
              </div>
              <p className="text-sm text-slate-400">{room.roomType?.name}</p>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-emerald-400">{formatPrice(room.roomType?.baseRate || 0)}</span>
                    <span className="text-xs text-slate-500">/night</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-300">{room.roomType?.capacity}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-500">
                  {room.floor !== undefined && <span>Floor {room.floor}</span>}
                  {room.floor !== undefined && room.size !== undefined && <span> &bull; </span>}
                  {room.size !== undefined && <span>{room.size} m²</span>}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(room)}
                    className="flex-1 border-white/10 text-slate-300 hover:text-white"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(room.id)}
                    className="flex-1 border-rose-500/20 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRooms.length === 0 && (
        <Card className="p-12 text-center bg-[#0f0f13] border-white/5">
          <Bed className="w-16 h-16 mx-auto text-slate-600 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No rooms found</h3>
          <p className="text-slate-400 mb-4">
            {searchTerm || filterStatus !== 'all' || filterType !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by adding your first room'}
          </p>
          {rooms.length === 0 && (
            <Button onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Room
            </Button>
          )}
        </Card>
      )}

      {/* Add/Edit Room Modal */}
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
              {roomTypes.length === 0 && (
                <p className="text-[11px] text-amber-400 mt-1">
                  No room types found. <a href="/admin/room-types" className="underline font-bold" target="_blank" rel="noreferrer">Create a Room Type</a>
                </p>
              )}
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
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">
                Floor
              </label>
              <input
                type="number"
                value={formData.floor || ''}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                min="0"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">
                Size (m²)
              </label>
              <input
                type="number"
                value={formData.size || ''}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">
              Status *
            </label>
            <select
              value={formData.status || 'AVAILABLE'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
              required
            >
              <option value="AVAILABLE">Available</option>
              <option value="OCCUPIED">Occupied</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="RESERVED">Reserved</option>
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
    </div>
  )
}


