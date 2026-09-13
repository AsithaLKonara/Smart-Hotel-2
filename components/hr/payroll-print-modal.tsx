"use client"

import { useState, useEffect, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { Loader2, Printer } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface PayrollPrintModalProps {
  runId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function PayrollManifestTemplate({ run }: { run: any }) {
  if (!run) return null;
  return (
    <div id="printable-manifest" className="w-full">
      {/* Document Header */}
      <div className="flex justify-between items-end border-b-2 border-black pb-6 mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight uppercase">SmartHotel</h1>
          <p className="text-sm font-bold uppercase tracking-widest text-slate-500 mt-1">Experience Elite</p>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold uppercase tracking-wider text-slate-800">Payroll Master Manifest</h2>
          <p className="text-sm text-slate-600 mt-1 font-medium">Run ID: <span className="text-black">{run.id.split('-')[0].toUpperCase()}</span></p>
        </div>
      </div>

      {/* Run Details Grid */}
      <div className="grid grid-cols-3 gap-8 mb-12 bg-slate-50 p-6 rounded-xl border border-slate-200 print:border-black">
        <div>
          <div className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-1">Period Start</div>
          <div className="text-lg font-medium">{new Date(run.periodStart).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</div>
        </div>
        <div>
          <div className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-1">Period End</div>
          <div className="text-lg font-medium">{new Date(run.periodEnd).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</div>
        </div>
        <div>
          <div className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-1">Total Disbursed</div>
          <div className="text-xl font-bold text-black">${Number(run.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
      </div>

      {/* Itemized Table */}
      <div className="mb-12">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b-2 border-black bg-slate-50">
              <th className="py-3 px-4 font-bold text-slate-800 uppercase tracking-wider text-xs">Employee</th>
              <th className="py-3 px-4 font-bold text-slate-800 uppercase tracking-wider text-xs">Role</th>
              <th className="py-3 px-4 font-bold text-slate-800 uppercase tracking-wider text-xs text-right">Base Pay</th>
              <th className="py-3 px-4 font-bold text-slate-800 uppercase tracking-wider text-xs text-right">Overtime</th>
              <th className="py-3 px-4 font-bold text-slate-800 uppercase tracking-wider text-xs text-right">Deductions</th>
              <th className="py-3 px-4 font-bold text-black uppercase tracking-wider text-xs text-right">Net Pay</th>
              <th className="py-3 px-4 font-bold text-slate-800 uppercase tracking-wider text-xs text-center w-32">Signature</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 print:divide-black/20">
            {run.lineItems?.map((item: any, idx: number) => (
              <tr key={item.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                <td className="py-4 px-4">
                  <div className="font-bold text-black">{item.employee.firstName} {item.employee.lastName}</div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">{item.employee.id.substring(0, 8)}</div>
                </td>
                <td className="py-4 px-4 text-slate-600 font-medium capitalize">
                  {item.employee.department?.replace('_', ' ').toLowerCase() || '-'}
                </td>
                <td className="py-4 px-4 text-right text-slate-700">${Number(item.basePay).toFixed(2)}</td>
                <td className="py-4 px-4 text-right text-slate-700">${Number(item.overtimePay).toFixed(2)}</td>
                <td className="py-4 px-4 text-right text-slate-700">-${Number(item.deductions).toFixed(2)}</td>
                <td className="py-4 px-4 text-right font-bold text-black">${Number(item.netPay).toFixed(2)}</td>
                <td className="py-4 px-4 text-center">
                  <div className="border-b border-slate-300 mx-2 mt-4"></div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-black bg-slate-50">
              <td colSpan={5} className="py-4 px-4 text-right font-bold uppercase tracking-wider text-sm">Grand Total</td>
              <td className="py-4 px-4 text-right font-bold text-lg text-black">
                ${Number(run.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Footer / Auth Signatures */}
      <div className="grid grid-cols-2 gap-16 mt-20 pt-8 border-t border-slate-200 print:border-black">
        <div>
          <div className="border-t border-black pt-2 text-sm font-bold uppercase tracking-wider text-slate-600">Prepared By (HR Manager)</div>
          <div className="mt-8 text-xs text-slate-400">Date: ________________________</div>
        </div>
        <div>
          <div className="border-t border-black pt-2 text-sm font-bold uppercase tracking-wider text-slate-600">Approved By (Director/Finance)</div>
          <div className="mt-8 text-xs text-slate-400">Date: ________________________</div>
        </div>
      </div>

      {/* Print watermark/footer */}
      <div className="mt-16 text-center text-xs text-slate-400 font-mono">
        Generated by SmartHotel Core Engine on {new Date().toLocaleString()}
      </div>
    </div>
  )
}

export function PayrollPrintModal({ runId, open, onOpenChange }: PayrollPrintModalProps) {
  const [run, setRun] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Payroll_Manifest_${run?.id?.split('-')[0]}`,
  })

  useEffect(() => {
    if (open && runId) {
      setLoading(true)
      setError('')
      fetch(`/api/admin/hr/payroll/run/${runId}`, { cache: 'no-store' })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch payroll run')
          return res.json()
        })
        .then(result => setRun(result.data))
        .catch(e => setError(e.message))
        .finally(() => setLoading(false))
    } else {
      setRun(null)
    }
  }, [runId, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white text-black p-0 print:border-none print:shadow-none print:max-w-none print:max-h-none print:h-auto print:p-0 print:m-0 print:overflow-visible">
        {/* Hide header and controls when actually printing */}
        <div className="print:hidden sticky top-0 z-10 flex justify-between items-center p-6 bg-slate-100 border-b border-slate-200">
          <DialogTitle className="text-xl font-bold">Payroll Manifest Preview</DialogTitle>
          <Button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors"
            disabled={loading || !!error || !run}
          >
            <Printer className="w-4 h-4" /> Print Manifest
          </Button>
        </div>

        <div className="p-10 font-sans">
          {loading && (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="animate-spin w-8 h-8 text-black" />
            </div>
          )}

          {error && (
            <div className="flex justify-center items-center h-64 text-xl font-bold text-red-500">
              Error: {error}
            </div>
          )}

          {!loading && !error && run && (
            <div ref={printRef} className="print-section w-full bg-white text-black">
              <PayrollManifestTemplate run={run} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
