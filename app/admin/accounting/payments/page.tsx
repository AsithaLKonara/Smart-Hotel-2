"use client"

import { useState, useEffect } from 'react'
import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import * as Dialog from '@radix-ui/react-dialog'
import { X, RefreshCw, DollarSign, SplitSquareVertical, FileCheck } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PaymentsLedgerPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Modal state
  const [convertModal, setConvertModal] = useState(false)
  const [convertForm, setConvertForm] = useState({ folioId: '', currency: 'EUR' })
  const [convertResult, setConvertResult] = useState<string | null>(null)

  const [splitModal, setSplitModal] = useState(false)
  const [splitForm, setSplitForm] = useState({ folioId: '', percentage: '50' })

  const [fiscalModal, setFiscalModal] = useState(false)
  const [fiscalForm, setFiscalForm] = useState({ invoiceId: '' })
  const [fiscalResult, setFiscalResult] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchPayments = async () => {
    try {
      const res = await fetch('/api/payments')
      if (res.ok) {
        setPayments(await res.json())
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [])

  return (
    <AdminPageShell title="Payments Ledger" subtitle="View all transactions across the property." onRefresh={fetchPayments}>
      {loading ? (
        <div className="py-20 flex justify-center"><PremiumSpinner /></div>
      ) : (
        <div className="space-y-8">
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm text-white">
            <thead className="bg-white/5 text-white/50 text-xs uppercase">
              <tr>
                <th className="p-4">Transaction ID</th>
                <th className="p-4">Date</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Method</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-white/5">
                  <td className="p-4 font-mono text-xs">{p.id}</td>
                  <td className="p-4">{new Date(p.createdAt).toLocaleString()}</td>
                  <td className="p-4 font-semibold">${p.amount.toFixed(2)}</td>
                  <td className="p-4 uppercase text-white/70">{p.paymentMethod}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs ${p.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-white/40">No payments found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-8 bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Advanced Folio Tools</h2>
          <div className="flex gap-4 flex-wrap">
            <button onClick={() => { setConvertResult(null); setConvertModal(true) }}
              className="px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-all text-sm font-semibold">
              Convert Folio Currency
            </button>
            <button onClick={() => setSplitModal(true)}
              className="px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition-all text-sm font-semibold">
              Split Folio by Percentage
            </button>
            <button onClick={() => { setFiscalResult(null); setFiscalModal(true) }}
              className="px-4 py-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-500/30 transition-all text-sm font-semibold">
              Fiscal Sign Invoice
            </button>
          </div>
        </div>
        </div>
      )}

      {/* Currency Convert Modal */}
      <Dialog.Root open={convertModal} onOpenChange={(o) => !o && setConvertModal(false)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl p-6 z-50">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Convert Folio Currency</h2>
              <button onClick={() => setConvertModal(false)} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            {convertResult ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-4 text-emerald-400 text-center text-sm font-bold">{convertResult}</div>
            ) : null}
            <form onSubmit={async (e) => {
              e.preventDefault(); setSubmitting(true)
              try {
                const res = await fetch(`/api/folios/${convertForm.folioId}/currency-convert?currency=${convertForm.currency}`)
                const data = await res.json()
                if (res.ok) setConvertResult(`Converted Balance: ${data.converted?.balance} ${convertForm.currency}`)
                else toast.error(data.error || 'Conversion failed')
              } finally { setSubmitting(false) }
            }} className="space-y-4">
              <div>
                <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-2 block">Folio ID</label>
                <Input required value={convertForm.folioId} onChange={e => setConvertForm({ ...convertForm, folioId: e.target.value })} className="bg-[#1a1a24] border-white/10 text-white font-mono text-sm" placeholder="UUID of the folio" />
              </div>
              <div>
                <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-2 block">Target Currency</label>
                <select value={convertForm.currency} onChange={e => setConvertForm({ ...convertForm, currency: e.target.value })} className="w-full bg-[#1a1a24] border border-white/10 rounded-lg p-2.5 text-sm text-white">
                  {['EUR','GBP','JPY','AUD','CAD','CHF','CNY','INR'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <Button type="button" variant="ghost" onClick={() => setConvertModal(false)}>Close</Button>
                <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-500 text-white">{submitting ? 'Converting...' : 'Convert'}</Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Split Folio Modal */}
      <Dialog.Root open={splitModal} onOpenChange={(o) => !o && setSplitModal(false)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl p-6 z-50">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Split Folio by Percentage</h2>
              <button onClick={() => setSplitModal(false)} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault(); setSubmitting(true)
              try {
                const res = await fetch(`/api/folios/${splitForm.folioId}/split-percentage`, {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ percentage: Number(splitForm.percentage) })
                })
                const data = await res.json()
                if (res.ok) { toast.success(`Split successful! New Folio: ${data.newFolioId}`); setSplitModal(false) }
                else toast.error(data.error || 'Split failed')
              } finally { setSubmitting(false) }
            }} className="space-y-4">
              <div>
                <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-2 block">Original Folio ID</label>
                <Input required value={splitForm.folioId} onChange={e => setSplitForm({ ...splitForm, folioId: e.target.value })} className="bg-[#1a1a24] border-white/10 text-white font-mono text-sm" placeholder="UUID of the original folio" />
              </div>
              <div>
                <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-2 block">Split Percentage (%)</label>
                <Input type="number" min="1" max="99" required value={splitForm.percentage} onChange={e => setSplitForm({ ...splitForm, percentage: e.target.value })} className="bg-[#1a1a24] border-white/10 text-white" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <Button type="button" variant="ghost" onClick={() => setSplitModal(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting} className="bg-purple-600 hover:bg-purple-500 text-white">{submitting ? 'Splitting...' : 'Split Folio'}</Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Fiscal Sign Modal */}
      <Dialog.Root open={fiscalModal} onOpenChange={(o) => !o && setFiscalModal(false)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl p-6 z-50">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Fiscal Sign Invoice</h2>
              <button onClick={() => setFiscalModal(false)} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            {fiscalResult ? (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-4 text-amber-400 text-xs font-mono break-all">{fiscalResult}</div>
            ) : null}
            <form onSubmit={async (e) => {
              e.preventDefault(); setSubmitting(true)
              try {
                const res = await fetch('/api/integrations/fiscal-printer', {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ invoiceId: fiscalForm.invoiceId })
                })
                const data = await res.json()
                if (res.ok) setFiscalResult(`Invoice signed. Signature: ${data.signature}`)
                else toast.error(data.error || 'Signing failed')
              } finally { setSubmitting(false) }
            }} className="space-y-4">
              <div>
                <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-2 block">Invoice ID</label>
                <Input required value={fiscalForm.invoiceId} onChange={e => setFiscalForm({ invoiceId: e.target.value })} className="bg-[#1a1a24] border-white/10 text-white font-mono text-sm" placeholder="Invoice UUID" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <Button type="button" variant="ghost" onClick={() => setFiscalModal(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting} className="bg-amber-600 hover:bg-amber-500 text-white">{submitting ? 'Signing...' : 'Fiscal Sign'}</Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </AdminPageShell>
  )
}
