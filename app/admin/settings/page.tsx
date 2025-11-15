"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { canAccessManagerFeatures } from '@/lib/rbac-helpers'
import { Save, Loader2, Building2, Mail, Phone, MapPin, Clock, Globe, FileText, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import toast from 'react-hot-toast'

interface SettingsData {
  // Basic Info
  hotel_name: string
  hotel_tagline: string
  hotel_description: string
  
  // Contact Info
  hotel_email: string
  hotel_phone: string
  hotel_address: string
  
  // Check-in/out
  check_in_time: string
  check_out_time: string
  
  // Location
  hotel_latitude: string
  hotel_longitude: string
  
  // About Content
  hotel_story: string
  hotel_founded: string
  hotel_milestones: string
}

const defaultSettings: SettingsData = {
  hotel_name: 'SmartHotel Grand Palace',
  hotel_tagline: 'Luxury 5-Star Accommodation',
  hotel_description: 'Experience unparalleled luxury where timeless elegance meets modern hospitality.',
  hotel_email: 'info@smarthotel.com',
  hotel_phone: '+1 (800) 555-HOTEL',
  hotel_address: '123 Grand Boulevard, City Center, Metropolitan Area, ST 10001',
  check_in_time: '15:00',
  check_out_time: '11:00',
  hotel_latitude: '40.7589',
  hotel_longitude: '-73.9851',
  hotel_story: 'Since opening our doors in 1985, we have embraced guests with impeccable service, timeless design, and unforgettable experiences.',
  hotel_founded: '1985',
  hotel_milestones: JSON.stringify([
    '1985 - Flagship property opens in the heart of the city',
    '1992 - Awarded first AAA Five Diamond rating',
    '2001 - Major expansion adding conference and wellness wings',
    '2010 - Sustainability initiatives earn green certification',
    '2020 - Digital transformation enhances guest experiences'
  ])
}

export default function AdminSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<SettingsData>(defaultSettings)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!canAccessManagerFeatures(session)) {
      router.push('/auth/signin')
      return
    }

    fetchSettings()
  }, [session, status, router])

  const fetchSettings = async () => {
    try {
      const keys = Object.keys(defaultSettings)
      const response = await fetch(`/api/settings?keys=${keys.join(',')}`)
      if (!response.ok) throw new Error('Failed to fetch settings')
      
      const data = await response.json()
      const settings = data.settings || {}
      
      // Populate form with fetched settings or defaults
      const populated: SettingsData = { ...defaultSettings }
      Object.keys(populated).forEach(key => {
        if (settings[key] !== undefined) {
          populated[key as keyof SettingsData] = settings[key]
        }
      })
      
      setFormData(populated)
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Failed to save settings')

      toast.success('Settings saved successfully')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (key: keyof SettingsData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Hotel Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage hotel information, contact details, and content
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Basic Information
            </CardTitle>
            <CardDescription>Hotel name, tagline, and description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Hotel Name *</label>
              <input
                type="text"
                value={formData.hotel_name}
                onChange={(e) => handleChange('hotel_name', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tagline *</label>
              <input
                type="text"
                value={formData.hotel_tagline}
                onChange={(e) => handleChange('hotel_tagline', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description *</label>
              <textarea
                value={formData.hotel_description}
                onChange={(e) => handleChange('hotel_description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Contact Information
            </CardTitle>
            <CardDescription>Email, phone, and address</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email *</label>
              <input
                type="email"
                value={formData.hotel_email}
                onChange={(e) => handleChange('hotel_email', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone *</label>
              <input
                type="tel"
                value={formData.hotel_phone}
                onChange={(e) => handleChange('hotel_phone', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Address *</label>
              <textarea
                value={formData.hotel_address}
                onChange={(e) => handleChange('hotel_address', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Check-in/out Times */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Check-in/out Times
            </CardTitle>
            <CardDescription>Standard check-in and check-out times</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Check-in Time *</label>
                <input
                  type="time"
                  value={formData.check_in_time}
                  onChange={(e) => handleChange('check_in_time', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Check-out Time *</label>
                <input
                  type="time"
                  value={formData.check_out_time}
                  onChange={(e) => handleChange('check_out_time', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Location
            </CardTitle>
            <CardDescription>GPS coordinates for map display</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Latitude *</label>
                <input
                  type="number"
                  step="any"
                  value={formData.hotel_latitude}
                  onChange={(e) => handleChange('hotel_latitude', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Longitude *</label>
                <input
                  type="number"
                  step="any"
                  value={formData.hotel_longitude}
                  onChange={(e) => handleChange('hotel_longitude', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              About Page Content
            </CardTitle>
            <CardDescription>Story, founded year, and milestones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Hotel Story *</label>
              <textarea
                value={formData.hotel_story}
                onChange={(e) => handleChange('hotel_story', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Founded Year *</label>
              <input
                type="text"
                value={formData.hotel_founded}
                onChange={(e) => handleChange('hotel_founded', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., 1985"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Milestones (JSON Array) *</label>
              <textarea
                value={formData.hotel_milestones}
                onChange={(e) => handleChange('hotel_milestones', e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                placeholder='["1985 - Event 1", "1992 - Event 2"]'
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter milestones as a JSON array of strings
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={saving}
            size="lg"
            className="min-w-32"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

