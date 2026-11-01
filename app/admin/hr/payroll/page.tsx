"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Plus, DollarSign, FileText, Printer } from 'lucide-react'
import toast from 'react-hot-toast'
import { PayrollPrintModal } from '@/components/hr/payroll-print-modal'

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [printRunId, setPrintRunId] = useState<string | null>(null)
  
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
        fetch('/api/admin/hr/payroll/run', { cache: 'no-store' }),
        fetch('/api/admin/hr/employees?compact=true', { cache: 'no-store' })
      ])
      if (payrollRes.ok) {
        const data = await payrollRes.json()
        setPayrolls(data.data || data.runs || []) // backend returns runs in data array
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
    <div className="p-6 text-foreground dark:text-white max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-serif text-foreground dark:text-white">Payroll Center</h1>
          <p className="text-muted-foreground dark:text-slate-400">Process global salaries and itemized payslips</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Execute Global Run
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8 bg-card dark:bg-[#1a1a1a] border border-border dark:border-white/10 text-foreground dark:text-white shadow-md">
          <CardHeader>
            <CardTitle className="text-foreground dark:text-white">Execute Global Payroll Run</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground dark:text-slate-400">Period Start Date</label>
                  <input type="date" required value={formData.periodStart} onChange={e=>setFormData({...formData, periodStart: e.target.value})} className="w-full p-2 rounded bg-background dark:bg-black/50 border border-input dark:border-white/10 text-foreground dark:text-white mt-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground dark:text-slate-400">Period End Date</label>
                  <input type="date" required value={formData.periodEnd} onChange={e=>setFormData({...formData, periodEnd: e.target.value})} className="w-full p-2 rounded bg-background dark:bg-black/50 border border-input dark:border-white/10 text-foreground dark:text-white mt-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>
              <div className="flex justify-end mt-6 pt-4 border-t border-border dark:border-white/10">
                <div className="flex gap-2">
                    <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                    <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-sm">Execute Run</Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="bg-card dark:bg-[#1a1a1a] border border-border dark:border-white/10 rounded-xl overflow-hidden shadow-md">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/60 dark:bg-white/5 border-b border-border dark:border-white/10">
            <tr>
              <th className="p-4 font-medium text-foreground dark:text-white">Employee</th>
              <th className="p-4 font-medium text-muted-foreground dark:text-slate-400">Period</th>
              <th className="p-4 font-medium text-muted-foreground dark:text-slate-400 text-right">Base</th>
              <th className="p-4 font-medium text-muted-foreground dark:text-slate-400 text-right">Additions</th>
              <th className="p-4 font-medium text-muted-foreground dark:text-slate-400 text-right">Deductions</th>
              <th className="p-4 font-medium text-emerald-600 dark:text-emerald-400 text-right">Net Pay</th>
              <th className="p-4 font-medium text-center text-foreground dark:text-white">Status</th>
              <th className="p-4 font-medium text-right text-foreground dark:text-white">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border dark:divide-white/5">
            {payrolls.map((run: any) => (
              <tr key={run.id} className="hover:bg-muted/30 dark:hover:bg-white/5">
                <td className="p-4 font-medium flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                      <div className="text-foreground dark:text-white font-semibold">Run #{run.id.substring(0, 8)}</div>
                      <div className="text-xs text-muted-foreground dark:text-slate-500">{run.lineItems?.length || 0} Employees Paid</div>
                  </div>
                </td>
                <td className="p-4 text-foreground/80 dark:text-slate-300">
                    {new Date(run.periodStart).toLocaleDateString()} - {new Date(run.periodEnd).toLocaleDateString()}
                </td>
                <td className="p-4 text-right text-muted-foreground">—</td>
                <td className="p-4 text-right text-muted-foreground">—</td>
                <td className="p-4 text-right text-muted-foreground">—</td>
                <td className="p-4 text-right font-bold text-emerald-600 dark:text-emerald-400">${Number(run.totalAmount).toFixed(2)}</td>
                <td className="p-4 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${run.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'}`}>
                      {run.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <Button variant="ghost" size="sm" onClick={() => setPrintRunId(run.id)} title="Print Manifest" className="text-muted-foreground hover:text-foreground">
                    <Printer className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {payrolls.length === 0 && !loading && (
          <div className="p-12 text-center text-muted-foreground dark:text-slate-500">No payroll records found.</div>
        )}
      </div>

      <PayrollPrintModal 
        runId={printRunId} 
        open={!!printRunId} 
        onOpenChange={(open) => !open && setPrintRunId(null)} 
      />
    </div>
  )
}
