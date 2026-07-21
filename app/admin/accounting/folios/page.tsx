"use client"

import { useState, useEffect } from 'react'
import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { FileText, MoreVertical, Check, CreditCard, ChevronDown, SplitSquareVertical, Receipt, Sparkles, X, ShoppingCart } from 'lucide-react'
import toast from 'react-hot-toast'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

export default function FoliosManagementPage() {
  const [folios, setFolios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedFolio, setExpandedFolio] = useState<string | null>(null)

  // Action Modals State
  const [activeModal, setActiveModal] = useState<'SPLIT' | 'CONVERT' | 'FISCAL' | null>(null)
  const [selectedFolio, setSelectedFolio] = useState<any | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Split Form
  const [splitPercentage, setSplitPercentage] = useState<string>('50')

  // Convert Form
  const [targetCurrency, setTargetCurrency] = useState<string>('EUR')
  const [conversionResult, setConversionResult] = useState<any | null>(null)

  // Fiscal Form
  const [fiscalResult, setFiscalResult] = useState<any | null>(null)

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

  const submitSplitFolio = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFolio) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/folios/${selectedFolio.id}/split-percentage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ percentage: Number(splitPercentage) })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Folio split by ${splitPercentage}%! New Folio ID: ${data.newFolioId?.substring(0, 8).toUpperCase()}`)
        setActiveModal(null)
        fetchFolios()
      } else {
        toast.error(data.error || 'Failed to split folio')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error splitting folio')
    } finally {
      setActionLoading(false)
    }
  }

  const submitCurrencyConvert = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFolio) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/folios/${selectedFolio.id}/currency-convert?currency=${targetCurrency}`)
      const data = await res.json()
      if (res.ok) {
        setConversionResult(data.converted)
        toast.success(`Converted balance to ${targetCurrency}`)
      } else {
        toast.error(data.error || 'Conversion failed')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error converting currency')
    } finally {
      setActionLoading(false)
    }
  }

  const submitFiscalSign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFolio) return
    setActionLoading(true)
    try {
      const res = await fetch('/api/integrations/fiscal-printer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folioId: selectedFolio.id })
      })
      const data = await res.json()
      if (res.ok) {
        setFiscalResult(data)
        toast.success(`Folio fiscally signed!`)
      } else {
        toast.error(data.error || 'Failed to sign folio')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error executing fiscal sign')
    } finally {
      setActionLoading(false)
    }
  }

  const selectedFolioForDrawer = folios.find(f => f.id === expandedFolio)

  return (
    <AdminPageShell 
      title="Folios & Billing" 
      subtitle="Manage guest accounts, process payments, and audit transactions." 
      onRefresh={fetchFolios}
      actions={
        <Link href="/admin/pos">
          <Button className="bg-primary hover:bg-primary/90 text-white font-bold gap-2 text-xs">
            <ShoppingCart className="w-4 h-4" /> Open POS & Billing Terminal
          </Button>
        </Link>
      }
    >
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
                       const total = (f.lineItems || []).reduce((a: number, b: any) => a + Number(b.amount || 0), 0);
                       const paid = (f.payments || []).reduce((a: number, b: any) => a + Number(b.amount || 0), 0);
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
                  const total = (folio.lineItems || []).reduce((a: number, b: any) => a + Number(b.amount || 0), 0);
                  const paid = (folio.payments || []).reduce((a: number, b: any) => a + Number(b.amount || 0), 0);
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
                                <DropdownMenu.Item onClick={() => {
                                  setSelectedFolio(folio)
                                  setSplitPercentage('50')
                                  setActiveModal('SPLIT')
                                }} className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg cursor-pointer outline-none">
                                  <SplitSquareVertical className="w-4 h-4" /> Split Folio
                                </DropdownMenu.Item>
                              )}
                              <DropdownMenu.Item onClick={() => {
                                setSelectedFolio(folio)
                                setTargetCurrency('EUR')
                                setConversionResult(null)
                                setActiveModal('CONVERT')
                              }} className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg cursor-pointer outline-none">
                                <Receipt className="w-4 h-4" /> Currency Convert
                              </DropdownMenu.Item>
                              <DropdownMenu.Item onClick={() => {
                                setSelectedFolio(folio)
                                setFiscalResult(null)
                                setActiveModal('FISCAL')
                              }} className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg cursor-pointer outline-none text-amber-400">
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
        </div>
      )}

      {/* Right Side Panel Drawer for Folio Line Items */}
      {expandedFolio && selectedFolioForDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setExpandedFolio(null)}
          />

          {/* Drawer Container */}
          <div className="relative w-full max-w-lg bg-[#111116] border-l border-white/10 shadow-2xl flex flex-col h-full z-50 text-white animate-in slide-in-from-right duration-300 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-start bg-black/30">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-white">Folio Statement</h2>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${selectedFolioForDrawer.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                    {selectedFolioForDrawer.status}
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-400">ID: {selectedFolioForDrawer.id}</p>
                <div className="mt-2 text-xs text-slate-300 flex items-center gap-4">
                  <span>Guest: <strong className="text-white">{selectedFolioForDrawer.booking?.guest?.name || 'Walk-in'}</strong></span>
                  <span>Room: <strong className="text-white">{selectedFolioForDrawer.booking?.roomAssignments?.[0]?.room?.number || 'N/A'}</strong></span>
                </div>
              </div>
              <button 
                onClick={() => setExpandedFolio(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Financial Totals Card */}
            <div className="p-6 bg-white/5 border-b border-white/10 grid grid-cols-3 gap-3 text-center">
              <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Charges</p>
                <p className="text-sm font-bold text-white mt-1">
                  ${(selectedFolioForDrawer.lineItems || []).reduce((a: number, b: any) => a + Number(b.amount || 0), 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Payments</p>
                <p className="text-sm font-bold text-emerald-400 mt-1">
                  ${(selectedFolioForDrawer.payments || []).reduce((a: number, b: any) => a + Number(b.amount || 0), 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                <p className="text-[10px] uppercase font-bold text-slate-400">Current Balance</p>
                <p className="text-sm font-bold text-amber-400 mt-1">
                  ${Math.max(0, (selectedFolioForDrawer.lineItems || []).reduce((a: number, b: any) => a + Number(b.amount || 0), 0) - (selectedFolioForDrawer.payments || []).reduce((a: number, b: any) => a + Number(b.amount || 0), 0)).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Scrollable Line Items Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Line Items List */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" /> Itemized Charges
                </h3>
                <div className="space-y-3">
                  {selectedFolioForDrawer.lineItems?.length === 0 ? (
                    <div className="p-6 text-center border border-dashed border-white/10 rounded-xl text-slate-500 text-sm">
                      No line items recorded for this folio.
                    </div>
                  ) : (
                    selectedFolioForDrawer.lineItems?.map((item: any) => (
                      <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center hover:border-white/20 transition-all">
                        <div className="space-y-1">
                          <p className="font-semibold text-sm text-white">{item.description}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-300 uppercase font-bold">
                              {item.category || 'CHARGE'}
                            </span>
                            <span className="text-xs text-slate-400">
                              {new Date(item.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>
                        </div>
                        <div className={`font-mono font-bold text-sm ${Number(item.amount) < 0 ? 'text-emerald-400' : 'text-white'}`}>
                          {Number(item.amount) < 0 ? '-' : ''}${Math.abs(Number(item.amount || 0)).toFixed(2)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Payments History Section */}
              {selectedFolioForDrawer.payments?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-400" /> Recorded Payments
                  </h3>
                  <div className="space-y-3">
                    {selectedFolioForDrawer.payments.map((p: any) => (
                      <div key={p.id} className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-sm text-emerald-300">Payment ({p.paymentMethod || 'CARD'})</p>
                          <p className="text-xs text-slate-400">{new Date(p.createdAt).toLocaleString()}</p>
                        </div>
                        <p className="font-mono font-bold text-sm text-emerald-400">-${Number(p.amount || 0).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions Footer */}
            <div className="p-4 border-t border-white/10 bg-black/40 grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedFolio(selectedFolioForDrawer)
                  setSplitPercentage('50')
                  setActiveModal('SPLIT')
                }}
                className="bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20 text-xs font-bold"
              >
                <SplitSquareVertical className="w-3.5 h-3.5 mr-1" /> Split
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedFolio(selectedFolioForDrawer)
                  setTargetCurrency('EUR')
                  setConversionResult(null)
                  setActiveModal('CONVERT')
                }}
                className="bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20 text-xs font-bold"
              >
                <Receipt className="w-3.5 h-3.5 mr-1" /> Convert
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedFolio(selectedFolioForDrawer)
                  setFiscalResult(null)
                  setActiveModal('FISCAL')
                }}
                className="bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-bold"
              >
                <Check className="w-3.5 h-3.5 mr-1" /> Fiscal
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Split Folio Modal */}
      <Dialog open={activeModal === 'SPLIT'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="bg-[#121212] border-white/10 text-white max-w-md rounded-2xl p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
              <SplitSquareVertical className="w-5 h-5 text-purple-400" /> Split Folio by Percentage
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-sm">
              Transfer a percentage of charges from Folio <span className="font-mono text-white">{selectedFolio?.id?.substring(0, 8).toUpperCase()}</span> to a new folio.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submitSplitFolio} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Split Percentage (%)
              </label>
              <Input
                type="number"
                min="1"
                max="99"
                value={splitPercentage}
                onChange={(e) => setSplitPercentage(e.target.value)}
                className="bg-white/5 border-white/10 text-white font-mono text-sm"
                required
              />
            </div>

            <DialogFooter className="pt-4 gap-2 border-t border-white/10">
              <Button type="button" variant="ghost" onClick={() => setActiveModal(null)} className="hover:bg-white/10 text-slate-400 hover:text-white">
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading} className="bg-purple-600 hover:bg-purple-700 font-bold text-white">
                {actionLoading ? 'Splitting...' : 'Split Folio'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Currency Convert Modal */}
      <Dialog open={activeModal === 'CONVERT'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="bg-[#121212] border-white/10 text-white max-w-md rounded-2xl p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
              <Receipt className="w-5 h-5 text-blue-400" /> Convert Folio Currency
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-sm">
              View real-time exchange rates for Folio <span className="font-mono text-white">{selectedFolio?.id?.substring(0, 8).toUpperCase()}</span>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submitCurrencyConvert} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Target Currency
              </label>
              <select
                value={targetCurrency}
                onChange={(e) => setTargetCurrency(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {['EUR', 'GBP', 'JPY', 'AUD', 'CAD'].map(c => (
                  <option key={c} value={c} className="bg-[#1a1a1a] text-white">{c}</option>
                ))}
              </select>
            </div>

            {conversionResult && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-2 text-sm">
                <div className="flex justify-between text-slate-300">
                  <span>Exchange Rate (1 USD):</span>
                  <span className="font-mono text-blue-400">{conversionResult.exchangeRate} {conversionResult.targetCurrency}</span>
                </div>
                <div className="flex justify-between font-bold text-white pt-2 border-t border-white/10">
                  <span>Converted Balance:</span>
                  <span className="font-mono text-emerald-400">{conversionResult.balance} {conversionResult.targetCurrency}</span>
                </div>
              </div>
            )}

            <DialogFooter className="pt-4 gap-2 border-t border-white/10">
              <Button type="button" variant="ghost" onClick={() => setActiveModal(null)} className="hover:bg-white/10 text-slate-400 hover:text-white">
                Close
              </Button>
              <Button type="submit" disabled={actionLoading} className="bg-blue-600 hover:bg-blue-700 font-bold text-white">
                {actionLoading ? 'Calculating...' : 'Calculate Conversion'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. Fiscal Sign Modal */}
      <Dialog open={activeModal === 'FISCAL'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="bg-[#121212] border-white/10 text-white max-w-md rounded-2xl p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
              <Check className="w-5 h-5 text-amber-400" /> Fiscal Cryptographic Signing
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-sm">
              Generate regional tax authority fiscal signature for Folio <span className="font-mono text-white">{selectedFolio?.id?.substring(0, 8).toUpperCase()}</span>.
            </DialogDescription>
          </DialogHeader>

          {fiscalResult ? (
            <div className="space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2">
                <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">Cryptographic Signature</p>
                <p className="font-mono text-xs text-slate-200 break-all bg-black/40 p-2 rounded border border-white/10">{fiscalResult.signature}</p>
                <p className="text-[10px] text-slate-400">Timestamp: {new Date(fiscalResult.timestamp).toLocaleString()}</p>
              </div>

              <DialogFooter>
                <Button onClick={() => setActiveModal(null)} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold">
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={submitFiscalSign} className="space-y-4">
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-300 space-y-1">
                <p><strong>Folio ID:</strong> {selectedFolio?.id}</p>
                <p><strong>Status:</strong> {selectedFolio?.status}</p>
              </div>

              <DialogFooter className="pt-4 gap-2 border-t border-white/10">
                <Button type="button" variant="ghost" onClick={() => setActiveModal(null)} className="hover:bg-white/10 text-slate-400 hover:text-white">
                  Cancel
                </Button>
                <Button type="submit" disabled={actionLoading} className="bg-amber-600 hover:bg-amber-700 font-bold text-white">
                  {actionLoading ? 'Signing...' : 'Generate Fiscal Sign'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  )
}

