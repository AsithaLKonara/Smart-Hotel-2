"use client"

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Search, Crown, Star } from 'lucide-react'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function CRMDashboard() {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const { data: guests, isLoading } = useQuery({
    queryKey: ['crm-guests'],
    queryFn: async () => {
      const seed = await fetch('/api/crm/seed', { method: 'POST' })
      if (seed.ok) {
        const res = await fetch('/api/crm/guests')
        return res.json()
      }
      return []
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <PremiumSpinner size="lg" text="Loading Guest Directory..." />
      </div>
    )
  }

  const filteredGuests = guests?.filter((g: any) => 
    g.name.toLowerCase().includes(search.toLowerCase()) || 
    g.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-serif text-slate-900 tracking-tight flex items-center">
            <Users className="w-8 h-8 mr-3 text-primary" /> Guest Directory
          </h1>
          <p className="text-slate-500 mt-1">Unified profiles, loyalty status, and history.</p>
        </div>
        
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search by name or email..." 
            className="pl-9 bg-white"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGuests?.map((guest: any) => (
          <Card 
            key={guest.id} 
            className="hover:border-primary/50 hover:shadow-md cursor-pointer transition-all bg-white"
            onClick={() => router.push(`/admin/crm/${guest.id}`)}
          >
            <CardHeader className="pb-3 border-b bg-slate-50/50">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{guest.name}</CardTitle>
                  <p className="text-xs text-slate-500 mt-1">{guest.email}</p>
                </div>
                {guest.vipStatus === 'VIP' && (
                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200">
                    <Crown className="w-3 h-3 mr-1" /> VIP
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Lifetime Spend</span>
                <span className="font-semibold text-slate-900">
                  ${(guest.guestHistory?.totalSpend || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Stays</span>
                <span className="font-medium text-slate-900">
                  {guest.guestHistory?.totalStays || 0}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm pt-3 border-t">
                <span className="text-slate-500">Loyalty Tier</span>
                <div className="flex items-center">
                  <Star className={`w-3 h-3 mr-1 ${guest.loyalty?.tier === 'PLATINUM' ? 'text-purple-500' : 'text-slate-400'}`} />
                  <span className="font-bold text-slate-700">{guest.loyalty?.tier || 'NONE'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
