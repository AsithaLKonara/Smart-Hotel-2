"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Gift, 
  Star, 
  Award, 
  TrendingUp, 
  History, 
  ChevronRight,
  Sparkles,
  Loader2,
  Crown
} from 'lucide-react'
import { GuestPageShell } from '@/components/dashboard/guest/guest-page-shell'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function LoyaltyPage() {
  const { data: session } = useSession()
  const [loyalty, setLoyalty] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.id) fetchLoyaltyData()
  }, [session])

  const fetchLoyaltyData = async () => {
    try {
      const [loyRes, transRes] = await Promise.all([
        fetch('/api/loyalty'),
        fetch('/api/loyalty/transactions')
      ])

      if (loyRes.ok) setLoyalty(await loyRes.json())
      if (transRes.ok) setTransactions(await transRes.json())
    } catch (err) {
      toast.error("Failed to sync loyalty records")
    } finally {
      setLoading(false)
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'platinum': return <Crown className="w-8 h-8 text-indigo-400" />
      case 'gold': return <Award className="w-8 h-8 text-amber-400" />
      case 'silver': return <Star className="w-8 h-8 text-slate-300" />
      default: return <Sparkles className="w-8 h-8 text-emerald-400" />
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'platinum': return 'from-indigo-600 to-purple-600'
      case 'gold': return 'from-amber-500 to-orange-600'
      case 'silver': return 'from-slate-400 to-slate-600'
      default: return 'from-emerald-500 to-teal-600'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090514]">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <GuestPageShell
      title="Elite Rewards"
      subtitle="Your loyalty is our highest honor. Explore your exclusive benefits, tracked across every stay and signature experience."
      firstName={session?.user?.name?.split(' ')[0]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left: Tier Card & Points */}
        <div className="lg:col-span-4 space-y-8">
          <Card className={cn(
            "p-10 rounded-[40px] text-white relative overflow-hidden shadow-2xl border-none",
            "bg-gradient-to-br", getTierColor(loyalty?.tier || 'bronze')
          )}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[100px] -mr-32 -mt-32" />
            
            <div className="relative z-10 space-y-10">
              <div className="flex items-center justify-between">
                <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  {getTierIcon(loyalty?.tier || 'bronze')}
                </div>
                <Badge className="bg-white/20 backdrop-blur-md text-white border-white/20 uppercase tracking-widest text-[10px] py-1 px-4">
                  {loyalty?.tier || 'BRONZE'} STATUS
                </Badge>
              </div>

              <div className="space-y-1">
                <p className="text-4xl font-serif font-bold">{loyalty?.points?.toLocaleString() || '0'}</p>
                <p className="text-[10px] uppercase font-black tracking-[0.3em] opacity-60">Total Reward Points</p>
              </div>

              <div className="pt-6 border-t border-white/10 space-y-4">
                <div className="flex justify-between text-xs font-bold">
                  <span>Progress to next tier</span>
                  <span>75%</span>
                </div>
                <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white w-3/4 rounded-full" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-[#0c0c0c] border-white/5 p-8 rounded-[40px] space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30 px-2">Elite Privileges</h4>
            <div className="space-y-4">
              {[
                { label: 'Complimentary Butler Service', active: true },
                { label: 'Priority Check-in/Out', active: true },
                { label: 'Suite Upgrades on Availability', active: loyalty?.tier === 'platinum' },
                { label: 'Exclusive Lounge Access', active: ['gold', 'platinum'].includes(loyalty?.tier) },
              ].map((benefit, i) => (
                <div key={i} className={cn(
                  "flex items-center gap-4 p-4 rounded-2xl border transition-all",
                  benefit.active ? "bg-primary/5 border-primary/20 text-white" : "bg-white/[0.02] border-white/5 text-white/20"
                )}>
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    benefit.active ? "bg-primary shadow-[0_0_10px_rgba(209,180,105,0.5)]" : "bg-white/10"
                  )} />
                  <span className="text-xs font-medium">{benefit.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: History & Redemptions */}
        <div className="lg:col-span-8 space-y-10">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30 flex items-center gap-3">
              <History className="w-4 h-4" /> Points Activity
            </h4>
            <Button variant="ghost" className="text-[10px] uppercase font-black tracking-widest text-primary hover:bg-primary/10">
              Download Statement
            </Button>
          </div>

          <Card className="bg-[#0c0c0c] border-white/5 rounded-[40px] overflow-hidden">
            <div className="divide-y divide-white/5">
              {transactions.length > 0 ? transactions.map((tx) => (
                <div key={tx.id} className="p-8 flex items-center justify-between hover:bg-white/[0.01] transition-colors group">
                  <div className="flex items-center gap-6">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                      tx.type === 'earned' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                    )}>
                      {tx.type === 'earned' ? <TrendingUp className="w-5 h-5" /> : <Gift className="w-5 h-5" />}
                    </div>
                    <div>
                      <h5 className="font-bold text-white group-hover:text-primary transition-colors">{tx.description}</h5>
                      <p className="text-xs text-white/30 mt-1">{new Date(tx.createdAt).toLocaleDateString()} • {tx.type.toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-lg font-serif font-bold",
                      tx.type === 'earned' ? "text-emerald-500" : "text-rose-500"
                    )}>
                      {tx.type === 'earned' ? '+' : '-'}{tx.points}
                    </p>
                    <p className="text-[10px] uppercase font-black tracking-tighter text-white/20">Credits</p>
                  </div>
                </div>
              )) : (
                <div className="p-32 text-center space-y-4">
                  <Gift className="w-12 h-12 text-white/5 mx-auto" />
                  <p className="text-xs text-white/20 uppercase font-black tracking-widest">Your rewards journey begins with your first stay.</p>
                </div>
              )}
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-8 bg-gold-gradient border-none rounded-[40px] flex items-center justify-between group cursor-pointer hover:scale-[1.02] transition-all shadow-luxury">
               <div className="space-y-1">
                  <h5 className="font-serif font-bold text-white text-lg">Redeem Points</h5>
                  <p className="text-xs text-white/70">Spa, Dining & More</p>
               </div>
               <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white backdrop-blur-md group-hover:bg-white transition-all group-hover:text-primary">
                  <ChevronRight className="w-6 h-6" />
               </div>
            </Card>
            <Card className="p-8 bg-white/5 border-white/10 rounded-[40px] flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-all">
               <div className="space-y-1">
                  <h5 className="font-serif font-bold text-white text-lg">Gift Vouchers</h5>
                  <p className="text-xs text-white/40">Share the luxury</p>
               </div>
               <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white group-hover:bg-primary/20 group-hover:text-primary transition-all">
                  <ChevronRight className="w-6 h-6" />
               </div>
            </Card>
          </div>
        </div>

      </div>
    </GuestPageShell>
  )
}
