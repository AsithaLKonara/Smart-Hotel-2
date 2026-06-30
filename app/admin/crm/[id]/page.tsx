"use client"

import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, User, Phone, Mail, Crown, Star, Clock, Bed, 
  CreditCard, Activity, AlertTriangle, CheckCircle2 
} from 'lucide-react'
import { PremiumSpinner } from '@/components/ui/premium-spinner'

export default function GuestProfileDashboard() {
  const params = useParams()
  const router = useRouter()
  const guestId = params?.id as string

  const { data: guest, isLoading } = useQuery({
    queryKey: ['crm-guest', guestId],
    queryFn: async () => {
      const res = await fetch(`/api/crm/guests/${guestId}`)
      if (!res.ok) throw new Error('Failed to fetch guest')
      return res.json()
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <PremiumSpinner size="lg" text="Loading 360° Profile..." />
      </div>
    )
  }

  if (!guest) return <div>Guest not found</div>

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <Button variant="ghost" className="mb-2 -ml-4 text-slate-500 hover:text-slate-900" onClick={() => router.back()}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Directory
      </Button>

      {/* Header Profile Card */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center bg-white p-6 rounded-xl border shadow-sm">
        <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
          <User className="w-10 h-10 text-slate-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-serif font-bold text-slate-900">{guest.name}</h1>
            {guest.vipStatus === 'VIP' && (
              <Badge className="bg-amber-100 text-amber-800 border-amber-200 uppercase tracking-widest text-[10px]">
                <Crown className="w-3 h-3 mr-1" /> VIP
              </Badge>
            )}
          </div>
          <div className="flex gap-6 mt-3 text-sm text-slate-600">
            <span className="flex items-center"><Mail className="w-4 h-4 mr-2 text-slate-400" /> {guest.email}</span>
            {guest.phone && <span className="flex items-center"><Phone className="w-4 h-4 mr-2 text-slate-400" /> {guest.phone}</span>}
          </div>
        </div>
        
        {guest.loyalty && (
          <div className="bg-slate-50 p-4 rounded-lg border text-center min-w-[200px]">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Loyalty Tier</div>
            <div className="text-xl font-bold text-indigo-700 flex items-center justify-center">
              <Star className="w-5 h-5 mr-1 text-indigo-500" fill="currentColor" /> {guest.loyalty.tier}
            </div>
            <div className="text-sm font-mono mt-1 text-slate-600">{guest.loyalty.points.toLocaleString()} Points</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Preferences & Stats */}
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <CardTitle className="text-base flex items-center">
                <Activity className="w-4 h-4 mr-2 text-primary" /> Lifetime Value
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm">Total Spend</span>
                <span className="text-xl font-bold text-slate-900 font-mono">
                  ${(guest.guestHistory?.totalSpend || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm">Total Stays</span>
                <span className="text-lg font-semibold text-slate-700">
                  {guest.guestHistory?.totalStays || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm">Total Nights</span>
                <span className="text-lg font-semibold text-slate-700">
                  {guest.guestHistory?.totalNights || 0}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <CardTitle className="text-base flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" /> Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              {guest.guestPreferences?.allergies?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1 text-red-500" /> Allergies
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {guest.guestPreferences.allergies.map((a: string) => (
                      <Badge key={a} variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200">
                        {a}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {guest.guestPreferences?.dietaryRestrictions?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Dietary</h4>
                  <div className="flex flex-wrap gap-2">
                    {guest.guestPreferences.dietaryRestrictions.map((d: string) => (
                      <Badge key={d} variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        {d}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {guest.guestPreferences?.roomPreferences?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Room Setup</h4>
                  <ul className="text-sm space-y-1 text-slate-700">
                    {guest.guestPreferences.roomPreferences.map((r: string) => (
                      <li key={r} className="flex items-center">
                        <Bed className="w-3 h-3 mr-2 text-slate-400" /> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Timelines */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <CardTitle className="text-base flex items-center">
                <Clock className="w-4 h-4 mr-2 text-primary" /> Recent Stays
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {guest.guestBookings?.length === 0 ? (
                <div className="text-slate-500 text-sm text-center py-4">No recent bookings found.</div>
              ) : (
                <div className="space-y-4">
                  {guest.guestBookings?.map((booking: any) => (
                    <div key={booking.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-slate-50">
                      <div>
                        <div className="font-semibold text-slate-900">
                          {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-slate-500 mt-1">
                          Conf: {booking.confirmationCode} • {booking.roomAssignments?.[0]?.room?.type?.name || 'Room'}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className={
                          booking.status === 'CHECKED_IN' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                          booking.status === 'COMPLETED' ? 'bg-slate-100 text-slate-600' : ''
                        }>
                          {booking.status}
                        </Badge>
                        <div className="text-sm font-mono mt-2">${booking.totalAmount.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {guest.loyalty && (
            <Card className="shadow-sm">
              <CardHeader className="bg-slate-50/50 border-b pb-4">
                <CardTitle className="text-base flex items-center">
                  <CreditCard className="w-4 h-4 mr-2 text-primary" /> Recent Loyalty Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {guest.loyalty.transactions?.map((tx: any) => (
                    <div key={tx.id} className="flex justify-between items-center text-sm border-b pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-3 ${tx.type === 'earned' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <div>
                          <p className="font-medium text-slate-800">{tx.description}</p>
                          <p className="text-xs text-slate-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={`font-mono font-bold ${tx.type === 'earned' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.type === 'earned' ? '+' : '-'}{tx.points}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
      </div>
    </div>
  )
}
