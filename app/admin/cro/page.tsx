'use client'

import React, { useState, useEffect } from 'react'
import {
  Building2,
  Calendar,
  Users,
  Search,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  X
} from 'lucide-react'

interface RoomType {
  roomTypeId: string
  name: string
  description?: string
  baseRate: number
  capacity: number
  amenities: string[]
  availableRoomsCount: number
}

interface PropertyOverview {
  propertyId: string
  propertyName: string
  propertyCode: string
  city: string
  country: string
  isSoldOut: boolean
  totalRooms: number
  availableRoomsCount: number
  lowestRate: number | null
  roomTypes: RoomType[]
}

export default function CROConsolePage() {
  const [checkIn, setCheckIn] = useState<string>('2026-12-01')
  const [checkOut, setCheckOut] = useState<string>('2026-12-05')
  const [capacity, setCapacity] = useState<number>(2)
  const [cityFilter, setCityFilter] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [properties, setProperties] = useState<PropertyOverview[]>([])
  const [error, setError] = useState<string | null>(null)

  // Booking Modal State
  const [selectedProp, setSelectedProp] = useState<PropertyOverview | null>(null)
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null)
  const [guestName, setGuestName] = useState<string>('')
  const [guestEmail, setGuestEmail] = useState<string>('')
  const [guestPhone, setGuestPhone] = useState<string>('')
  const [holdNotes, setHoldNotes] = useState<string>('')
  const [bookingLoading, setBookingLoading] = useState<boolean>(false)
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null)

  const fetchAvailability = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        checkIn,
        checkOut,
        capacity: capacity.toString(),
        ...(cityFilter ? { clusterCity: cityFilter } : {})
      })

      const res = await fetch(`/api/crs/availability?${params.toString()}`)
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch chain availability')
      }
      setProperties(data.clusterOverview || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAvailability()
  }, [])

  const handleOpenBooking = (property: PropertyOverview, roomType: RoomType) => {
    setSelectedProp(property)
    setSelectedRoomType(roomType)
    setBookingSuccess(null)
  }

  const handleConfirmHold = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProp || !selectedRoomType) return

    setBookingLoading(true)
    setError(null)

    try {
      const nights = Math.max(
        1,
        Math.round(
          (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
      const totalAmount = nights * selectedRoomType.baseRate

      const res = await fetch('/api/crs/quick-hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: selectedProp.propertyId,
          checkIn,
          checkOut,
          guestName,
          guestEmail,
          guestPhone,
          roomTypeId: selectedRoomType.roomTypeId,
          totalAmount,
          holdNotes
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to complete hold')
      }

      setBookingSuccess(data.booking)
      // Refresh inventory
      fetchAvailability()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBookingLoading(false)
    }
  }

  const nightsCount = Math.max(
    1,
    Math.round(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  )

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Central Reservation Office (CRO)
              </h1>
              <p className="text-sm text-slate-400">
                Multi-Property Live Availability, Cross-Selling & Rapid Agent Holds
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Chain Live Sync Active
          </span>
          <button
            onClick={fetchAvailability}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* CRO Search Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            fetchAvailability()
          }}
          className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
        >
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              Check-in Date
            </label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              Check-out Date
            </label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              Guests Capacity
            </label>
            <select
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>1 Guest</option>
              <option value={2}>2 Guests</option>
              <option value={3}>3 Guests</option>
              <option value={4}>4+ Guests</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              Cluster City (Optional)
            </label>
            <input
              type="text"
              placeholder="All Cities / Clusters"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg transition shadow-md shadow-blue-600/20"
            >
              <Search className="w-4 h-4" />
              Search Portfolio
            </button>
          </div>
        </form>
      </div>

      {/* Error alert */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Portfolio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <div
            key={property.propertyId}
            className={`rounded-xl border transition-all ${
              property.isSoldOut
                ? 'bg-slate-900/60 border-slate-800 opacity-90'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-xl'
            } flex flex-col justify-between overflow-hidden`}
          >
            {/* Card Header */}
            <div className="p-5 border-b border-slate-800/80">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {property.propertyCode}
                  </span>
                  <h2 className="text-lg font-bold text-white mt-1.5">
                    {property.propertyName}
                  </h2>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    {property.city}, {property.country}
                  </p>
                </div>

                {property.isSoldOut ? (
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                    100% SOLD OUT
                  </span>
                ) : (
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">From</span>
                    <span className="text-xl font-bold text-emerald-400">
                      ${property.lowestRate}
                    </span>
                    <span className="text-[10px] text-slate-500 block">/night</span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-slate-400 bg-slate-950/60 rounded-lg p-2 border border-slate-800/50">
                <span>Available Rooms:</span>
                <span
                  className={`font-semibold ${
                    property.availableRoomsCount > 0
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  {property.availableRoomsCount} / {property.totalRooms}
                </span>
              </div>
            </div>

            {/* Room Categories */}
            <div className="p-5 space-y-3 flex-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Available Room Plans
              </h3>

              {property.roomTypes.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  No rooms matching criteria
                </div>
              ) : (
                <div className="space-y-2.5">
                  {property.roomTypes.map((rt) => (
                    <div
                      key={rt.roomTypeId}
                      className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between gap-3 transition"
                    >
                      <div>
                        <h4 className="text-sm font-semibold text-white">
                          {rt.name}
                        </h4>
                        <p className="text-xs text-slate-400">
                          {rt.availableRoomsCount} units left • Sleeps {rt.capacity}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-sm font-bold text-slate-200">
                            ${rt.baseRate}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            ${rt.baseRate * nightsCount} total
                          </span>
                        </div>
                        <button
                          onClick={() => handleOpenBooking(property, rt)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition flex items-center gap-1 shadow-sm"
                        >
                          Hold <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Instant Hold Modal */}
      {selectedProp && selectedRoomType && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                  CRO Direct Telephone Hold
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {selectedProp.propertyName}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedProp(null)
                  setSelectedRoomType(null)
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bookingSuccess ? (
              <div className="p-6 space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-white">Hold Confirmed!</h4>
                <p className="text-xs text-slate-400">
                  Telephone reservation hold successfully established across chain CRS.
                </p>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-left space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Confirmation Code:</span>
                    <span className="font-bold text-emerald-400 text-sm">
                      {bookingSuccess.confirmationCode}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Property:</span>
                    <span className="text-white font-medium">
                      {bookingSuccess.propertyName} ({bookingSuccess.propertyCode})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Room Allocated:</span>
                    <span className="text-white font-medium">
                      Room #{bookingSuccess.allocatedRoom}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Guest:</span>
                    <span className="text-white font-medium">
                      {bookingSuccess.guestName}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedProp(null)
                    setSelectedRoomType(null)
                  }}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition"
                >
                  Close & Return to CRO Grid
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmHold} className="p-5 space-y-4">
                {/* Stay Quote Summary */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex justify-between items-center">
                  <div>
                    <span className="text-slate-400 block">{selectedRoomType.name}</span>
                    <span className="font-semibold text-white">
                      {checkIn} → {checkOut} ({nightsCount} nights)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block">Total Hold Rate</span>
                    <span className="text-base font-bold text-emerald-400">
                      ${nightsCount * selectedRoomType.baseRate}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Guest Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Eleanor Vance"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Guest Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="guest@example.com"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Agent Call Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Special requests, caller inquiry notes, arrival instructions..."
                    value={holdNotes}
                    onChange={(e) => setHoldNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProp(null)
                      setSelectedRoomType(null)
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition shadow-md shadow-blue-600/20 flex items-center gap-1.5"
                  >
                    {bookingLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    )}
                    Confirm Telephone Hold
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
