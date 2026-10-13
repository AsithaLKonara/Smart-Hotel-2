'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Users, 
  Shield, 
  Check, 
  X, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  UserCheck, 
  Lock, 
  ShieldCheck, 
  Sparkles,
  KeyRound,
  Filter
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import { useProperty } from '@/contexts/property-context'
import toast from 'react-hot-toast'

const ROLE_PRESETS = [
  { id: 'MANAGER', name: 'General Manager', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  { id: 'RECEPTIONIST', name: 'Front Desk / Receptionist', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
  { id: 'HOUSEKEEPING', name: 'Housekeeper', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
  { id: 'MAINTENANCE', name: 'Maintenance Technician', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { id: 'KITCHEN', name: 'Kitchen / F&B Staff', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
]

export default function StaffDirectoryPage() {
  const queryClient = useQueryClient()
  const { activePropertyId } = useProperty()
  
  const [activeTab, setActiveTab] = useState<'DIRECTORY' | 'PERMISSIONS'>('DIRECTORY')
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // New staff form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    roleId: ''
  })

  // 1. Fetch Staff Users
  const { data: staffData, isLoading: loadingStaff } = useQuery({
    queryKey: ['staff-directory', activePropertyId],
    queryFn: async () => {
      const res = await fetch('/api/admin/users', {
        headers: { 'x-property-id': activePropertyId || 'all' }
      })
      if (!res.ok) throw new Error('Failed to fetch staff')
      return res.json()
    }
  })

  // 2. Fetch Roles & Permissions
  const { data: roleData, isLoading: loadingRoles } = useQuery({
    queryKey: ['staff-roles'],
    queryFn: async () => {
      await fetch('/api/staff/seed', { method: 'POST' })
      const res = await fetch('/api/staff/roles')
      if (!res.ok) throw new Error('Failed to fetch roles')
      return res.json()
    }
  })

  // 3. Create Staff Mutation
  const createStaffMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-property-id': activePropertyId || 'all'
        },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create team member')
      return data
    },
    onSuccess: (data) => {
      toast.success(`Team member ${data.user?.name || ''} created successfully!`)
      setIsAddModalOpen(false)
      setFormData({ name: '', email: '', phone: '', password: '', roleId: '' })
      queryClient.invalidateQueries({ queryKey: ['staff-directory'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error creating user')
    }
  })

  const staff: any[] = staffData?.users || []
  const roles: any[] = roleData?.roles || []
  const allPermissions: any[] = roleData?.allPermissions || []

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staff.filter(member => {
      if (roleFilter !== 'ALL') {
        const memberRole = (member.roleName || member.role?.name || '').toUpperCase()
        if (!memberRole.includes(roleFilter.toUpperCase())) return false
      }
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      const name = (member.name || '').toLowerCase()
      const email = (member.email || '').toLowerCase()
      const phone = (member.phone || '').toLowerCase()
      const role = (member.roleName || member.role?.name || '').toLowerCase()
      return name.includes(q) || email.includes(q) || phone.includes(q) || role.includes(q)
    })
  }, [staff, searchQuery, roleFilter])

  const roleHasPerm = (role: any, action: string) => {
    if (role.name === 'GENERAL_MANAGER' || role.name === 'SUPER_ADMIN') return true
    return role.permissions?.some((rp: any) => rp.permission?.action === action)
  }

  const getRoleBadgeStyle = (roleName: string) => {
    const norm = (roleName || '').toUpperCase()
    if (norm.includes('ADMIN') || norm.includes('MANAGER')) return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    if (norm.includes('RECEPTION')) return 'bg-sky-500/20 text-sky-300 border-sky-500/30'
    if (norm.includes('HOUSE')) return 'bg-teal-500/20 text-teal-300 border-teal-500/30'
    if (norm.includes('MAINT')) return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    if (norm.includes('KITCHEN') || norm.includes('CHEF')) return 'bg-rose-500/20 text-rose-300 border-rose-500/30'
    return 'bg-white/10 text-white/70 border-white/20'
  }

  if (loadingStaff || loadingRoles) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <PremiumSpinner size="lg" text="Loading Hotel Team..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white p-6 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                Staff Governance Hub
              </span>
            </div>
            <h1 className="text-3xl font-serif font-bold text-white flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              Team & Access Control
            </h1>
            <p className="text-white/60 text-sm mt-1 max-w-xl">
              Create staff accounts, assign operational roles, and review security access permissions across all hotel departments.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-end">
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs gap-2 shadow-lg"
            >
              <Plus className="w-4 h-4" /> Add Team Member
            </Button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-4">
          <Button
            variant={activeTab === 'DIRECTORY' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('DIRECTORY')}
            className={`text-xs uppercase tracking-wider font-bold gap-2 ${
              activeTab === 'DIRECTORY'
                ? 'bg-primary text-primary-foreground'
                : 'border-white/10 bg-white/5 text-white/60 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" /> Team Directory ({staff.length})
          </Button>
          <Button
            variant={activeTab === 'PERMISSIONS' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('PERMISSIONS')}
            className={`text-xs uppercase tracking-wider font-bold gap-2 ${
              activeTab === 'PERMISSIONS'
                ? 'bg-primary text-primary-foreground'
                : 'border-white/10 bg-white/5 text-white/60 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" /> Role Permissions Matrix
          </Button>
        </div>

        {/* View 1: Team Directory */}
        {activeTab === 'DIRECTORY' && (
          <div className="space-y-6">
            
            {/* Quick KPI Stat Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-[#121118] border-white/5 p-4 rounded-xl">
                <p className="text-[10px] uppercase font-bold text-white/40">Total Team</p>
                <p className="text-2xl font-bold text-white mt-1">{staff.length}</p>
              </Card>
              <Card className="bg-[#121118] border-white/5 p-4 rounded-xl">
                <p className="text-[10px] uppercase font-bold text-sky-400">Front Desk</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {staff.filter(s => (s.roleName || '').toUpperCase().includes('RECEPTION')).length}
                </p>
              </Card>
              <Card className="bg-[#121118] border-white/5 p-4 rounded-xl">
                <p className="text-[10px] uppercase font-bold text-teal-400">Housekeeping</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {staff.filter(s => (s.roleName || '').toUpperCase().includes('HOUSE')).length}
                </p>
              </Card>
              <Card className="bg-[#121118] border-white/5 p-4 rounded-xl">
                <p className="text-[10px] uppercase font-bold text-purple-400">Management</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {staff.filter(s => (s.roleName || '').toUpperCase().includes('ADMIN') || (s.roleName || '').toUpperCase().includes('MANAGER')).length}
                </p>
              </Card>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Search by name, email, or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white text-xs h-10 placeholder:text-white/30 focus-visible:border-primary/50"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                <Button
                  variant={roleFilter === 'ALL' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRoleFilter('ALL')}
                  className={`text-xs h-8 ${roleFilter === 'ALL' ? 'bg-primary text-primary-foreground font-bold' : 'border-white/10 text-white/60 bg-white/5'}`}
                >
                  All
                </Button>
                <Button
                  variant={roleFilter === 'RECEPTION' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRoleFilter('RECEPTION')}
                  className={`text-xs h-8 ${roleFilter === 'RECEPTION' ? 'bg-sky-500 text-black font-bold' : 'border-white/10 text-white/60 bg-white/5'}`}
                >
                  Front Desk
                </Button>
                <Button
                  variant={roleFilter === 'HOUSE' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRoleFilter('HOUSE')}
                  className={`text-xs h-8 ${roleFilter === 'HOUSE' ? 'bg-teal-500 text-black font-bold' : 'border-white/10 text-white/60 bg-white/5'}`}
                >
                  Housekeeping
                </Button>
                <Button
                  variant={roleFilter === 'MANAGER' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRoleFilter('MANAGER')}
                  className={`text-xs h-8 ${roleFilter === 'MANAGER' ? 'bg-purple-500 text-white font-bold' : 'border-white/10 text-white/60 bg-white/5'}`}
                >
                  Management
                </Button>
              </div>
            </div>

            {/* Staff Table */}
            <div className="bg-[#121118] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <table className="w-full text-left text-sm text-white">
                <thead className="bg-white/5 text-white/50 text-xs uppercase border-b border-white/10">
                  <tr>
                    <th className="p-4">Team Member</th>
                    <th className="p-4">Assigned Role</th>
                    <th className="p-4">Contact Phone</th>
                    <th className="p-4">Account Created</th>
                    <th className="p-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredStaff.map((user: any) => (
                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-primary text-sm">
                            {(user.name || 'S').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{user.name || 'Unnamed'}</p>
                            <p className="text-xs text-white/40 font-mono flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider border ${getRoleBadgeStyle(user.roleName || user.role?.name)}`}>
                          {(user.roleName || user.role?.name || 'STAFF').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-white/70 text-xs font-mono">
                        {user.phone ? (
                          <span className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-white/40" /> {user.phone}</span>
                        ) : (
                          <span className="text-white/30">—</span>
                        )}
                      </td>
                      <td className="p-4 text-xs text-white/50">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="p-4 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <Check className="w-3 h-3" /> Active
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredStaff.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-white/40">
                        No team members found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* View 2: Role Permissions Matrix */}
        {activeTab === 'PERMISSIONS' && (
          <div className="bg-[#121118] border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" /> Role Permissions Matrix
              </h2>
              <p className="text-xs text-white/50 mt-1">
                Preset access privileges for each organizational role in the hotel.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-white/50 uppercase bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Permission / Action</th>
                    {roles.map((r: any) => (
                      <th key={r.id} className="px-4 py-3 font-semibold text-center text-white">
                        {r.name.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {allPermissions.map((perm: any) => (
                    <tr key={perm.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-mono text-white text-xs font-semibold">{perm.action}</div>
                        <div className="text-[11px] text-white/40 mt-0.5">{perm.description}</div>
                      </td>
                      {roles.map((r: any) => {
                        const hasAccess = roleHasPerm(r, perm.action)
                        return (
                          <td key={r.id} className="px-4 py-3 text-center">
                            {hasAccess ? (
                              <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            ) : (
                              <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/5 text-white/20">
                                <X className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Add Team Member Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="bg-[#121118] border-white/10 text-white max-w-md rounded-2xl p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
              <Plus className="w-5 h-5 text-primary" /> Add New Team Member
            </DialogTitle>
            <DialogDescription className="text-white/60 text-xs">
              Create a login account and assign a role for front desk, housekeeping, or management.
            </DialogDescription>
          </DialogHeader>

          <form 
            onSubmit={(e) => {
              e.preventDefault()
              if (!formData.name || !formData.email) {
                return toast.error("Name and email are required")
              }
              createStaffMutation.mutate(formData)
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1">
                Full Name *
              </label>
              <Input
                placeholder="e.g. Maya Jayawardena"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-white/5 border-white/10 text-white text-xs h-10"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1">
                Work Email Address *
              </label>
              <Input
                type="email"
                placeholder="e.g. maya@hotel.com"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-white/5 border-white/10 text-white text-xs h-10"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1">
                Phone Number (Optional)
              </label>
              <Input
                type="tel"
                placeholder="+94 77 123 4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-white/5 border-white/10 text-white text-xs h-10"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1">
                Assigned Role *
              </label>
              <select
                value={formData.roleId}
                onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white text-xs focus:outline-none focus:border-primary/50"
              >
                <option value="" className="bg-[#121118]">Select a Role</option>
                {roles.map((r: any) => (
                  <option key={r.id} value={r.id} className="bg-[#121118]">
                    {r.name.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1">
                Initial Password
              </label>
              <Input
                type="password"
                placeholder="Default: Staff123!"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-white/5 border-white/10 text-white text-xs h-10"
              />
              <p className="text-[11px] text-white/40 mt-1">Leave blank to use default temporary password (Staff123!).</p>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
                className="border-white/10 text-white/60 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createStaffMutation.isPending}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
              >
                {createStaffMutation.isPending ? 'Creating...' : 'Create Account'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}
