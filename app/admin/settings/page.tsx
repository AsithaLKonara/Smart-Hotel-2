"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { canAccessSuperAdminFeatures } from '@/lib/rbac-helpers'
import { 
  Save, Loader2, Hotel, Mail, Phone, MapPin, 
  Clock, FileText, Globe
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import toast from 'react-hot-toast'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'

export default function AdminSettingsPage() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    hotel_name: '',
    hotel_tagline: '',
    hotel_description: '',
    hotel_email: '',
    hotel_phone: '',
    hotel_address: '',
    hotel_latitude: '',
    hotel_longitude: '',
    hotel_map_url: '',
    hotel_story: '',
    hotel_founded: '',
    hotel_milestones: '',
    check_in_time: '14:00',
    check_out_time: '12:00',
  })

  useEffect(() => {
    if (authStatus === 'loading') return
    
    if (!canAccessSuperAdminFeatures(session)) {
      router.push('/admin/dashboard')
      return
    }

    fetchSettings()
  }, [session, authStatus]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (!response.ok) throw new Error('Failed to fetch settings')
      const data = await response.json()
      
      if (data.settings) {
        setFormData(prev => ({
          ...prev,
          ...data.settings
        }))
      }
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

      toast.success('System configuration updated successfully')
    } catch (error) {
      toast.error('Could not save configuration')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <PremiumSpinner size="lg" text="Accessing settings..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent p-8 lg:p-12">
      <DashboardHeader 
        title="System Governance"
        firstName={session?.user?.name?.split(' ')[0]}
        subtitle="Global property configuration, hospitality protocols, and core identity management."
        role="Super Administrator"
      />

      <form onSubmit={handleSubmit} className="max-w-6xl mt-12 space-y-12 pb-24">
        
        {/* Brand Identity Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12 border-b border-white/10">
          <div className="md:col-span-1 space-y-2">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
               <Hotel className="w-4 h-4 text-slate-400" /> Brand Identity
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Core credentials that appear across guest-facing invoices, booking portals, and public profiles.
            </p>
          </div>
          <div className="md:col-span-2">
            <Card className="bg-[#12121a] border-white/5 rounded-xl shadow-lg">
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Property Name</label>
                    <Input 
                      value={formData.hotel_name} 
                      onChange={(e) => handleChange('hotel_name', e.target.value)}
                      required
                      className="bg-[#1a1a24] border-white/10 rounded-md h-10 text-white focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Signature Tagline</label>
                    <Input 
                      value={formData.hotel_tagline} 
                      onChange={(e) => handleChange('hotel_tagline', e.target.value)}
                      required
                      className="bg-[#1a1a24] border-white/10 rounded-md h-10 text-white focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Brand Narrative</label>
                  <Textarea 
                    value={formData.hotel_description} 
                    onChange={(e) => handleChange('hotel_description', e.target.value)}
                    required
                    rows={4}
                    className="bg-[#1a1a24] border-white/10 rounded-md p-3 text-white focus:border-primary focus:ring-1 focus:ring-primary resize-y"
                  />
                  <p className="text-xs text-slate-500">Displayed on the main booking engine and About Us pages.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Contact Infrastructure Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12 border-b border-white/10">
          <div className="md:col-span-1 space-y-2">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
               <Globe className="w-4 h-4 text-slate-400" /> Communications
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Primary contact avenues for guest inquiries, corporate relations, and geolocation mapping.
            </p>
          </div>
          <div className="md:col-span-2">
            <Card className="bg-[#12121a] border-white/5 rounded-xl shadow-lg">
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Official Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input 
                        type="email"
                        value={formData.hotel_email} 
                        onChange={(e) => handleChange('hotel_email', e.target.value)}
                        required
                        className="bg-[#1a1a24] border-white/10 rounded-md h-10 pl-10 text-white focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Concierge Line</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input 
                        value={formData.hotel_phone} 
                        onChange={(e) => handleChange('hotel_phone', e.target.value)}
                        required
                        className="bg-[#1a1a24] border-white/10 rounded-md h-10 pl-10 text-white focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Physical Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <Textarea 
                      value={formData.hotel_address} 
                      onChange={(e) => handleChange('hotel_address', e.target.value)}
                      required
                      rows={2}
                      className="bg-[#1a1a24] border-white/10 rounded-md pl-10 pt-2.5 text-white focus:border-primary focus:ring-1 focus:ring-primary resize-y"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Latitude</label>
                    <Input 
                      value={formData.hotel_latitude} 
                      onChange={(e) => handleChange('hotel_latitude', e.target.value)}
                      className="bg-[#1a1a24] border-white/10 rounded-md h-10 text-white focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Longitude</label>
                    <Input 
                      value={formData.hotel_longitude} 
                      onChange={(e) => handleChange('hotel_longitude', e.target.value)}
                      className="bg-[#1a1a24] border-white/10 rounded-md h-10 text-white focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-sm font-medium text-slate-300">Custom Google Maps Embed / Pinpoint URL (Optional)</label>
                  <Input 
                    value={formData.hotel_map_url || ''} 
                    onChange={(e) => handleChange('hotel_map_url', e.target.value)}
                    placeholder="https://maps.google.com/maps?q=... or custom embed URL"
                    className="bg-[#1a1a24] border-white/10 rounded-md h-10 text-white focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-[11px] text-slate-400">Leave blank to automatically generate an interactive pinpoint map from coordinates and address.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Operational Protocols */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12 border-b border-white/10">
          <div className="md:col-span-1 space-y-2">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
               <Clock className="w-4 h-4 text-slate-400" /> Stay Protocols
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Standard hotel operational times. These sync directly to OTAs and guest confirmation emails.
            </p>
          </div>
          <div className="md:col-span-2">
            <Card className="bg-[#12121a] border-white/5 rounded-xl shadow-lg">
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Check-in Time</label>
                    <Input 
                      type="time"
                      value={formData.check_in_time} 
                      onChange={(e) => handleChange('check_in_time', e.target.value)}
                      className="bg-[#1a1a24] border-white/10 rounded-md h-10 text-white focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Check-out Time</label>
                    <Input 
                      type="time"
                      value={formData.check_out_time} 
                      onChange={(e) => handleChange('check_out_time', e.target.value)}
                      className="bg-[#1a1a24] border-white/10 rounded-md h-10 text-white focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Heritage & Milestones */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-2">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
               <FileText className="w-4 h-4 text-slate-400" /> Heritage & Milestones
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Historical context used in PR materials and "Our Story" sections of the main application.
            </p>
          </div>
          <div className="md:col-span-2">
            <Card className="bg-[#12121a] border-white/5 rounded-xl shadow-lg">
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-1 space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Founded Year</label>
                    <Input 
                      value={formData.hotel_founded} 
                      onChange={(e) => handleChange('hotel_founded', e.target.value)}
                      placeholder="e.g. 1985"
                      className="bg-[#1a1a24] border-white/10 rounded-md h-10 text-white focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="md:col-span-3 space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">The Story So Far</label>
                    <Textarea 
                      value={formData.hotel_story} 
                      onChange={(e) => handleChange('hotel_story', e.target.value)}
                      rows={3}
                      className="bg-[#1a1a24] border-white/10 rounded-md p-3 text-white focus:border-primary focus:ring-1 focus:ring-primary resize-y"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Milestones (One per line)</label>
                  <Textarea 
                    value={formData.hotel_milestones} 
                    onChange={(e) => handleChange('hotel_milestones', e.target.value)}
                    rows={4}
                    placeholder="2010 - Expansion of East Wing&#10;2015 - Five Star Certification"
                    className="bg-[#1a1a24] border-white/10 rounded-md p-3 text-white focus:border-primary focus:ring-1 focus:ring-primary resize-y"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Bar (Sticky Footer) */}
        <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-[#0a0a0f]/90 backdrop-blur-md border-t border-white/10 p-4 px-8 z-40">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
             <div className="text-sm text-slate-400">
               <span className="hidden sm:inline">Unsaved changes will be lost if you leave this page.</span>
             </div>
             <Button 
               type="submit" 
               disabled={saving}
               className="h-10 px-6 bg-primary hover:bg-primary/90 text-white font-medium rounded-md min-w-[140px] flex items-center justify-center transition-colors shadow-lg"
             >
               {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                 <>
                   <Save className="w-4 h-4 mr-2" /> Save Changes
                 </>
               )}
             </Button>
          </div>
        </div>

      </form>
    </div>
  )
}
