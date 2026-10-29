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
import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell'

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
    <AdminPageShell 
      title="System Governance & Settings"
      subtitle="Global property configuration, hospitality protocols, and core brand identity management."
    >
      <form onSubmit={handleSubmit} className="space-y-8 pb-20">
        {/* Brand Identity Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-8 border-b border-[#1E2227]">
          <div className="md:col-span-1 space-y-1">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2 font-mono">
               <Hotel className="w-4 h-4 text-zinc-400" /> Brand Identity
            </h3>
            <p className="text-xs text-zinc-400 font-mono leading-relaxed">
              Core credentials that appear across guest-facing invoices, booking folios, and public profiles.
            </p>
          </div>
          <div className="md:col-span-2">
            <Card className="bg-[#121417] border border-[#1E2227] rounded-xl shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">Property Name</label>
                    <input 
                      value={formData.hotel_name} 
                      onChange={(e) => handleChange('hotel_name', e.target.value)}
                      required
                      className="w-full bg-[#181A1D] border border-[#2B3037] rounded-lg h-9 px-3.5 text-xs text-zinc-100 outline-none focus:border-zinc-400 font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">Signature Tagline</label>
                    <input 
                      value={formData.hotel_tagline} 
                      onChange={(e) => handleChange('hotel_tagline', e.target.value)}
                      required
                      className="w-full bg-[#181A1D] border border-[#2B3037] rounded-lg h-9 px-3.5 text-xs text-zinc-100 outline-none focus:border-zinc-400 font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">Brand Narrative & Overview</label>
                  <textarea 
                    value={formData.hotel_description} 
                    onChange={(e) => handleChange('hotel_description', e.target.value)}
                    required
                    rows={4}
                    className="w-full bg-[#181A1D] border border-[#2B3037] rounded-lg p-3 text-xs text-zinc-100 outline-none focus:border-zinc-400 font-mono resize-y"
                  />
                  <p className="text-[10px] font-mono text-zinc-500">Displayed on the guest digital room terminal and reservation receipts.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Contact Infrastructure Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-8 border-b border-[#1E2227]">
          <div className="md:col-span-1 space-y-1">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2 font-mono">
               <Globe className="w-4 h-4 text-zinc-400" /> Communications
            </h3>
            <p className="text-xs text-zinc-400 font-mono leading-relaxed">
              Primary communication channels for guest inquiries, billing delivery, and coordinate routing.
            </p>
          </div>
          <div className="md:col-span-2">
            <Card className="bg-[#121417] border border-[#1E2227] rounded-xl shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">Official Dispatch Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                      <input 
                        type="email"
                        value={formData.hotel_email} 
                        onChange={(e) => handleChange('hotel_email', e.target.value)}
                        required
                        className="w-full bg-[#181A1D] border border-[#2B3037] rounded-lg h-9 pl-9 pr-3.5 text-xs text-zinc-100 outline-none focus:border-zinc-400 font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">Concierge Direct Line</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                      <input 
                        value={formData.hotel_phone} 
                        onChange={(e) => handleChange('hotel_phone', e.target.value)}
                        required
                        className="w-full bg-[#181A1D] border border-[#2B3037] rounded-lg h-9 pl-9 pr-3.5 text-xs text-zinc-100 outline-none focus:border-zinc-400 font-mono"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">Physical Property Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-3.5 h-3.5 text-zinc-500" />
                    <textarea 
                      value={formData.hotel_address} 
                      onChange={(e) => handleChange('hotel_address', e.target.value)}
                      required
                      rows={2}
                      className="w-full bg-[#181A1D] border border-[#2B3037] rounded-lg pl-9 pt-2 pr-3.5 text-xs text-zinc-100 outline-none focus:border-zinc-400 font-mono resize-y"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">Latitude</label>
                    <input 
                      value={formData.hotel_latitude} 
                      onChange={(e) => handleChange('hotel_latitude', e.target.value)}
                      className="w-full bg-[#181A1D] border border-[#2B3037] rounded-lg h-9 px-3.5 text-xs text-zinc-100 outline-none focus:border-zinc-400 font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">Longitude</label>
                    <input 
                      value={formData.hotel_longitude} 
                      onChange={(e) => handleChange('hotel_longitude', e.target.value)}
                      className="w-full bg-[#181A1D] border border-[#2B3037] rounded-lg h-9 px-3.5 text-xs text-zinc-100 outline-none focus:border-zinc-400 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">Google Maps Embed / Navigation URL</label>
                  <input 
                    value={formData.hotel_map_url || ''} 
                    onChange={(e) => handleChange('hotel_map_url', e.target.value)}
                    placeholder="https://maps.google.com/maps?q=..."
                    className="w-full bg-[#181A1D] border border-[#2B3037] rounded-lg h-9 px-3.5 text-xs text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-zinc-400 font-mono"
                  />
                  <p className="text-[10px] font-mono text-zinc-500">Leave blank to automatically render map tiles from geodetic coordinates.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Operational Protocols */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-8 border-b border-[#1E2227]">
          <div className="md:col-span-1 space-y-1">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2 font-mono">
               <Clock className="w-4 h-4 text-zinc-400" /> Operational Protocols
            </h3>
            <p className="text-xs text-zinc-400 font-mono leading-relaxed">
              Standard hotel check-in/out thresholds. These synchronize directly with OTA channels and night audit schedules.
            </p>
          </div>
          <div className="md:col-span-2">
            <Card className="bg-[#121417] border border-[#1E2227] rounded-xl shadow-sm">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">Check-in Standard Time</label>
                    <input 
                      type="time"
                      value={formData.check_in_time} 
                      onChange={(e) => handleChange('check_in_time', e.target.value)}
                      className="w-full bg-[#181A1D] border border-[#2B3037] rounded-lg h-9 px-3.5 text-xs text-zinc-100 outline-none focus:border-zinc-400 font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">Check-out Standard Time</label>
                    <input 
                      type="time"
                      value={formData.check_out_time} 
                      onChange={(e) => handleChange('check_out_time', e.target.value)}
                      className="w-full bg-[#181A1D] border border-[#2B3037] rounded-lg h-9 px-3.5 text-xs text-zinc-100 outline-none focus:border-zinc-400 font-mono"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Heritage & Milestones */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-1">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2 font-mono">
               <FileText className="w-4 h-4 text-zinc-400" /> Heritage & History
            </h3>
            <p className="text-xs text-zinc-400 font-mono leading-relaxed">
              Historical context rendered on guest welcome portals and corporate collateral.
            </p>
          </div>
          <div className="md:col-span-2">
            <Card className="bg-[#121417] border border-[#1E2227] rounded-xl shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-1 space-y-1.5">
                    <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">Founded Year</label>
                    <input 
                      value={formData.hotel_founded} 
                      onChange={(e) => handleChange('hotel_founded', e.target.value)}
                      placeholder="e.g. 1985"
                      className="w-full bg-[#181A1D] border border-[#2B3037] rounded-lg h-9 px-3.5 text-xs text-zinc-100 outline-none focus:border-zinc-400 font-mono"
                    />
                  </div>
                  <div className="md:col-span-3 space-y-1.5">
                    <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">Origin Story</label>
                    <textarea 
                      value={formData.hotel_story} 
                      onChange={(e) => handleChange('hotel_story', e.target.value)}
                      rows={3}
                      className="w-full bg-[#181A1D] border border-[#2B3037] rounded-lg p-3 text-xs text-zinc-100 outline-none focus:border-zinc-400 font-mono resize-y"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">Historical Milestones (One per line)</label>
                  <textarea 
                    value={formData.hotel_milestones} 
                    onChange={(e) => handleChange('hotel_milestones', e.target.value)}
                    rows={4}
                    placeholder="2010 - Expansion of East Wing&#10;2015 - Five Star Certification"
                    className="w-full bg-[#181A1D] border border-[#2B3037] rounded-lg p-3 text-xs text-zinc-100 outline-none focus:border-zinc-400 font-mono resize-y"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Bar (Sticky Footer) */}
        <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-[#090A0C]/90 backdrop-blur-md border-t border-[#1E2227] p-4 px-8 z-40">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
             <div className="text-xs font-mono text-zinc-500">
               <span>Unsaved changes will be lost if you leave this page.</span>
             </div>
             <Button 
               type="submit" 
               disabled={saving}
               className="h-9 px-5 bg-white hover:bg-zinc-200 text-black font-semibold text-xs font-mono uppercase tracking-wider rounded-lg flex items-center justify-center transition-all shadow-sm"
             >
               {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (
                 <>
                   <Save className="w-3.5 h-3.5 mr-2" /> Save Configuration
                 </>
               )}
             </Button>
          </div>
        </div>
      </form>
    </AdminPageShell>
  )
}
