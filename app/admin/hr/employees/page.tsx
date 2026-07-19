"use client"

import { useState, useEffect } from 'react'
import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import * as Dialog from '@radix-ui/react-dialog'
import { Users, Mail, Phone, Briefcase, Plus, Search, X } from 'lucide-react'
import toast from 'react-hot-toast'

function ModalShell({ open, onClose, title, children }: { open: boolean, onClose: () => void, title: string, children: React.ReactNode }) {
  return (
    <Dialog.Root open={open} onOpenChange={(o: boolean) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl p-6 z-50 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

const DEPT_COLORS: Record<string, string> = {
  FRONT_DESK: 'bg-sky-500/20 text-sky-400',
  KITCHEN: 'bg-orange-500/20 text-orange-400',
  HOUSEKEEPING: 'bg-teal-500/20 text-teal-400',
  MAINTENANCE: 'bg-amber-500/20 text-amber-400',
  MANAGEMENT: 'bg-purple-500/20 text-purple-400',
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    department: 'FRONT_DESK', position: '', baseSalary: '', hireDate: ''
  })

  const fetchEmployees = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/hr/employees')
      if (res.ok) setEmployees(await res.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchEmployees() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/hr/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, baseSalary: parseFloat(formData.baseSalary) })
      })
      if (res.ok) {
        toast.success("Employee added")
        setShowModal(false)
        setFormData({ firstName: '', lastName: '', email: '', phone: '', department: 'FRONT_DESK', position: '', baseSalary: '', hireDate: '' })
        fetchEmployees()
      } else {
        toast.error("Failed to add employee")
      }
    } catch (e) { toast.error("Error submitting form") }
  }

  const filtered = employees.filter(e =>
    `${e.firstName} ${e.lastName} ${e.email} ${e.department}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AdminPageShell title="Employee Directory" subtitle="Manage hotel staff profiles and department assignments." onRefresh={fetchEmployees}>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
          <Input placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white" />
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-primary text-white">
          <Plus className="w-4 h-4 mr-2" /> Add Employee
        </Button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><PremiumSpinner /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map(emp => (
            <Card key={emp.id} className="bg-white/5 border-white/10 hover:border-white/20 transition-all shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                    {emp.firstName?.[0]}{emp.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-white truncate">{emp.firstName} {emp.lastName}</h3>
                    <p className="text-sm text-primary/80 font-medium truncate">{emp.position}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <Briefcase className="w-4 h-4 flex-shrink-0" />
                    <Badge className={`text-xs ${DEPT_COLORS[emp.department] || 'bg-white/10 text-white/60'}`}>
                      {emp.department.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60 truncate">
                    <Mail className="w-4 h-4 flex-shrink-0 text-white/40" /> <span className="truncate">{emp.email}</span>
                  </div>
                  {emp.phone && (
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <Phone className="w-4 h-4 flex-shrink-0 text-white/40" /> {emp.phone}
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                  <span className="text-xs text-white/40">Hired {emp.hireDate ? new Date(emp.hireDate).toLocaleDateString() : '—'}</span>
                  <span className="text-sm font-bold text-emerald-400">${emp.baseSalary?.toFixed(2)}/mo</span>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="text-slate-500 col-span-3 text-center py-12">No employees found.</p>
          )}
        </div>
      )}

      <ModalShell open={showModal} onClose={() => setShowModal(false)} title="Add New Employee">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-2 block">First Name</label>
              <Input required value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} className="bg-[#1a1a24] border-white/10 text-white" />
            </div>
            <div>
              <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-2 block">Last Name</label>
              <Input required value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} className="bg-[#1a1a24] border-white/10 text-white" />
            </div>
            <div>
              <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-2 block">Email</label>
              <Input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="bg-[#1a1a24] border-white/10 text-white" />
            </div>
            <div>
              <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-2 block">Phone</label>
              <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="bg-[#1a1a24] border-white/10 text-white" />
            </div>
            <div>
              <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-2 block">Department</label>
              <select required value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })}
                className="w-full bg-[#1a1a24] border border-white/10 rounded-lg p-2.5 text-sm text-white">
                <option value="FRONT_DESK">Front Desk</option>
                <option value="KITCHEN">Kitchen</option>
                <option value="HOUSEKEEPING">Housekeeping</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="MANAGEMENT">Management</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-2 block">Position / Title</label>
              <Input required value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })} className="bg-[#1a1a24] border-white/10 text-white" />
            </div>
            <div>
              <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-2 block">Base Salary (Monthly)</label>
              <Input type="number" required value={formData.baseSalary} onChange={e => setFormData({ ...formData, baseSalary: e.target.value })} className="bg-[#1a1a24] border-white/10 text-white" />
            </div>
            <div>
              <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-2 block">Hire Date</label>
              <Input type="date" required value={formData.hireDate} onChange={e => setFormData({ ...formData, hireDate: e.target.value })} className="bg-[#1a1a24] border-white/10 text-white" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" className="bg-primary text-white">Save Employee</Button>
          </div>
        </form>
      </ModalShell>

    </AdminPageShell>
  )
}
