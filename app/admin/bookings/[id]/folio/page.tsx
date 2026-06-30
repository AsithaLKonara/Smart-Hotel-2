"use client"

import { useState, use } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  FileText, Plus, SplitSquareHorizontal, MoveRight, Receipt, PlusCircle, Building2 
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { PremiumSpinner } from '@/components/ui/premium-spinner'

export default function AdvancedFolioPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const bookingId = resolvedParams.id
  const queryClient = useQueryClient()

  // Fetch Folios
  const { data: folios, isLoading } = useQuery({
    queryKey: ['booking-folios', bookingId],
    queryFn: async () => {
      const res = await fetch(`/api/bookings/${bookingId}/folios`)
      if (!res.ok) throw new Error('Failed to fetch folios')
      return res.json()
    }
  })

  // Post Charge Mutation
  const postChargeMut = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/folios/post-charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Failed to post charge')
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['booking-folios', bookingId] })
      toast.success(data.isRouted ? 'Charge posted and routed!' : 'Charge posted successfully')
    }
  })

  // Add Window Mutation
  const addWindowMut = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`/api/bookings/${bookingId}/folios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Failed to add window')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-folios', bookingId] })
      toast.success('Folio Window added')
    }
  })

  // Add Routing Rule Mutation
  const addRoutingMut = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/folios/routing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Failed to add routing rule')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-folios', bookingId] })
      toast.success('Routing rule added')
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <PremiumSpinner size="lg" text="Loading Ledger..." />
      </div>
    )
  }

  return (
    <div className="p-6 text-white min-h-screen bg-[#050309]">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/5 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold">Folio & Billing</h1>
          <p className="text-slate-400 text-sm mt-1">Manage guest folios, corporate routing, and line items.</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10" 
            onClick={() => {
              addWindowMut.mutate({})
            }}
          >
            <SplitSquareHorizontal className="w-4 h-4 mr-2" /> New Window
          </Button>
          <Button className="bg-primary text-white" 
            onClick={() => {
              const amountStr = prompt('Amount ($):')
              if (!amountStr) return
              const category = prompt('Category (e.g. ROOM_CHARGE, MINIBAR, SPA):', 'MINIBAR')
              if (!category) return
              const desc = prompt('Description:')
              if (!desc) return

              postChargeMut.mutate({
                bookingId,
                amount: parseFloat(amountStr),
                category,
                description: desc
              })
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Post Charge
          </Button>
        </div>
      </div>

      <div className="flex flex-nowrap overflow-x-auto gap-6 pb-4 snap-x">
        {folios?.map((folio: any) => {
          const totalAmount = folio.lineItems?.reduce((sum: number, item: any) => sum + item.amount, 0) || 0

          return (
            <Card key={folio.id} className="min-w-[400px] max-w-[450px] shrink-0 bg-[#0a0a0f] border-white/10 snap-center flex flex-col">
              <CardContent className="p-0 flex-1 flex flex-col">
                {/* Header */}
                <div className="p-5 border-b border-white/5 flex justify-between items-start bg-white/[0.02]">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-lg font-bold text-white">Window {folio.windowNumber}</h2>
                      {folio.type === 'ROUTING' && <Badge className="bg-purple-500/20 text-purple-400">Routed</Badge>}
                    </div>
                    {folio.company ? (
                      <p className="text-xs text-slate-400 flex items-center"><Building2 className="w-3 h-3 mr-1" /> {folio.company.name}</p>
                    ) : (
                      <p className="text-xs text-slate-400 flex items-center"><FileText className="w-3 h-3 mr-1" /> Guest Master</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-emerald-400">${totalAmount.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Balance</span>
                  </div>
                </div>

                {/* Routing Rules */}
                {folio.windowNumber === 1 && (
                  <div className="px-5 py-3 border-b border-white/5 bg-blue-500/5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Routing Instructions</span>
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] text-blue-400"
                        onClick={() => {
                          const cat = prompt('Category to route (e.g. ROOM_CHARGE):', 'ROOM_CHARGE')
                          if (!cat) return
                          const wnd = prompt('Target Window Number:', '2')
                          if (!wnd) return
                          const target = folios.find((f: any) => f.windowNumber === parseInt(wnd))
                          if (!target) { toast.error('Target window not found'); return }
                          
                          addRoutingMut.mutate({
                            sourceFolioId: folio.id,
                            targetFolioId: target.id,
                            category: cat
                          })
                        }}
                      >
                        <PlusCircle className="w-3 h-3 mr-1" /> Add Rule
                      </Button>
                    </div>
                    {folio.routingRulesSource?.length > 0 ? (
                      <div className="space-y-1">
                        {folio.routingRulesSource.map((rule: any) => {
                          const targetWindow = folios.find((f: any) => f.id === rule.targetFolioId)?.windowNumber
                          return (
                            <div key={rule.id} className="text-xs flex items-center text-slate-300">
                              <Badge variant="outline" className="text-[10px] py-0 border-white/10 mr-2">{rule.criteria.category}</Badge>
                              <MoveRight className="w-3 h-3 mr-2 text-slate-500" />
                              <span>Window {targetWindow}</span>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">No routing applied.</p>
                    )}
                  </div>
                )}

                {/* Line Items */}
                <div className="p-5 flex-1 overflow-y-auto">
                  {folio.lineItems?.length === 0 ? (
                    <div className="h-32 flex flex-col items-center justify-center text-slate-500">
                      <Receipt className="w-8 h-8 mb-2 opacity-20" />
                      <p className="text-sm">No charges posted.</p>
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-slate-500 border-b border-white/5">
                          <th className="pb-2 font-medium">Date</th>
                          <th className="pb-2 font-medium">Description</th>
                          <th className="pb-2 font-medium text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {folio.lineItems.map((item: any) => (
                          <tr key={item.id} className="border-b border-white/5 last:border-0">
                            <td className="py-3 text-slate-400 text-xs">
                              {format(new Date(item.createdAt), 'MMM d, HH:mm')}
                            </td>
                            <td className="py-3">
                              <div className="font-medium text-slate-200">{item.description}</div>
                              <div className="text-[10px] text-slate-500">{item.category}</div>
                              {item.isRouted && <span className="text-[10px] text-purple-400">Routed</span>}
                            </td>
                            <td className="py-3 text-right font-medium text-slate-200">
                              ${item.amount.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
