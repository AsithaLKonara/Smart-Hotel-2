"use client"

import { useState, useEffect, useMemo } from 'react'
import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { FileText, MoreVertical, Check, CreditCard, ChevronDown, SplitSquareVertical, Receipt, Sparkles, X, ShoppingCart, Search, Printer, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

export default function FoliosManagementPage() {
  const [folios, setFolios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedFolio, setExpandedFolio] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'PAID'>('ALL')

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

  const filteredFolios = useMemo(() => {
    return folios.filter(folio => {
      if (statusFilter !== 'ALL' && folio.status !== statusFilter) return false
      if (!searchTerm) return true
      const term = searchTerm.toLowerCase()
      const guestName = folio.booking?.guest?.name?.toLowerCase() || ''
      const roomNum = folio.booking?.roomAssignments?.[0]?.room?.number?.toLowerCase() || ''
      const folioId = folio.id?.toLowerCase() || ''
      return guestName.includes(term) || roomNum.includes(term) || folioId.includes(term)
    })
  }, [folios, searchTerm, statusFilter])

  const selectedFolioForDrawer = folios.find(f => f.id === expandedFolio)

  return (
    <AdminPageShell 
      title="Folios & Billing" 
      subtitle="Manage guest accounts, process payments, and audit transactions." 
      onRefresh={fetchFolios}
      actions={
        <Link href="/admin/pos">
          <Button className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs px-3.5 py-2 rounded-lg font-mono tracking-wider uppercase transition-all shadow-sm flex items-center gap-2 h-9">
            <ShoppingCart className="w-3.5 h-3.5" /> Open POS & Billing Terminal
          </Button>
        </Link>
      }
    >
      {loading ? (
        <div className="py-20 flex justify-center"><PremiumSpinner /></div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <Card className="bg-[#121417] border border-[#1E2227] rounded-xl p-5 shadow-sm">
               <CardContent className="p-0 flex items-center justify-between">
                 <div>
                   <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">Total Open Folios</p>
                   <p className="text-2xl font-mono font-bold text-amber-400 mt-1">{folios.filter(f => f.status === 'OPEN').length}</p>
                 </div>
                 <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                   <FileText className="w-4 h-4" />
                 </div>
               </CardContent>
             </Card>

             <Card className="bg-[#121417] border border-[#1E2227] rounded-xl p-5 shadow-sm">
               <CardContent className="p-0 flex items-center justify-between">
                 <div>
                   <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">Settled Accounts</p>
                   <p className="text-2xl font-mono font-bold text-emerald-400 mt-1">{folios.filter(f => f.status === 'PAID').length}</p>
                 </div>
                 <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                   <Check className="w-4 h-4" />
                 </div>
               </CardContent>
             </Card>

             <Card className="bg-[#121417] border border-[#1E2227] rounded-xl p-5 shadow-sm">
               <CardContent className="p-0 flex items-center justify-between">
                 <div>
                   <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">Outstanding Receivables</p>
                   <p className="text-2xl font-mono font-bold text-zinc-100 mt-1">
                     ${folios.reduce((sum, f) => {
                       if (f.status === 'PAID') return sum;
                       const total = (f.lineItems || [])
                         .filter((b: any) => b.category !== 'PAYMENT')
                         .reduce((a: number, b: any) => a + Number(b.amount || 0), 0);
                       const paid = (f.payments || []).reduce((a: number, b: any) => a + Number(b.amount || 0), 0);
                       return sum + Math.max(0, total - paid);
                     }, 0).toFixed(2)}
                   </p>
                 </div>
                 <div className="w-9 h-9 rounded-lg bg-[#181A1D] border border-[#1E2227] flex items-center justify-center text-zinc-400">
                   <CreditCard className="w-4 h-4" />
                 </div>
               </CardContent>
             </Card>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-3 bg-[#121417] border border-[#1E2227] rounded-xl flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                placeholder="Search guest, room #, or folio ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#181A1D] border border-[#2B3037] text-xs text-zinc-100 placeholder:text-zinc-500 rounded-lg pl-9 pr-8 py-2 outline-none focus:border-zinc-400 font-mono transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`text-xs h-8 px-3 rounded-lg font-mono transition-all ${
                  statusFilter === 'ALL' 
                    ? 'bg-white text-black font-semibold shadow-sm' 
                    : 'bg-[#181A1D] hover:bg-[#20242A] border border-[#2B3037] text-zinc-300'
                }`}
              >
                All ({folios.length})
              </button>
              <button
                onClick={() => setStatusFilter('OPEN')}
                className={`text-xs h-8 px-3 rounded-lg font-mono transition-all ${
                  statusFilter === 'OPEN' 
                    ? 'bg-amber-400 text-black font-semibold shadow-sm' 
                    : 'bg-[#181A1D] hover:bg-[#20242A] border border-[#2B3037] text-zinc-300'
                }`}
              >
                Open ({folios.filter(f => f.status === 'OPEN').length})
              </button>
              <button
                onClick={() => setStatusFilter('PAID')}
                className={`text-xs h-8 px-3 rounded-lg font-mono transition-all ${
                  statusFilter === 'PAID' 
                    ? 'bg-emerald-400 text-black font-semibold shadow-sm' 
                    : 'bg-[#181A1D] hover:bg-[#20242A] border border-[#2B3037] text-zinc-300'
                }`}
              >
                Settled ({folios.filter(f => f.status === 'PAID').length})
              </button>
            </div>
          </div>

          <div className="bg-[#121417] border border-[#1E2227] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#141619] border-b border-[#1E2227] text-zinc-400 text-[11px] font-mono uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Folio ID</th>
                    <th className="p-3.5">Guest / Room</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Total</th>
                    <th className="p-3.5">Outstanding Balance</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2227]">
                  {filteredFolios.map(folio => {
                    const total = (folio.lineItems || [])
                      .filter((b: any) => b.category !== 'PAYMENT')
                      .reduce((a: number, b: any) => a + Number(b.amount || 0), 0);
                    const paid = (folio.payments || []).reduce((a: number, b: any) => a + Number(b.amount || 0), 0);
                    const balance = Math.max(0, total - paid);
                    const roomAssignment = folio.booking?.roomAssignments?.[0];
                    
                    return (
                      <tr key={folio.id} className="hover:bg-[#16181B] transition-colors">
                        <td className="p-3.5 font-mono text-zinc-300 font-medium">FOL-{folio.id.substring(0, 8).toUpperCase()}</td>
                        <td className="p-3.5">
                          <p className="font-semibold text-zinc-100">{folio.booking?.guest?.name || 'Walk-in Guest'}</p>
                          <p className="text-[11px] font-mono text-zinc-400">{roomAssignment ? `Room ${roomAssignment.room.number}` : 'N/A'}</p>
                        </td>
                        <td className="p-3.5 font-mono uppercase text-zinc-400 text-[11px]">{folio.type}</td>
                        <td className="p-3.5 font-mono text-zinc-300 font-medium">${total.toFixed(2)}</td>
                        <td className={`p-3.5 font-mono font-bold ${balance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          ${balance.toFixed(2)}
                        </td>
                        <td className="p-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                            folio.status === 'PAID' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {folio.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <DropdownMenu.Root>
                            <DropdownMenu.Trigger asChild>
                              <button className="p-1.5 hover:bg-[#181A1D] border border-transparent hover:border-[#2B3037] rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors">
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Portal>
                              <DropdownMenu.Content className="min-w-[190px] bg-[#121417] border border-[#1E2227] rounded-xl p-1.5 shadow-2xl text-xs text-zinc-200 z-50 space-y-0.5 font-mono">
                                <DropdownMenu.Item onClick={() => setExpandedFolio(expandedFolio === folio.id ? null : folio.id)} className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-[#181A1D] rounded-lg cursor-pointer outline-none text-zinc-300 hover:text-zinc-100">
                                  <FileText className="w-3.5 h-3.5 text-zinc-400" /> View Statement
                                </DropdownMenu.Item>
                                {folio.status !== 'PAID' && (
                                  <DropdownMenu.Item onClick={() => {
                                    setSelectedFolio(folio)
                                    setSplitPercentage('50')
                                    setActiveModal('SPLIT')
                                  }} className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-[#181A1D] rounded-lg cursor-pointer outline-none text-zinc-300 hover:text-zinc-100">
                                    <SplitSquareVertical className="w-3.5 h-3.5 text-purple-400" /> Split Folio
                                  </DropdownMenu.Item>
                                )}
                                <DropdownMenu.Item onClick={() => {
                                  setSelectedFolio(folio)
                                  setTargetCurrency('EUR')
                                  setConversionResult(null)
                                  setActiveModal('CONVERT')
                                }} className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-[#181A1D] rounded-lg cursor-pointer outline-none text-zinc-300 hover:text-zinc-100">
                                  <Receipt className="w-3.5 h-3.5 text-blue-400" /> Convert Currency
                                </DropdownMenu.Item>
                                <DropdownMenu.Item onClick={() => {
                                  setSelectedFolio(folio)
                                  setFiscalResult(null)
                                  setActiveModal('FISCAL')
                                }} className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-[#181A1D] rounded-lg cursor-pointer outline-none text-amber-400">
                                  <Check className="w-3.5 h-3.5 text-amber-400" /> Fiscal Signing
                                </DropdownMenu.Item>
                              </DropdownMenu.Content>
                            </DropdownMenu.Portal>
                          </DropdownMenu.Root>
                        </td>
                      </tr>
                    )
                  })}
                  {folios.length === 0 && (
                    <tr><td colSpan={7} className="p-8 text-center text-zinc-500 font-mono">No folios or transactions found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Right Side Panel Drawer for Folio Line Items */}
      {expandedFolio && selectedFolioForDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setExpandedFolio(null)}
          />

          {/* Drawer Container */}
          <div className="relative w-full max-w-lg bg-[#121417] border-l border-[#1E2227] shadow-2xl flex flex-col h-full z-50 text-zinc-100 animate-in slide-in-from-right duration-300 overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-[#1E2227] flex justify-between items-start bg-[#141619]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-base font-semibold text-zinc-100">Folio Statement</h2>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase ${
                    selectedFolioForDrawer.status === 'PAID' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {selectedFolioForDrawer.status}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-zinc-400">ID: {selectedFolioForDrawer.id}</p>
                <div className="mt-1.5 text-xs text-zinc-300 flex items-center gap-4 font-mono">
                  <span>Guest: <strong className="text-zinc-100">{selectedFolioForDrawer.booking?.guest?.name || 'Walk-in'}</strong></span>
                  <span>Room: <strong className="text-zinc-100">{selectedFolioForDrawer.booking?.roomAssignments?.[0]?.room?.number || 'N/A'}</strong></span>
                </div>
              </div>
              <button 
                onClick={() => setExpandedFolio(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-[#181A1D] rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Financial Totals Card */}
            <div className="p-4 bg-[#141619] border-b border-[#1E2227] grid grid-cols-3 gap-2.5 text-center">
              <div className="bg-[#181A1D] p-3 rounded-lg border border-[#1E2227]">
                <p className="text-[10px] font-mono uppercase text-zinc-400">Total Charges</p>
                <p className="font-mono text-zinc-100 text-base font-bold mt-0.5">
                  ${(selectedFolioForDrawer.lineItems || [])
                    .filter((b: any) => b.category !== 'PAYMENT')
                    .reduce((a: number, b: any) => a + Number(b.amount || 0), 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-[#181A1D] p-3 rounded-lg border border-[#1E2227]">
                <p className="text-[10px] font-mono uppercase text-zinc-400">Total Payments</p>
                <p className="font-mono text-emerald-400 text-base font-bold mt-0.5">
                  ${(selectedFolioForDrawer.payments || []).reduce((a: number, b: any) => a + Number(b.amount || 0), 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-[#181A1D] p-3 rounded-lg border border-[#1E2227]">
                <p className="text-[10px] font-mono uppercase text-zinc-400">Current Balance</p>
                <p className="font-mono text-zinc-100 font-bold text-base mt-0.5">
                  ${Math.max(0, (selectedFolioForDrawer.lineItems || [])
                    .filter((b: any) => b.category !== 'PAYMENT')
                    .reduce((a: number, b: any) => a + Number(b.amount || 0), 0) - (selectedFolioForDrawer.payments || []).reduce((a: number, b: any) => a + Number(b.amount || 0), 0)).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Scrollable Line Items Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Line Items List */}
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2.5 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-zinc-400" /> Itemized Charges
                </h3>
                <div className="space-y-2">
                  {selectedFolioForDrawer.lineItems?.length === 0 ? (
                    <div className="p-5 text-center border border-dashed border-[#1E2227] rounded-xl text-zinc-500 text-xs font-mono">
                      No line items recorded for this folio.
                    </div>
                  ) : (
                    selectedFolioForDrawer.lineItems?.map((item: any) => (
                      <div key={item.id} className="bg-[#181A1D] border border-[#1E2227] rounded-lg p-3 flex justify-between items-center hover:border-[#2B3037] transition-all">
                        <div className="space-y-1">
                          <p className="font-medium text-xs text-zinc-200">{item.description}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] bg-[#121417] border border-[#1E2227] px-2 py-0.5 rounded text-zinc-400 uppercase font-mono">
                              {item.category || 'CHARGE'}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500">
                              {new Date(item.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>
                        </div>
                        <div className={`font-mono font-bold text-xs ${Number(item.amount) < 0 ? 'text-emerald-400' : 'text-zinc-100'}`}>
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
                  <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2.5 flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> Recorded Payments
                  </h3>
                  <div className="space-y-2">
                    {selectedFolioForDrawer.payments.map((p: any) => (
                      <div key={p.id} className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-xs text-emerald-300">Payment ({p.paymentMethod || 'CARD'})</p>
                          <p className="text-[10px] font-mono text-zinc-500">{new Date(p.createdAt).toLocaleString()}</p>
                        </div>
                        <p className="font-mono font-bold text-xs text-emerald-400">-${Number(p.amount || 0).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions Footer */}
            <div className="p-4 border-t border-[#1E2227] bg-[#141619] space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {selectedFolioForDrawer.booking?.id && (
                  <Link href={`/admin/pos?bookingId=${selectedFolioForDrawer.booking.id}&mode=checkout`} className="w-full">
                    <Button className="w-full bg-white hover:bg-zinc-200 text-black font-semibold text-xs font-mono uppercase tracking-wider rounded-lg h-9 gap-1.5 shadow-sm">
                      <CreditCard className="w-3.5 h-3.5" /> Settle in POS
                    </Button>
                  </Link>
                )}
                <Button
                  variant="outline"
                  onClick={() => window.print()}
                  className="w-full bg-[#181A1D] hover:bg-[#20242A] border-[#2B3037] text-zinc-200 text-xs font-mono uppercase tracking-wider rounded-lg h-9 gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Statement
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#1E2227]">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedFolio(selectedFolioForDrawer)
                    setSplitPercentage('50')
                    setActiveModal('SPLIT')
                  }}
                  className="bg-[#181A1D] hover:bg-[#20242A] border-[#2B3037] text-purple-400 text-[10px] font-mono font-semibold h-8"
                >
                  <SplitSquareVertical className="w-3 h-3 mr-1" /> Split
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedFolio(selectedFolioForDrawer)
                    setTargetCurrency('EUR')
                    setConversionResult(null)
                    setActiveModal('CONVERT')
                  }}
                  className="bg-[#181A1D] hover:bg-[#20242A] border-[#2B3037] text-blue-400 text-[10px] font-mono font-semibold h-8"
                >
                  <Receipt className="w-3 h-3 mr-1" /> Convert
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedFolio(selectedFolioForDrawer)
                    setFiscalResult(null)
                    setActiveModal('FISCAL')
                  }}
                  className="bg-[#181A1D] hover:bg-[#20242A] border-[#2B3037] text-amber-400 text-[10px] font-mono font-semibold h-8"
                >
                  <Check className="w-3 h-3 mr-1" /> Fiscal
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. Split Folio Modal */}
      <Dialog open={activeModal === 'SPLIT'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="bg-[#121417] border border-[#1E2227] text-zinc-100 max-w-md rounded-xl p-6 shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-sm font-semibold flex items-center gap-2 text-zinc-100 font-mono">
              <SplitSquareVertical className="w-4 h-4 text-purple-400" /> Split Folio by Percentage
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs font-mono">
              Transfer a percentage of charges from Folio <span className="text-zinc-100 font-bold">{selectedFolio?.id?.substring(0, 8).toUpperCase()}</span> to a new folio.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submitSplitFolio} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                Split Percentage (%)
              </label>
              <input
                type="number"
                min="1"
                max="99"
                value={splitPercentage}
                onChange={(e) => setSplitPercentage(e.target.value)}
                className="w-full bg-[#181A1D] border border-[#2B3037] text-xs text-zinc-100 rounded-lg px-3.5 py-2.5 outline-none focus:border-zinc-400 font-mono"
                required
              />
            </div>

            <DialogFooter className="pt-4 gap-2 border-t border-[#1E2227]">
              <Button type="button" variant="ghost" onClick={() => setActiveModal(null)} className="bg-[#181A1D] hover:bg-[#20242A] border border-[#2B3037] text-zinc-300 font-mono text-xs rounded-lg h-9">
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading} className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs font-mono uppercase tracking-wider rounded-lg h-9">
                {actionLoading ? 'Splitting...' : 'Execute Split'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Currency Convert Modal */}
      <Dialog open={activeModal === 'CONVERT'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="bg-[#121417] border border-[#1E2227] text-zinc-100 max-w-md rounded-xl p-6 shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-sm font-semibold flex items-center gap-2 text-zinc-100 font-mono">
              <Receipt className="w-4 h-4 text-blue-400" /> Convert Folio Currency
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs font-mono">
              View real-time exchange rates for Folio <span className="text-zinc-100 font-bold">{selectedFolio?.id?.substring(0, 8).toUpperCase()}</span>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submitCurrencyConvert} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                Target Currency
              </label>
              <select
                value={targetCurrency}
                onChange={(e) => setTargetCurrency(e.target.value)}
                className="w-full bg-[#181A1D] border border-[#2B3037] text-xs text-zinc-100 rounded-lg px-3.5 py-2.5 outline-none focus:border-zinc-400 font-mono"
              >
                {['EUR', 'GBP', 'JPY', 'AUD', 'CAD'].map(c => (
                  <option key={c} value={c} className="bg-[#181A1D] text-zinc-100">{c}</option>
                ))}
              </select>
            </div>

            {conversionResult && (
              <div className="p-3.5 bg-[#181A1D] border border-blue-500/20 rounded-lg space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-zinc-400">
                  <span>Exchange Rate (1 USD):</span>
                  <span className="text-blue-400 font-bold">{conversionResult.exchangeRate} {conversionResult.targetCurrency}</span>
                </div>
                <div className="flex justify-between font-bold text-zinc-100 pt-1.5 border-t border-[#1E2227]">
                  <span>Converted Balance:</span>
                  <span className="text-emerald-400">{conversionResult.balance} {conversionResult.targetCurrency}</span>
                </div>
              </div>
            )}

            <DialogFooter className="pt-4 gap-2 border-t border-[#1E2227]">
              <Button type="button" variant="ghost" onClick={() => setActiveModal(null)} className="bg-[#181A1D] hover:bg-[#20242A] border border-[#2B3037] text-zinc-300 font-mono text-xs rounded-lg h-9">
                Close
              </Button>
              <Button type="submit" disabled={actionLoading} className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs font-mono uppercase tracking-wider rounded-lg h-9">
                {actionLoading ? 'Calculating...' : 'Calculate Conversion'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. Fiscal Sign Modal */}
      <Dialog open={activeModal === 'FISCAL'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="bg-[#121417] border border-[#1E2227] text-zinc-100 max-w-md rounded-xl p-6 shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-sm font-semibold flex items-center gap-2 text-zinc-100 font-mono">
              <Check className="w-4 h-4 text-amber-400" /> Fiscal Cryptographic Signing
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs font-mono">
              Generate regional tax authority fiscal signature for Folio <span className="text-zinc-100 font-bold">{selectedFolio?.id?.substring(0, 8).toUpperCase()}</span>.
            </DialogDescription>
          </DialogHeader>

          {fiscalResult ? (
            <div className="space-y-4">
              <div className="p-3.5 bg-[#181A1D] border border-amber-500/20 rounded-lg space-y-2">
                <p className="text-[10px] text-amber-400 font-mono font-bold uppercase tracking-wider">Cryptographic Signature Hash</p>
                <p className="font-mono text-xs text-zinc-200 break-all bg-[#121417] p-2.5 rounded border border-[#1E2227]">{fiscalResult.signature}</p>
                <p className="text-[10px] font-mono text-zinc-500">Timestamp: {new Date(fiscalResult.timestamp).toLocaleString()}</p>
              </div>

              <DialogFooter>
                <Button onClick={() => setActiveModal(null)} className="w-full bg-white hover:bg-zinc-200 text-black font-semibold text-xs font-mono uppercase tracking-wider rounded-lg h-9">
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={submitFiscalSign} className="space-y-4">
              <div className="p-3.5 bg-[#181A1D] border border-[#1E2227] rounded-lg text-xs font-mono text-zinc-300 space-y-1">
                <p><span className="text-zinc-500">FOLIO REF:</span> {selectedFolio?.id}</p>
                <p><span className="text-zinc-500">CURRENT STATUS:</span> {selectedFolio?.status}</p>
              </div>

              <DialogFooter className="pt-4 gap-2 border-t border-[#1E2227]">
                <Button type="button" variant="ghost" onClick={() => setActiveModal(null)} className="bg-[#181A1D] hover:bg-[#20242A] border border-[#2B3037] text-zinc-300 font-mono text-xs rounded-lg h-9">
                  Cancel
                </Button>
                <Button type="submit" disabled={actionLoading} className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs font-mono uppercase tracking-wider rounded-lg h-9">
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

