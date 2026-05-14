"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Wallet, History, ArrowUpRight, Receipt } from 'lucide-react'
import { PremiumSpinner } from '@/components/ui/premium-spinner'

export function GuestSpending() {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchSpending()
  }, [])

  const fetchSpending = async () => {
    try {
      const res = await fetch('/api/guest/spending')
      const json = await res.json()
      setData(json)
    } catch (error) {
      console.error('Error fetching spending:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) return <div className="py-10 flex justify-center"><PremiumSpinner /></div>

  const summary = data?.summary || { totalSpending: 0, pendingPayments: 0 }

  return (
    <Card className="p-10 bg-[#0c0c0c] border-white/[0.05] rounded-[40px] space-y-8 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
        <Wallet className="w-48 h-48 text-white" />
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-white/40">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-white tracking-tight">Stay Folio</h4>
            <p className="text-xs text-white/40 font-medium">Real-time expenditure tracking</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Total Spending</p>
          <p className="text-3xl font-serif font-bold text-white">${summary.totalSpending.toFixed(2)}</p>
        </div>
      </div>

      <div className="space-y-4">
        {data?.transactions?.slice(0, 3).map((tx: any) => (
          <div key={tx.id} className="flex items-center justify-between py-4 border-t border-white/[0.03]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/5 text-white/20">
                <History className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-sm font-medium text-white/60">{tx.description}</span>
                <p className="text-[9px] text-white/20 uppercase font-black tracking-widest">{tx.category}</p>
              </div>
            </div>
            <span className="text-sm font-bold text-white">${tx.amount.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="pt-4 grid grid-cols-2 gap-4">
        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
          <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Pending</p>
          <p className="text-xl font-bold text-white">${summary.pendingPayments.toFixed(2)}</p>
        </div>
        <button className="flex items-center justify-center gap-2 p-6 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-3xl text-[10px] font-black uppercase tracking-widest text-primary transition-all">
          Settle Now <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
    </Card>
  )
}
