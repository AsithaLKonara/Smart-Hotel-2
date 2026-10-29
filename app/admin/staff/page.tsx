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
import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell'
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
    if (norm.includes('ADMIN') || norm.includes('MANAGER')) return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
    if (norm.includes('RECEPTION')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    if (norm.includes('HOUSE')) return 'bg-teal-500/10 text-teal-400 border-teal-500/20'
    if (norm.includes('MAINT')) return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    if (norm.includes('KITCHEN') || norm.includes('CHEF')) return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
    return 'bg-[#181A1D] text-zinc-400 border-[#2B3037]'
  }

  if (loadingStaff || loadingRoles) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-[#090A0C]">
        <PremiumSpinner size="lg" text="Loading Hotel Team..." />
      </div>
    )
  }

  return (
    <AdminPageShell
      title="Team Directory & Governance"
      subtitle="Create staff accounts, configure operational roles, and review granular security permissions."
      actions={
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs px-3.5 py-2 rounded-lg font-mono tracking-wider uppercase transition-all shadow-sm flex items-center gap-2 h-9"
        >
          <Plus className="w-3.5 h-3.5" /> Add Team Member
        </Button>
      }
    >
      <div className="space-y-6">
        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 border-b border-[#1E2227] pb-4">
          <button
            onClick={() => setActiveTab('DIRECTORY')}
            className={`text-xs font-mono uppercase tracking-wider px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'DIRECTORY'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'bg-[#181A1D] hover:bg-[#20242A] border border-[#2B3037] text-zinc-300'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Team Directory ({staff.length})
          </button>
          <button
            onClick={() => setActiveTab('PERMISSIONS')}
            className={`text-xs font-mono uppercase tracking-wider px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'PERMISSIONS'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'bg-[#181A1D] hover:bg-[#20242A] border border-[#2B3037] text-zinc-300'
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> Role Permissions Matrix
          </button>
        </div>

        {/* View 1: Team Directory */}
        {activeTab === 'DIRECTORY' && (
          <div className="space-y-6">
            {/* Quick KPI Stat Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-[#121417] border border-[#1E2227] p-4 rounded-xl shadow-sm">
                <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">Total Staff</p>
                <p className="text-2xl font-mono font-bold text-zinc-100 mt-1">{staff.length}</p>
              </Card>
              <Card className="bg-[#121417] border border-[#1E2227] p-4 rounded-xl shadow-sm">
                <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">Front Desk</p>
                <p className="text-2xl font-mono font-bold text-blue-400 mt-1">
                  {staff.filter(s => (s.roleName || '').toUpperCase().includes('RECEPTION')).length}
                </p>
              </Card>
              <Card className="bg-[#121417] border border-[#1E2227] p-4 rounded-xl shadow-sm">
                <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">Housekeeping</p>
                <p className="text-2xl font-mono font-bold text-teal-400 mt-1">
                  {staff.filter(s => (s.roleName || '').toUpperCase().includes('HOUSE')).length}
                </p>
              </Card>
              <Card className="bg-[#121417] border border-[#1E2227] p-4 rounded-xl shadow-sm">
                <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">Management</p>
                <p className="text-2xl font-mono font-bold text-purple-400 mt-1">
                  {staff.filter(s => (s.roleName || '').toUpperCase().includes('ADMIN') || (s.roleName || '').toUpperCase().includes('MANAGER')).length}
                </p>
              </Card>
            </div>

            {/* Filter and Search Bar */}
            <div className="p-3 bg-[#121417] border border-[#1E2227] rounded-xl flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  placeholder="Search by name, email, or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#181A1D] border border-[#2B3037] text-xs text-zinc-100 placeholder:text-zinc-500 rounded-lg pl-9 pr-3.5 py-2 outline-none focus:border-zinc-400 font-mono transition-all"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  onClick={() => setRoleFilter('ALL')}
                  className={`text-xs h-8 px-3 rounded-lg font-mono transition-all ${
                    roleFilter === 'ALL' ? 'bg-white text-black font-semibold shadow-sm' : 'bg-[#181A1D] hover:bg-[#20242A] border border-[#2B3037] text-zinc-300'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setRoleFilter('RECEPTION')}
                  className={`text-xs h-8 px-3 rounded-lg font-mono transition-all ${
                    roleFilter === 'RECEPTION' ? 'bg-blue-400 text-black font-semibold shadow-sm' : 'bg-[#181A1D] hover:bg-[#20242A] border border-[#2B3037] text-zinc-300'
                  }`}
                >
                  Front Desk
                </button>
                <button
                  onClick={() => setRoleFilter('HOUSE')}
                  className={`text-xs h-8 px-3 rounded-lg font-mono transition-all ${
                    roleFilter === 'HOUSE' ? 'bg-teal-400 text-black font-semibold shadow-sm' : 'bg-[#181A1D] hover:bg-[#20242A] border border-[#2B3037] text-zinc-300'
                  }`}
                >
                  Housekeeping
                </button>
                <button
                  onClick={() => setRoleFilter('MANAGER')}
                  className={`text-xs h-8 px-3 rounded-lg font-mono transition-all ${
                    roleFilter === 'MANAGER' ? 'bg-purple-400 text-black font-semibold shadow-sm' : 'bg-[#181A1D] hover:bg-[#20242A] border border-[#2B3037] text-zinc-300'
                  }`}
                >
                  Management
                </button>
              </div>
            </div>

            {/* Staff Table */}
            <div className="bg-[#121417] border border-[#1E2227] rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#141619] text-zinc-400 text-[11px] font-mono uppercase tracking-wider border-b border-[#1E2227]">
                    <tr>
                      <th className="p-3.5">Team Member</th>
                      <th className="p-3.5">Assigned Role</th>
                      <th className="p-3.5">Contact Phone</th>
                      <th className="p-3.5">Account Created</th>
                      <th className="p-3.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E2227]">
                    {filteredStaff.map((user: any) => (
                      <tr key={user.id} className="hover:bg-[#16181B] transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#181A1D] border border-[#1E2227] flex items-center justify-center font-mono font-bold text-zinc-100 text-xs">
                              {(user.name || 'S').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-zinc-100">{user.name || 'Unnamed Staff'}</p>
                              <p className="text-[11px] text-zinc-400 font-mono flex items-center gap-1">
                                <Mail className="w-3 h-3 text-zinc-500" /> {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase tracking-wider border ${getRoleBadgeStyle(user.roleName || user.role?.name)}`}>
                            {(user.roleName || user.role?.name || 'STAFF').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="p-3.5 text-zinc-300 text-xs font-mono">
                          {user.phone ? (
                            <span className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-zinc-500" /> {user.phone}</span>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>
                        <td className="p-3.5 text-xs text-zinc-400 font-mono">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                        </td>
                        <td className="p-3.5 text-right">
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            <Check className="w-3 h-3" /> ACTIVE
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredStaff.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-zinc-500 font-mono">
                          No team members found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* View 2: Role Permissions Matrix */}
        {activeTab === 'PERMISSIONS' && (
          <div className="bg-[#121417] border border-[#1E2227] rounded-xl overflow-hidden shadow-sm p-6 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2 font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Role Permissions Matrix
              </h2>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Preset access privileges for each organizational role in the hotel.
              </p>
            </div>

            <div className="overflow-x-auto border border-[#1E2227] rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] font-mono text-zinc-400 uppercase bg-[#141619] border-b border-[#1E2227]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Permission / Action</th>
                    {roles.map((r: any) => (
                      <th key={r.id} className="px-4 py-3 font-semibold text-center text-zinc-200">
                        {r.name.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2227]">
                  {allPermissions.map((perm: any) => (
                    <tr key={perm.id} className="hover:bg-[#16181B] transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-mono text-zinc-100 text-xs font-semibold">{perm.action}</div>
                        <div className="text-[11px] text-zinc-400 font-mono mt-0.5">{perm.description}</div>
                      </td>
                      {roles.map((r: any) => {
                        const hasAccess = roleHasPerm(r, perm.action)
                        return (
                          <td key={r.id} className="px-4 py-3 text-center">
                            {hasAccess ? (
                              <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400">
                                <Check className="w-3 h-3" />
                              </div>
                            ) : (
                              <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#181A1D] text-zinc-600">
                                <X className="w-3 h-3" />
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
        <DialogContent className="bg-[#121417] border border-[#1E2227] text-zinc-100 max-w-md rounded-xl p-6 shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-sm font-semibold flex items-center gap-2 text-zinc-100 font-mono">
              <Plus className="w-4 h-4 text-zinc-100" /> Add New Team Member
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs font-mono">
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
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">
                Full Name *
              </label>
              <input
                placeholder="e.g. Maya Jayawardena"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#181A1D] border border-[#2B3037] text-xs text-zinc-100 placeholder:text-zinc-500 rounded-lg px-3.5 py-2.5 outline-none focus:border-zinc-400 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">
                Work Email Address *
              </label>
              <input
                type="email"
                placeholder="e.g. maya@hotel.com"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-[#181A1D] border border-[#2B3037] text-xs text-zinc-100 placeholder:text-zinc-500 rounded-lg px-3.5 py-2.5 outline-none focus:border-zinc-400 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                placeholder="+94 77 123 4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-[#181A1D] border border-[#2B3037] text-xs text-zinc-100 placeholder:text-zinc-500 rounded-lg px-3.5 py-2.5 outline-none focus:border-zinc-400 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">
                Assigned Role *
              </label>
              <select
                value={formData.roleId}
                onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                className="w-full bg-[#181A1D] border border-[#2B3037] rounded-lg px-3.5 py-2.5 text-zinc-100 text-xs outline-none focus:border-zinc-400 font-mono"
              >
                <option value="" className="bg-[#121417]">Select a Role</option>
                {roles.map((r: any) => (
                  <option key={r.id} value={r.id} className="bg-[#121417]">
                    {r.name.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">
                Initial Password
              </label>
              <input
                type="password"
                placeholder="Default: Staff123!"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-[#181A1D] border border-[#2B3037] text-xs text-zinc-100 placeholder:text-zinc-500 rounded-lg px-3.5 py-2.5 outline-none focus:border-zinc-400 font-mono"
              />
              <p className="text-[10px] text-zinc-500 font-mono">Leave blank to use default temporary password (Staff123!).</p>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-[#1E2227]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
                className="bg-[#181A1D] hover:bg-[#20242A] border-[#2B3037] text-zinc-300 font-mono text-xs rounded-lg h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createStaffMutation.isPending}
                className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs font-mono uppercase tracking-wider rounded-lg h-9"
              >
                {createStaffMutation.isPending ? 'Creating...' : 'Create Account'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  )
}
