"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Plus, DollarSign, FileText, Printer } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  const [formData, setFormData] = useState({
    periodStart: '',
    periodEnd: '',
  })

  const [pagination, setPagination] = useState<any>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [payrollRes, empRes] = await Promise.all([
        fetch('/api/admin/hr/payroll/run'),
        fetch('/api/admin/hr/employees?compact=true')
      ])
      if (payrollRes.ok) {
        const data = await payrollRes.json()
        setPayrolls(data.runs || []) // backend returns runs
      }
      if (empRes.ok) setEmployees(await empRes.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/hr/payroll/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(data.message || "Global Payroll run generated")
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
          <p className="text-slate-400">Process global salaries and itemized payslips</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" /> Execute Global Run
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8 bg-[#1a1a1a] border-white/10 text-white">
          <CardHeader>
            <CardTitle>Execute Global Payroll Run</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400">Period Start Date</label>
                  <input type="date" required value={formData.periodStart} onChange={e=>setFormData({...formData, periodStart: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Period End Date</label>
                  <input type="date" required value={formData.periodEnd} onChange={e=>setFormData({...formData, periodEnd: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                </div>
              </div>
              <div className="flex justify-end mt-6 pt-4 border-t border-white/10">
                <div className="flex gap-2">
                    <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                    <Button type="submit">Execute Run</Button>
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
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {payrolls.map((run: any) => (
              <tr key={run.id} className="hover:bg-white/5">
                <td className="p-4 font-medium flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                      <div>Run #{run.id.substring(0, 8)}</div>
                      <div className="text-xs text-slate-500">{run.lineItems?.length || 0} Employees Paid</div>
                  </div>
                </td>
                <td className="p-4 text-slate-300">
                    {new Date(run.periodStart).toLocaleDateString()} - {new Date(run.periodEnd).toLocaleDateString()}
                </td>
                <td className="p-4 text-right">—</td>
                <td className="p-4 text-right">—</td>
                <td className="p-4 text-right">—</td>
                <td className="p-4 text-right font-bold text-emerald-400">${Number(run.totalAmount).toFixed(2)}</td>
                <td className="p-4 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${run.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {run.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <Button variant="ghost" size="sm" onClick={() => window.open(`/admin/hr/payroll/run/${run.id}/print`, '_blank')} title="Print Manifest">
                    <Printer className="w-4 h-4" />
                  </Button>
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
