"use client"

import { useState, useEffect } from 'react'
import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, MoreVertical, Check, CreditCard, ChevronDown, SplitSquareVertical, Receipt } from 'lucide-react'
import toast from 'react-hot-toast'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

export default function FoliosManagementPage() {
  const [folios, setFolios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedFolio, setExpandedFolio] = useState<string | null>(null)

  const fetchFolios = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/accounting/folios')
      if (res.ok) {
        const data = await res.json()
        setFolios(data.folios)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFolios()
  }, [])

  const handleCurrencyConvert = async (folioId: string) => {
    const currency = prompt('Enter Currency (e.g. EUR, GBP):', 'EUR')
    if (!currency) return
    const res = await fetch(`/api/folios/${folioId}/currency-convert?currency=${currency}`)
    const data = await res.json()
    if (res.ok) toast.success(`Converted Balance: ${data.converted.balance} ${currency}`)
    else toast.error(`Error: ${data.error}`)
  }

  const handleSplitFolio = async (folioId: string) => {
    const pct = prompt('Enter Percentage to Split (e.g. 50):', '50')
    if (!pct) return
    const res = await fetch(`/api/folios/${folioId}/split-percentage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ percentage: Number(pct) })
    })
    const data = await res.json()
    if (res.ok) {
      toast.success(`Split successful! New Folio ID: ${data.newFolioId}`)
      fetchFolios()
    }
    else toast.error(`Error: ${data.error}`)
  }

  const handleFiscalSign = async (folioId: string) => {
    const res = await fetch('/api/integrations/fiscal-printer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId: folioId })
    })
    const data = await res.json()
    if (res.ok) toast.success(`Folio fiscally signed.\nSignature: ${data.signature}`)
    else toast.error(`Error: ${data.error}`)
  }

  return (
    <AdminPageShell title="Folios & Billing" subtitle="Manage guest accounts, process payments, and audit transactions." onRefresh={fetchFolios}>
      {loading ? (
        <div className="py-20 flex justify-center"><PremiumSpinner /></div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
             <Card className="bg-white/5 border-white/10">
               <CardContent className="p-6 flex items-center gap-4">
                 <div className="p-3 bg-blue-500/20 rounded-xl"><FileText className="text-blue-400 w-6 h-6" /></div>
                 <div>
                   <p className="text-sm text-white/50">Total Open Folios</p>
                   <p className="text-2xl font-bold text-white">{folios.filter(f => f.status === 'OPEN').length}</p>
                 </div>
               </CardContent>
             </Card>
             <Card className="bg-white/5 border-white/10">
               <CardContent className="p-6 flex items-center gap-4">
                 <div className="p-3 bg-emerald-500/20 rounded-xl"><Check className="text-emerald-400 w-6 h-6" /></div>
                 <div>
                   <p className="text-sm text-white/50">Settled Folios</p>
                   <p className="text-2xl font-bold text-white">{folios.filter(f => f.status === 'PAID').length}</p>
                 </div>
               </CardContent>
             </Card>
             <Card className="bg-white/5 border-white/10">
               <CardContent className="p-6 flex items-center gap-4">
                 <div className="p-3 bg-amber-500/20 rounded-xl"><CreditCard className="text-amber-400 w-6 h-6" /></div>
                 <div>
                   <p className="text-sm text-white/50">Total Outstanding Balance</p>
                   <p className="text-2xl font-bold text-white">
                     ${folios.reduce((sum, f) => {
                       if (f.status === 'PAID') return sum;
                       const total = (f.lineItems || []).reduce((a: number, b: any) => a + b.amount, 0);
                       const paid = (f.payments || []).reduce((a: number, b: any) => a + b.amount, 0);
                       return sum + Math.max(0, total - paid);
                     }, 0).toFixed(2)}
                   </p>
                 </div>
               </CardContent>
             </Card>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm text-white">
              <thead className="bg-white/5 text-white/50 text-xs uppercase">
                <tr>
                  <th className="p-4">Folio ID</th>
                  <th className="p-4">Guest / Room</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Balance</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {folios.map(folio => {
                  const total = (folio.lineItems || []).reduce((a: number, b: any) => a + b.amount, 0);
                  const paid = (folio.payments || []).reduce((a: number, b: any) => a + b.amount, 0);
                  const balance = Math.max(0, total - paid);
                  const roomAssignment = folio.booking?.roomAssignments?.[0];
                  
                  return (
                    <tr key={folio.id} className="hover:bg-white/5">
                      <td className="p-4 font-mono text-xs">{folio.id.substring(0, 8).toUpperCase()}</td>
                      <td className="p-4">
                        <p className="font-semibold">{folio.booking?.guest?.name || 'Walk-in'}</p>
                        <p className="text-xs text-white/50">{roomAssignment ? `Room ${roomAssignment.room.number}` : 'N/A'}</p>
                      </td>
                      <td className="p-4 uppercase text-white/70">{folio.type}</td>
                      <td className="p-4">${total.toFixed(2)}</td>
                      <td className="p-4 font-semibold text-primary">${balance.toFixed(2)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${folio.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          {folio.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu.Root>
                          <DropdownMenu.Trigger asChild>
                            <button className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </DropdownMenu.Trigger>
                          <DropdownMenu.Portal>
                            <DropdownMenu.Content className="min-w-[180px] bg-[#1a1a1a] border border-white/10 rounded-xl p-1 shadow-xl text-sm text-white/90 z-50">
                              <DropdownMenu.Item onClick={() => setExpandedFolio(expandedFolio === folio.id ? null : folio.id)} className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg cursor-pointer outline-none">
                                <FileText className="w-4 h-4" /> View Line Items
                              </DropdownMenu.Item>
                              {folio.status !== 'PAID' && (
                                <DropdownMenu.Item onClick={() => handleSplitFolio(folio.id)} className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg cursor-pointer outline-none">
                                  <SplitSquareVertical className="w-4 h-4" /> Split Folio
                                </DropdownMenu.Item>
                              )}
                              <DropdownMenu.Item onClick={() => handleCurrencyConvert(folio.id)} className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg cursor-pointer outline-none">
                                <Receipt className="w-4 h-4" /> Currency Convert
                              </DropdownMenu.Item>
                              <DropdownMenu.Item onClick={() => handleFiscalSign(folio.id)} className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg cursor-pointer outline-none text-amber-400">
                                <Check className="w-4 h-4" /> Fiscal Sign
                              </DropdownMenu.Item>
                            </DropdownMenu.Content>
                          </DropdownMenu.Portal>
                        </DropdownMenu.Root>
                      </td>
                    </tr>
                  )
                })}
                {folios.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-white/40">No folios found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {expandedFolio && (
             <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-white">Folio Line Items ({expandedFolio.substring(0,8).toUpperCase()})</h3>
                  <button onClick={() => setExpandedFolio(null)} className="text-sm text-white/50 hover:text-white">Close</button>
                </div>
                <div className="space-y-4">
                   {folios.find(f => f.id === expandedFolio)?.lineItems?.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center border-b border-white/5 pb-2">
                        <div>
                           <p className="text-white/90">{item.description}</p>
                           <p className="text-xs text-white/50">{new Date(item.createdAt).toLocaleString()}</p>
                        </div>
                        <p className="font-semibold text-white">${item.amount.toFixed(2)}</p>
                      </div>
                   ))}
                   {(!folios.find(f => f.id === expandedFolio)?.lineItems?.length) && (
                      <p className="text-white/40 text-sm">No line items recorded yet.</p>
                   )}
                </div>
             </div>
          )}
        </div>
      )}
    </AdminPageShell>
  )
}
