"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Plus, DollarSign, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  const [formData, setFormData] = useState({
    employeeId: '',
    periodStart: '',
    periodEnd: '',
    baseAmount: 0,
    overtimeAmount: 0,
    bonuses: 0,
    deductions: 0
  })

  const [pagination, setPagination] = useState<any>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [payrollRes, empRes] = await Promise.all([
        fetch('/api/admin/hr/payroll'),
        fetch('/api/admin/hr/employees?compact=true')
      ])
      if (payrollRes.ok) {
        const data = await payrollRes.json()
        setPayrolls(data.payrolls || [])
        setPagination(data.pagination)
      }
      if (empRes.ok) setEmployees(await empRes.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleEmployeeSelect = (empId: string) => {
      const emp = employees.find(e => e.id === empId)
      setFormData({
          ...formData,
          employeeId: empId,
          baseAmount: emp ? emp.baseSalary : 0
      })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/hr/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        toast.success("Payroll record generated")
        setShowForm(false)
        fetchData()
      } else {
        toast.error("Failed to generate payroll")
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
          <h1 className="text-3xl font-bold font-serif">Payroll Center</h1>
          <p className="text-slate-400">Process salaries and payslips</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" /> Generate Payslip
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8 bg-[#1a1a1a] border-white/10 text-white">
          <CardHeader>
            <CardTitle>Generate New Payslip</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs text-slate-400">Employee</label>
                  <select required value={formData.employeeId} onChange={e=>handleEmployeeSelect(e.target.value)} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1">
                    <option value="">Select Employee...</option>
                    {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} - {emp.department} (${emp.baseSalary}/mo)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Period Start Date</label>
                  <input type="date" required value={formData.periodStart} onChange={e=>setFormData({...formData, periodStart: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Period End Date</label>
                  <input type="date" required value={formData.periodEnd} onChange={e=>setFormData({...formData, periodEnd: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                </div>
                
                <div className="col-span-2 border-t border-white/10 my-2 pt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <label className="text-xs text-slate-400">Base Amount ($)</label>
                        <input type="number" required value={formData.baseAmount} onChange={e=>setFormData({...formData, baseAmount: parseFloat(e.target.value)})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                    </div>
                    <div>
                        <label className="text-xs text-emerald-400">Overtime ($)</label>
                        <input type="number" value={formData.overtimeAmount} onChange={e=>setFormData({...formData, overtimeAmount: parseFloat(e.target.value)})} className="w-full p-2 rounded bg-black/50 border border-emerald-500/30 mt-1 text-emerald-400" />
                    </div>
                    <div>
                        <label className="text-xs text-emerald-400">Bonuses ($)</label>
                        <input type="number" value={formData.bonuses} onChange={e=>setFormData({...formData, bonuses: parseFloat(e.target.value)})} className="w-full p-2 rounded bg-black/50 border border-emerald-500/30 mt-1 text-emerald-400" />
                    </div>
                    <div>
                        <label className="text-xs text-rose-400">Deductions/Tax ($)</label>
                        <input type="number" value={formData.deductions} onChange={e=>setFormData({...formData, deductions: parseFloat(e.target.value)})} className="w-full p-2 rounded bg-black/50 border border-rose-500/30 mt-1 text-rose-400" />
                    </div>
                </div>
              </div>
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/10">
                <div className="text-xl font-bold">
                    Net Pay: <span className="text-emerald-400">${(formData.baseAmount + formData.overtimeAmount + formData.bonuses - formData.deductions).toFixed(2)}</span>
                </div>
                <div className="flex gap-2">
                    <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                    <Button type="submit">Generate Payslip</Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="p-4 font-medium">Employee</th>
              <th className="p-4 font-medium text-slate-400">Period</th>
              <th className="p-4 font-medium text-slate-400 text-right">Base</th>
              <th className="p-4 font-medium text-slate-400 text-right">Additions</th>
              <th className="p-4 font-medium text-slate-400 text-right">Deductions</th>
              <th className="p-4 font-medium text-emerald-400 text-right">Net Pay</th>
              <th className="p-4 font-medium text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {payrolls.map(pay => (
              <tr key={pay.id} className="hover:bg-white/5">
                <td className="p-4 font-medium flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                      <div>{pay.employee?.firstName} {pay.employee?.lastName}</div>
                      <div className="text-xs text-slate-500">{pay.employee?.department}</div>
                  </div>
                </td>
                <td className="p-4 text-slate-300">
                    {new Date(pay.periodStart).toLocaleDateString()} - {new Date(pay.periodEnd).toLocaleDateString()}
                </td>
                <td className="p-4 text-right">${pay.baseAmount.toFixed(2)}</td>
                <td className="p-4 text-right text-emerald-400">+${(pay.overtimeAmount + pay.bonuses).toFixed(2)}</td>
                <td className="p-4 text-right text-rose-400">-${pay.deductions.toFixed(2)}</td>
                <td className="p-4 text-right font-bold text-emerald-400">${pay.netPay.toFixed(2)}</td>
                <td className="p-4 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${pay.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {pay.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {payrolls.length === 0 && !loading && (
          <div className="p-12 text-center text-slate-500">No payroll records found.</div>
        )}
      </div>
    </div>
  )
}
