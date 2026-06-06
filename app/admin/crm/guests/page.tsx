'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function GuestCRMPage() {
  const [guests, setGuests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/crm/guests')
      .then(res => res.json())
      .then(data => {
        if (data.guests) setGuests(data.guests)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Guest CRM & Profiles</h1>
      
      {loading ? (
        <div className="text-white/50">Loading guests...</div>
      ) : (
        <div className="grid gap-4">
          {guests.map((guest: any) => (
            <Card key={guest.id} className="bg-[#1a1a1a] border-white/10">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white">{guest.name}</h3>
                  <p className="text-sm text-white/50">{guest.email}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant={guest.vipStatus === 'STANDARD' ? 'outline' : 'default'} className="bg-primary/20 text-primary border-primary/30">
                    {guest.vipStatus}
                  </Badge>
                  {guest.blacklistStatus && (
                    <Badge variant="destructive">Blacklisted</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {guests.length === 0 && (
            <div className="text-white/50 p-4 bg-white/5 rounded-xl border border-white/5 text-center">
              No guests found.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
