"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Plus, Users, Mail, Phone, Briefcase } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: 'FRONT_DESK',
    position: '',
    baseSalary: 0,
    hireDate: ''
  })

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/admin/hr/employees')
      if (res.ok) {
        setEmployees(await res.json())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/hr/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        toast.success("Employee added")
        setShowForm(false)
        fetchEmployees()
      } else {
        toast.error("Failed to add employee")
      }
    } catch (e) {
      toast.error("Error submitting form")
    }
  }

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8" /></div>

  return (
    <div className="p-6 text-white max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-serif">Employee Directory</h1>
          <p className="text-slate-400">Manage hotel staff records</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" /> Add Employee
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8 bg-[#1a1a1a] border-white/10 text-white">
          <CardHeader>
            <CardTitle>New Employee Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400">First Name</label>
                  <input required value={formData.firstName} onChange={e=>setFormData({...formData, firstName: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Last Name</label>
                  <input required value={formData.lastName} onChange={e=>setFormData({...formData, lastName: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Email</label>
                  <input type="email" required value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Phone</label>
                  <input value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Department</label>
                  <select required value={formData.department} onChange={e=>setFormData({...formData, department: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1">
                    <option value="FRONT_DESK">Front Desk</option>
                    <option value="KITCHEN">Kitchen</option>
                    <option value="HOUSEKEEPING">Housekeeping</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="MANAGEMENT">Management</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Position / Title</label>
                  <input required value={formData.position} onChange={e=>setFormData({...formData, position: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Base Salary (Monthly)</label>
                  <input type="number" required value={formData.baseSalary} onChange={e=>setFormData({...formData, baseSalary: parseFloat(e.target.value)})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Hire Date</label>
                  <input type="date" required value={formData.hireDate} onChange={e=>setFormData({...formData, hireDate: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">Save Employee</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map(emp => (
          <Card key={emp.id} className="bg-[#1a1a1a] border-white/10 text-white">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <Users className="text-indigo-400 w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{emp.firstName} {emp.lastName}</h3>
                  <p className="text-sm text-indigo-400 font-medium">{emp.position}</p>
                </div>
              </div>
              <div className="mt-6 space-y-2 text-sm text-slate-300">
                <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-slate-500" /> {emp.department}</div>
                <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-500" /> {emp.email}</div>
                {emp.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-500" /> {emp.phone}</div>}
              </div>
            </CardContent>
          </Card>
        ))}
        {employees.length === 0 && !loading && (
          <p className="text-slate-500 col-span-3 text-center py-12">No employees found. Add one to get started.</p>
        )}
      </div>
    </div>
  )
}
