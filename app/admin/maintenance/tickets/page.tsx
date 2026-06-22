'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Wrench, CheckCircle, Clock, AlertCircle } from 'lucide-react'

export default function MaintenanceTickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTickets = () => {
    fetch('/api/admin/maintenance/tickets')
      .then(res => res.json())
      .then(data => {
        if (data.tickets) setTickets(data.tickets)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  const updateStatus = (id: string, status: string) => {
    fetch('/api/admin/maintenance/tickets', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    }).then(() => fetchTickets())
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Wrench className="w-6 h-6 text-primary" /> Maintenance Work Orders
          </h1>
          <p className="text-white/60 text-sm">Track and resolve engineering tickets across the property.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tickets.map((ticket: any) => (
          <Card key={ticket.id} className={`bg-[#1a1a1a] border-white/10 ${ticket.status === 'resolved' ? 'opacity-50' : ''}`}>
            <CardContent className="p-5 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-white text-lg">{ticket.title}</h3>
                  <p className="text-sm text-white/50 mt-1">{ticket.description}</p>
                </div>
                {ticket.priority === 'urgent' && ticket.status !== 'resolved' && (
                  <AlertCircle className="w-5 h-5 text-red-500 animate-pulse" />
                )}
              </div>
              
              <div className="flex gap-2 flex-wrap">
                {ticket.room && (
                  <Badge variant="outline" className="bg-white/5">Room {ticket.room.number}</Badge>
                )}
                <Badge variant={ticket.priority === 'urgent' ? 'destructive' : 'secondary'}>
                  {ticket.priority}
                </Badge>
                <Badge variant="outline" className={`
                  ${ticket.status === 'pending' ? 'text-yellow-500 border-yellow-500/30' : ''}
                  ${ticket.status === 'in_progress' ? 'text-blue-500 border-blue-500/30' : ''}
                  ${ticket.status === 'resolved' ? 'text-green-500 border-green-500/30' : ''}
                `}>
                  {ticket.status.replace('_', ' ')}
                </Badge>
              </div>

              <div className="text-xs text-white/40 flex items-center gap-1 mt-2">
                <Clock className="w-3 h-3" /> Reported: {new Date(ticket.createdAt).toLocaleDateString()}
              </div>

              {ticket.status !== 'resolved' && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                  {ticket.status === 'pending' && (
                    <button onClick={() => updateStatus(ticket.id, 'in_progress')} className="flex-1 text-sm bg-blue-500/20 text-blue-400 py-2 rounded hover:bg-blue-500/30">
                      Start Work
                    </button>
                  )}
                  {ticket.status === 'in_progress' && (
                    <button onClick={() => updateStatus(ticket.id, 'resolved')} className="flex-1 text-sm bg-green-500/20 text-green-400 py-2 rounded hover:bg-green-500/30 flex justify-center items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Mark Resolved
                    </button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {tickets.length === 0 && !loading && (
          <div className="col-span-full p-8 text-center text-white/40 border-2 border-dashed border-white/10 rounded-xl">
            No maintenance tickets found.
          </div>
        )}
      </div>
    </div>
  )
}
