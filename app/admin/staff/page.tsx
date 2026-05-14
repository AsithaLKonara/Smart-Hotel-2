"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { canAccessManagerFeatures } from '@/lib/rbac-helpers'
import { 
  Plus, Edit, Trash2, Search, Users, Mail, Phone, 
  Briefcase, Loader2, Save, X, Filter, Sparkles,
  UserPlus, ShieldCheck, DollarSign, Calendar as CalendarIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import toast from 'react-hot-toast'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Staff {
  id: string
  employeeId: string
  name: string
  email: string
  phone: string
  position: string
  department: string
  hireDate: string
  salary: number
  isActive: boolean
}

export default function AdminStaffPage() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    hireDate: '',
    salary: '',
    isActive: true
  })

  useEffect(() => {
    if (authStatus === 'loading') return
    
    if (!canAccessManagerFeatures(session)) {
      router.push('/auth/signin')
      return
    }

    fetchStaff()
  }, [session, authStatus, router])

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/staff')
      if (!response.ok) throw new Error('Failed to fetch staff')
      const data = await response.json()
      setStaff(data)
    } catch (error) {
      console.error('Error fetching staff:', error)
      toast.error('Failed to load staff')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const staffData = {
        employeeId: formData.employeeId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        position: formData.position,
        department: formData.department,
        hireDate: new Date(formData.hireDate).toISOString(),
        salary: parseFloat(formData.salary),
        isActive: formData.isActive
      }

      const url = editingStaff ? `/api/staff/${editingStaff.id}` : '/api/staff'
      const method = editingStaff ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffData)
      })

      if (!response.ok) throw new Error(editingStaff ? 'Failed to update staff' : 'Failed to create staff')

      toast.success(editingStaff ? 'Staff profile updated' : 'New staff member added')
      setShowModal(false)
      setEditingStaff(null)
      resetForm()
      fetchStaff()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this staff member? This will also disable their system access.')) return

    try {
      const response = await fetch(`/api/staff/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete staff')

      toast.success('Staff member removed successfully')
      fetchStaff()
    } catch (error) {
      toast.error('Could not remove staff member')
    }
  }

  const resetForm = () => {
    setFormData({
      employeeId: '',
      name: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      hireDate: '',
      salary: '',
      isActive: true
    })
  }

  const handleEdit = (member: Staff) => {
    setEditingStaff(member)
    setFormData({
      employeeId: member.employeeId,
      name: member.name,
      email: member.email,
      phone: member.phone,
      position: member.position,
      department: member.department,
      hireDate: member.hireDate.split('T')[0],
      salary: member.salary.toString(),
      isActive: member.isActive
    })
    setShowModal(true)
  }

  const departments = ['Reception', 'Housekeeping', 'Restaurant', 'Kitchen', 'Maintenance', 'Management', 'Security']

  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         member.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDept = filterDepartment === 'all' || member.department === filterDepartment
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' ? member.isActive : !member.isActive)
    
    return matchesSearch && matchesDept && matchesStatus
  })

  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <PremiumSpinner size="lg" text="Decrypting personnel files..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent p-8 lg:p-12 space-y-12">
      <DashboardHeader 
        title="Human Capital"
        firstName={session?.user?.name?.split(' ')[0]}
        subtitle="Manage elite staff profiles, department assignments, and system permissions from the sovereign command center."
        role="HR Governance"
      />

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="flex flex-1 gap-4 w-full md:max-w-2xl">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search by name, ID or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-14 bg-white/5 border-white/5 rounded-2xl focus:border-primary/50 transition-all text-sm"
            />
          </div>
          <Button 
            variant="outline" 
            className="h-14 px-6 border-white/5 bg-white/5 rounded-2xl text-white/40 hover:text-white"
          >
            <Filter className="w-4 h-4 mr-2" /> Filters
          </Button>
        </div>

        <Button 
          onClick={() => { resetForm(); setEditingStaff(null); setShowModal(true); }}
          className="h-14 px-8 bg-gold-gradient text-white rounded-2xl font-black uppercase tracking-widest text-[10px] border-none shadow-luxury w-full md:w-auto"
        >
          <UserPlus className="w-4 h-4 mr-2" /> Onboard Staff
        </Button>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredStaff.map((member) => (
            <motion.div
              key={member.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="group relative"
            >
              <Card className="bg-[#0c0c0c] border-white/5 rounded-[32px] overflow-hidden hover:border-white/10 transition-all">
                <div className="p-8 flex items-start gap-6">
                  <div className="w-20 h-20 rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:border-primary/30 transition-colors">
                    <span className="text-2xl font-serif font-bold text-white/40 group-hover:text-primary transition-colors">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="text-xl font-serif font-bold text-white truncate">{member.name}</h4>
                          <Badge className={cn(
                            "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 border-none",
                            member.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-white/10 text-white/40"
                          )}>
                            {member.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mt-1">
                          {member.position} • {member.department}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          onClick={() => handleEdit(member)}
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8 rounded-lg bg-white/5 text-white/40 hover:text-primary hover:bg-primary/10 transition-all"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          onClick={() => handleDelete(member.id)}
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8 rounded-lg bg-white/5 text-white/40 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/5 text-white/20"><Mail className="w-3 h-3" /></div>
                        <p className="text-[10px] text-white/40 font-medium truncate">{member.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/5 text-white/20"><ShieldCheck className="w-3 h-3" /></div>
                        <p className="text-[10px] text-white/40 font-medium truncate">ID: {member.employeeId}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredStaff.length === 0 && (
          <div className="col-span-full py-40 text-center border-2 border-dashed border-white/5 rounded-[40px] space-y-4">
            <Users className="w-12 h-12 text-white/5 mx-auto" />
            <div className="space-y-1">
              <p className="text-white/40 font-bold">No Personnel Found</p>
              <p className="text-[10px] text-white/20 uppercase tracking-widest">Adjust filters or onboard new talent</p>
            </div>
          </div>
        )}
      </div>

      {/* Onboarding Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-[#0c0c0c] border border-white/10 rounded-[40px] shadow-2xl overflow-hidden relative z-10"
            >
              <div className="p-10 space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-3xl font-serif font-bold text-white">
                      {editingStaff ? 'Update Profile' : 'New Onboarding'}
                    </h3>
                    <p className="text-[10px] text-white/30 uppercase font-black tracking-widest mt-1">
                      Staff Member Lifecycle Management
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setShowModal(false)}
                    className="w-10 h-10 rounded-full bg-white/5 text-white/40 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-black text-white/20 ml-1">Full Name</label>
                      <Input 
                        value={formData.name} 
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="bg-white/5 border-white/5 rounded-2xl h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-black text-white/20 ml-1">Employee ID</label>
                      <Input 
                        value={formData.employeeId} 
                        onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                        required
                        className="bg-white/5 border-white/5 rounded-2xl h-12"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-black text-white/20 ml-1">Email Address</label>
                      <Input 
                        type="email"
                        value={formData.email} 
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="bg-white/5 border-white/5 rounded-2xl h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-black text-white/20 ml-1">Phone Number</label>
                      <Input 
                        value={formData.phone} 
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                        className="bg-white/5 border-white/5 rounded-2xl h-12"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-black text-white/20 ml-1">Department</label>
                      <select
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full bg-white/5 border-white/5 rounded-2xl h-12 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 appearance-none"
                        required
                      >
                        <option value="" className="bg-[#0c0c0c]">Select Department</option>
                        {departments.map(d => <option key={d} value={d} className="bg-[#0c0c0c]">{d}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-black text-white/20 ml-1">Position / Title</label>
                      <Input 
                        value={formData.position} 
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        required
                        className="bg-white/5 border-white/5 rounded-2xl h-12"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-black text-white/20 ml-1">Base Salary ($)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <Input 
                          type="number"
                          value={formData.salary} 
                          onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                          required
                          className="bg-white/5 border-white/5 rounded-2xl h-12 pl-12"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-black text-white/20 ml-1">Hire Date</label>
                      <div className="relative">
                        <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <Input 
                          type="date"
                          value={formData.hireDate} 
                          onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                          required
                          className="bg-white/5 border-white/5 rounded-2xl h-12 pl-12"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 rounded-md border-white/10 bg-white/5 checked:bg-primary transition-all"
                    />
                    <label htmlFor="isActive" className="text-xs font-bold text-white/60">
                      Grant System Access & Mark Active
                    </label>
                  </div>

                  <div className="flex gap-4 pt-6">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="flex-1 h-14 bg-gold-gradient text-white rounded-2xl font-black uppercase tracking-widest text-[10px] border-none shadow-luxury"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingStaff ? 'Update Profile' : 'Confirm Onboarding'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowModal(false)}
                      className="h-14 px-8 border-white/10 bg-white/5 text-white/60 hover:bg-white/10 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
