"use client"

import { useState, useEffect } from 'react'
import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell'
import { PremiumSpinner } from '@/components/ui/premium-spinner'

export default function PaymentsLedgerPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
        <>
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
            <button 
              onClick={async () => {
                const folioId = prompt('Enter Folio ID:')
                if (!folioId) return
                const currency = prompt('Enter Currency (e.g. EUR, GBP):', 'EUR')
                if (!currency) return
                const res = await fetch(`/api/folios/${folioId}/currency-convert?currency=${currency}`)
                const data = await res.json()
                if (res.ok) alert(`Converted Balance: ${data.converted.balance} ${currency}`)
                else alert(`Error: ${data.error}`)
              }}
              className="px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-all text-sm font-semibold"
            >
              Convert Folio Currency
            </button>
            <button 
              onClick={async () => {
                const folioId = prompt('Enter Original Folio ID:')
                if (!folioId) return
                const pct = prompt('Enter Percentage to Split (e.g. 50):', '50')
                if (!pct) return
                const res = await fetch(`/api/folios/${folioId}/split-percentage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ percentage: Number(pct) })
                })
                const data = await res.json()
                if (res.ok) alert(`Split successful! New Folio ID: ${data.newFolioId}`)
                else alert(`Error: ${data.error}`)
              }}
              className="px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition-all text-sm font-semibold"
            >
              Split Folio by Percentage
            </button>
            <button
              onClick={async () => {
                const invoiceId = prompt('Enter Invoice ID to Fiscal Sign:')
                if (!invoiceId) return
                const res = await fetch('/api/integrations/fiscal-printer', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ invoiceId })
                })
                const data = await res.json()
                if (res.ok) alert(`Invoice fiscally signed.\nSignature: ${data.signature}`)
                else alert(`Error: ${data.error}`)
              }}
              className="px-4 py-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-500/30 transition-all text-sm font-semibold"
            >
              Fiscal Sign Invoice
            </button>
          </div>
        </div>
        </>
      )}
    </AdminPageShell>
  )
}
