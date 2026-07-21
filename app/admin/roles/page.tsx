"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  ShieldCheck, 
  Lock, 
  UserPlus, 
  Trash2, 
  ChevronRight,
  ShieldAlert,
  Save,
  Loader2,
  Users
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import { canAccessAdminDashboard } from '@/lib/rbac-helpers'

const ROLES_DEFINITION = [
  { id: 'SUPER_ADMIN', name: 'Super Admin', desc: 'Full system control, financial oversight, and audit access.', color: 'text-rose-500' },
  { id: 'MANAGER', name: 'Hotel Manager', desc: 'Operational oversight, staff management, and reporting.', color: 'text-amber-500' },
  { id: 'RECEPTIONIST', name: 'Receptionist', desc: 'Booking management, guest check-in/out, and room rack.', color: 'text-blue-500' },
  { id: 'KITCHEN', name: 'Kitchen Staff', desc: 'Order fulfillment, menu management, and inventory.', color: 'text-emerald-500' },
  { id: 'HOUSEKEEPING', name: 'Housekeeping', desc: 'Room status updates, maintenance tasks, and supplies.', color: 'text-purple-500' },
  { id: 'MAINTENANCE', name: 'Maintenance', icon: Lock, desc: 'Technical repairs and preventive maintenance.', color: 'text-orange-500' },
  { id: 'GUEST', name: 'Guest', desc: 'Standard guest access to profile and services.', color: 'text-slate-400' },
]

export default function RolesManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [staff, setStaff] = useState<any[]>([])

  useEffect(() => {
    if (status === 'loading') return
    
    if (!canAccessAdminDashboard(session)) {
      toast.error('Access Denied: Administrative authority required.')
      router.push('/auth/signin')
      return
    }

    fetchStaff()
  }, [session, status]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/staff')
      if (res.ok) {
        const data = await res.json()
        setStaff(data.staff || [])
      }
    } catch (err) {
      toast.error("Failed to fetch staff directory")
    } finally {
      setLoading(false)
    }
  }

  const updateStaffRole = async (staffId: string, newRole: string) => {
    toast.loading("Updating authority level...")
    try {
      const res = await fetch(`/api/staff/${staffId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })
      if (res.ok) {
        toast.dismiss()
        toast.success("Authority updated successfully")
        fetchStaff()
      } else {
        throw new Error("Update failed")
      }
    } catch (err) {
      toast.dismiss()
      toast.error("Failed to update staff role")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090514] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#090514] text-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Badge className="bg-primary/10 text-primary border-primary/20 uppercase tracking-widest text-[10px] py-1 px-3">
                Security Governance
              </Badge>
              <div className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
            </div>
            <h1 className="text-4xl font-serif font-bold text-white tracking-tight">Authority & RBAC Management</h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              Configure system-wide role-based access controls, manage administrative authority levels, and monitor personnel permissions across the SmartHotel architecture.
            </p>
          </div>
          <Button className="bg-white text-black hover:bg-slate-200 rounded-full px-8 h-12 font-bold transition-all shadow-xl shadow-white/5">
            <UserPlus className="w-4 h-4 mr-2" /> Provision New Staff
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left: Role Definitions */}
          <div className="lg:col-span-4 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/30 ml-2">Authority Definitions</h3>
            <div className="space-y-4">
              {ROLES_DEFINITION.map((role) => (
                <Card key={role.id} className="bg-white/[0.02] border-white/5 hover:border-white/10 transition-all rounded-3xl overflow-hidden group">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                      <ShieldCheck className={`w-6 h-6 ${role.color}`} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-white text-sm uppercase tracking-wider">{role.name}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">{role.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Right: Staff List & Control */}
          <div className="lg:col-span-8 space-y-6">
             <div className="flex items-center justify-between ml-2">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/30">Personnel Authority Control</h3>
                <span className="text-[10px] font-mono text-slate-600">{staff.length} Active Personnel Registered</span>
             </div>
             
             <Card className="bg-white/[0.02] border-white/5 rounded-[40px] overflow-hidden">
                <div className="divide-y divide-white/5">
                  {staff.length > 0 ? staff.map((member) => (
                    <div key={member.id} className="p-8 flex items-center justify-between hover:bg-white/[0.01] transition-colors group">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-transparent flex items-center justify-center border border-white/5">
                          <Users className="w-6 h-6 text-primary/60" />
                        </div>
                        <div className="space-y-1">
                          <h5 className="font-bold text-lg text-white group-hover:text-primary transition-colors">{member.name}</h5>
                          <p className="text-xs text-slate-500">{member.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                         <select 
                            className="bg-black/40 border border-white/10 text-xs text-white rounded-xl px-4 py-2 focus:border-primary outline-none transition-all"
                            value={member.role}
                            onChange={(e) => updateStaffRole(member.id, e.target.value)}
                         >
                            {ROLES_DEFINITION.map(r => (
                              <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                         </select>
                         <Button variant="ghost" size="icon" className="text-slate-600 hover:text-rose-500 rounded-xl hover:bg-rose-500/10">
                            <Trash2 className="w-4 h-4" />
                         </Button>
                      </div>
                    </div>
                  )) : (
                    <div className="p-32 text-center space-y-4">
                      <ShieldAlert className="w-12 h-12 text-white/5 mx-auto" />
                      <p className="text-xs text-white/20 uppercase tracking-[0.3em] font-black">No unauthorized personnel detected.</p>
                    </div>
                  )}
                </div>
             </Card>

             <div className="p-8 bg-amber-500/5 border border-amber-500/10 rounded-[30px] flex items-start gap-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-amber-500 font-bold text-sm uppercase tracking-widest">Administrative Warning</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Elevating authority levels grants significant system-wide permissions. Ensure all staff members undergo strict background verification before assigning administrative or financial roles.
                  </p>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  )
}
