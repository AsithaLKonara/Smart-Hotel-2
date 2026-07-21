"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { canAccessSuperAdminFeatures } from '@/lib/rbac-helpers'
import { 
  Save, Loader2, Hotel, Mail, Phone, MapPin, 
  Clock, FileText, Globe, ShieldCheck, Sparkles,
  Image as ImageIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import toast from 'react-hot-toast'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { motion } from 'framer-motion'

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
      
      const settingsMap = data.reduce((acc: any, curr: any) => {
        acc[curr.key] = curr.value
        return acc
      }, {})

      setFormData(prev => ({
        ...prev,
        ...settingsMap
      }))
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Failed to save settings')

      toast.success('System configuration updated successfully', {
        style: { background: '#0c0c0c', color: '#fff', border: '1px solid #c5a059' }
      })
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
        <PremiumSpinner size="lg" text="Accessing core mainframe..." />
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div className="min-h-screen bg-transparent p-8 lg:p-12 space-y-12">
      <DashboardHeader 
        title="System Governance"
        firstName={session?.user?.name?.split(' ')[0]}
        subtitle="Global property configuration, hospitality protocols, and core identity management."
        role="Super Administrator"
      />

      <form onSubmit={handleSubmit} className="max-w-5xl space-y-8">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {/* Brand Identity */}
          <motion.div variants={itemVariants} className="md:col-span-2">
            <Card className="bg-[#0c0c0c] border-white/5 rounded-[40px] overflow-hidden group">
              <CardHeader className="p-10 border-b border-white/5 bg-white/[0.01]">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-serif text-white flex items-center gap-3">
                      <Hotel className="w-6 h-6 text-primary" /> Brand Identity
                    </CardTitle>
                    <CardDescription className="text-white/30 text-xs uppercase tracking-widest font-black mt-1">Core property credentials</CardDescription>
                  </div>
                  <Sparkles className="w-8 h-8 text-white/5 group-hover:text-primary/20 transition-colors" />
                </div>
              </CardHeader>
              <CardContent className="p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-black text-white/20 ml-1">Property Name</label>
                    <Input 
                      value={formData.hotel_name} 
                      onChange={(e) => handleChange('hotel_name', e.target.value)}
                      required
                      className="bg-white/5 border-white/5 rounded-2xl h-14 focus:border-primary/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-black text-white/20 ml-1">Signature Tagline</label>
                    <Input 
                      value={formData.hotel_tagline} 
                      onChange={(e) => handleChange('hotel_tagline', e.target.value)}
                      required
                      className="bg-white/5 border-white/5 rounded-2xl h-14 focus:border-primary/50 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-black text-white/20 ml-1">Brand Narrative</label>
                  <Textarea 
                    value={formData.hotel_description} 
                    onChange={(e) => handleChange('hotel_description', e.target.value)}
                    required
                    rows={4}
                    className="bg-white/5 border-white/5 rounded-3xl p-6 focus:border-primary/50 transition-all resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact Infrastructure */}
          <motion.div variants={itemVariants}>
            <Card className="bg-[#0c0c0c] border-white/5 rounded-[40px] h-full overflow-hidden">
              <CardHeader className="p-8 border-b border-white/5 bg-white/[0.01]">
                <CardTitle className="text-xl font-serif text-white flex items-center gap-3">
                  <Globe className="w-5 h-5 text-indigo-400" /> Communications
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-black text-white/20 ml-1">Official Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <Input 
                      type="email"
                      value={formData.hotel_email} 
                      onChange={(e) => handleChange('hotel_email', e.target.value)}
                      required
                      className="bg-white/5 border-white/5 rounded-2xl h-12 pl-12"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-black text-white/20 ml-1">Concierge Line</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <Input 
                      value={formData.hotel_phone} 
                      onChange={(e) => handleChange('hotel_phone', e.target.value)}
                      required
                      className="bg-white/5 border-white/5 rounded-2xl h-12 pl-12"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-black text-white/20 ml-1">Physical Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 w-4 h-4 text-white/20" />
                    <Textarea 
                      value={formData.hotel_address} 
                      onChange={(e) => handleChange('hotel_address', e.target.value)}
                      required
                      rows={2}
                      className="bg-white/5 border-white/5 rounded-2xl pl-12 pt-3"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Operational Protocols */}
          <motion.div variants={itemVariants}>
            <Card className="bg-[#0c0c0c] border-white/5 rounded-[40px] h-full overflow-hidden">
              <CardHeader className="p-8 border-b border-white/5 bg-white/[0.01]">
                <CardTitle className="text-xl font-serif text-white flex items-center gap-3">
                  <Clock className="w-5 h-5 text-amber-400" /> Stay Protocols
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-black text-white/20 ml-1">Check-in</label>
                    <Input 
                      type="time"
                      value={formData.check_in_time} 
                      onChange={(e) => handleChange('check_in_time', e.target.value)}
                      className="bg-white/5 border-white/5 rounded-2xl h-12 text-center font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-black text-white/20 ml-1">Check-out</label>
                    <Input 
                      type="time"
                      value={formData.check_out_time} 
                      onChange={(e) => handleChange('check_out_time', e.target.value)}
                      className="bg-white/5 border-white/5 rounded-2xl h-12 text-center font-bold"
                    />
                  </div>
                </div>
                
                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[32px] space-y-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    <p className="text-[10px] text-white font-black uppercase tracking-widest">Global Sync Status</p>
                  </div>
                  <p className="text-[9px] text-white/30 leading-relaxed uppercase tracking-tighter">
                    These times are automatically pushed to OTA channels (Booking.com, Agoda) and integrated into guest welcome sequences.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Legacy & Heritage */}
          <motion.div variants={itemVariants} className="md:col-span-2">
            <Card className="bg-[#0c0c0c] border-white/5 rounded-[40px] overflow-hidden">
              <CardHeader className="p-8 border-b border-white/5 bg-white/[0.01]">
                <CardTitle className="text-xl font-serif text-white flex items-center gap-3">
                  <FileText className="w-5 h-5 text-emerald-400" /> Heritage & Milestones
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div className="md:col-span-1 space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-black text-white/20 ml-1">Founded Year</label>
                    <Input 
                      value={formData.hotel_founded} 
                      onChange={(e) => handleChange('hotel_founded', e.target.value)}
                      placeholder="e.g. 1985"
                      className="bg-white/5 border-white/5 rounded-2xl h-12"
                    />
                  </div>
                  <div className="md:col-span-3 space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-black text-white/20 ml-1">The Story So Far</label>
                    <Textarea 
                      value={formData.hotel_story} 
                      onChange={(e) => handleChange('hotel_story', e.target.value)}
                      rows={3}
                      className="bg-white/5 border-white/5 rounded-2xl focus:border-primary/50 transition-all resize-none"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <div className="flex justify-end pt-8">
          <Button 
            type="submit" 
            disabled={saving}
            className="h-16 px-12 bg-gold-gradient text-white rounded-2xl font-black uppercase tracking-widest text-xs border-none shadow-luxury min-w-[240px]"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                <Save className="w-4 h-4 mr-3" /> Commit System Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
