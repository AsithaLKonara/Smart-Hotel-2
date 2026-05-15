"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  CreditCard, 
  Download, 
  Receipt,
  TrendingUp,
  Utensils,
  Bed,
  Sparkles,
  Loader2
} from 'lucide-react'
import { GuestPageShell } from '@/components/dashboard/guest/guest-page-shell'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const getIcon = (category: string) => {
  switch (category) {
    case 'ROOM': return Bed
    case 'FOOD': return Utensils
    case 'WELLNESS': return Sparkles
    default: return Receipt
  }
}

export default function SpendingPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSpending() {
      try {
        const res = await fetch('/api/guest/spending')
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (err) {
        console.error('Failed to fetch spending', err)
      } finally {
        setLoading(false)
      }
    }
    fetchSpending()
  }, [])

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  const summary = data?.summary || { totalSpending: 0, pendingPayments: 0 }
  const transactions = data?.transactions || []

  return (
    <GuestPageShell
      title="Financial Overview"
      subtitle="Track your luxury journey spending in real-time. Review charges, manage payments, and download invoices."
      firstName={session?.user?.name?.split(' ')[0]}
    >
      <div className="space-y-10">
        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-[#0c0c0c] border-white/5 p-8 rounded-[40px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] -mr-16 -mt-16 group-hover:bg-primary/20 transition-all" />
            <div className="relative z-10 space-y-4">
              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Total Charges</p>
              <h2 className="text-4xl font-serif font-bold text-white">${summary.totalSpending.toLocaleString()}</h2>
              <div className="flex items-center gap-2 text-emerald-500 text-xs">
                <TrendingUp className="w-4 h-4" />
                <span>Real-time Sync Active</span>
              </div>
            </div>
          </Card>

          <Card className="bg-[#0c0c0c] border-white/5 p-8 rounded-[40px] relative overflow-hidden group">
            <div className="relative z-10 space-y-4">
              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Pending Settlement</p>
              <h2 className="text-2xl font-serif font-bold text-white">${summary.pendingPayments.toLocaleString()}</h2>
              <p className="text-[10px] text-white/20 uppercase font-black">Linked to Suite</p>
              <Button variant="link" className="p-0 h-auto text-[10px] uppercase font-black text-primary tracking-widest">Pay Balance</Button>
            </div>
          </Card>

          <Card className="bg-primary/5 border-primary/20 p-8 rounded-[40px] flex flex-col justify-between">
            <div className="space-y-1">
              <h4 className="font-bold text-white">Express Checkout</h4>
              <p className="text-xs text-white/40">Settle your account and receive your final invoice via email.</p>
            </div>
            <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest">
              Review & Pay
            </Button>
          </Card>
        </div>

        {/* Transaction History */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-lg font-serif font-bold text-white">Transaction History</h3>
            <Button variant="outline" className="h-10 bg-white/5 border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest px-6">
              <Download className="w-4 h-4 mr-2 text-primary" /> Download PDF
            </Button>
          </div>

          <Card className="bg-[#0c0c0c] border-white/5 rounded-[40px] overflow-hidden">
            <div className="divide-y divide-white/5">
              {transactions.length > 0 ? transactions.map((tx: any) => {
                const Icon = getIcon(tx.category)
                return (
                  <div key={tx.id} className="p-8 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 group-hover:bg-primary/20 group-hover:text-primary transition-all">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h5 className="font-bold text-white">{tx.description}</h5>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-black uppercase tracking-tighter text-white/20">{tx.id}</span>
                          <Badge variant="outline" className="text-[8px] border-white/10 text-white/40 px-2 py-0">{tx.category}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-lg font-serif font-bold text-white">${tx.amount.toLocaleString()}</p>
                      <p className="text-[10px] text-white/20 uppercase font-black">{new Date(tx.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                )
              }) : (
                <div className="p-20 text-center text-white/20 uppercase tracking-widest font-black text-xs">
                  No transactions detected on this sanctuary cycle.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </GuestPageShell>
  )
}
