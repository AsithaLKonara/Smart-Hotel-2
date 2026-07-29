"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Globe, ArrowRightLeft, ShieldCheck, Link as LinkIcon, Zap, Loader2 } from 'lucide-react'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import toast from 'react-hot-toast'

async function generateHMAC(secret: string, data: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export default function ChannelManagerDashboard() {
  const queryClient = useQueryClient()

  // Fetch config and mappings
  const { data: config, isLoading } = useQuery({
    queryKey: ['channel-config'],
    queryFn: async () => {
      const res = await fetch('/api/channels/config')
      return res.json()
    }
  })

  // Simulate incoming Webhook
  const simulateWebhook = useMutation({
    mutationFn: async () => {
      // Mock payload
      const payload = {
        otaRoomTypeId: 'BCOM_DLX', // We know this is seeded
        guestName: 'Jane Doe (OTA)',
        guestEmail: `jane.ota.${Math.floor(Math.random() * 1000)}@example.com`,
        checkIn: new Date().toISOString(),
        checkOut: new Date(Date.now() + 86400000 * 2).toISOString(), // +2 days
        totalAmount: 350.00
      }
      const payloadString = JSON.stringify(payload)
      const signature = await generateHMAC('dev_ota_secret', payloadString)
      
      const res = await fetch('/api/channels/webhook', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-ota-signature': signature
        },
        body: payloadString
      })
      if (!res.ok) throw new Error('Webhook processing failed')
      return res.json()
    },
    onSuccess: (data) => {
      toast.success(`Booking created! Conf: ${data.confirmationCode}`)
      queryClient.invalidateQueries({ queryKey: ['channel-config'] })
    },
    onError: (err: any) => {
      toast.error(err.message)
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <PremiumSpinner size="lg" text="Connecting to OTAs..." />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif text-slate-900 tracking-tight flex items-center">
            <Globe className="w-8 h-8 mr-3 text-primary" /> Channel Manager
          </h1>
          <p className="text-slate-500 mt-2">Manage OTA mappings and monitor real-time webhook syncs.</p>
        </div>
        <Button 
          className="bg-indigo-600 hover:bg-indigo-700 shadow-sm"
          disabled={simulateWebhook.isPending}
          onClick={() => simulateWebhook.mutate()}
        >
          {simulateWebhook.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
          Simulate Booking.com Webhook
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Connected Channels List */}
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <CardTitle className="text-base flex items-center">
                <ShieldCheck className="w-4 h-4 mr-2 text-emerald-600" /> Active Connections
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {config?.channels?.map((channel: any) => (
                <div key={channel.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center text-blue-800 font-bold mr-3">
                      {channel.provider.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{channel.provider}</h4>
                      <p className="text-xs text-slate-500 font-mono mt-1 blur-[2px] hover:blur-none transition-all">
                        {channel.apiKey}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Live</Badge>
                </div>
              ))}
              {config?.channels?.length === 0 && (
                <p className="text-sm text-slate-500 text-center">No channels connected.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Room Mappings */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm h-full">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <CardTitle className="text-base flex items-center">
                <ArrowRightLeft className="w-4 h-4 mr-2 text-primary" /> Room Type Mappings
              </CardTitle>
              <CardDescription>How OTA room codes map to internal SmartHotel inventory.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {config?.mappings?.map((mapping: any) => (
                  <div key={mapping.id} className="flex flex-col sm:flex-row items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition-colors">
                    
                    {/* OTA Side */}
                    <div className="flex-1 w-full text-center sm:text-left bg-slate-100 p-3 rounded-lg border border-slate-200">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-1">External Channel</div>
                      <div className="font-mono font-bold text-slate-800">{mapping.otaRoomTypeId}</div>
                      <div className="text-xs text-slate-500 mt-1">Rate: {mapping.otaRatePlanId || 'Standard'}</div>
                    </div>

                    <div className="px-4 py-2 text-slate-400">
                      <LinkIcon className="w-5 h-5 hidden sm:block" />
                    </div>

                    {/* PMS Side */}
                    <div className="flex-1 w-full text-center sm:text-right bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                      <div className="text-xs font-semibold text-indigo-500 uppercase mb-1">SmartHotel PMS</div>
                      <div className="font-bold text-indigo-900">{mapping.localRoomName}</div>
                      <div className="text-xs text-indigo-600 font-semibold mt-1 flex justify-center sm:justify-end items-center">
                        Markup: +{mapping.priceMarkupPercentage}%
                      </div>
                    </div>

                  </div>
                ))}
                
                {config?.mappings?.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    No mappings configured. Webhooks will fail.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
