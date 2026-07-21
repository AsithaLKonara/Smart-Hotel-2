'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Wrench, CheckCircle, Clock, AlertCircle, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

export default function MaintenanceTickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [newTicket, setNewTicket] = useState({
    issue: '',
    roomId: '',
    priority: 'medium'
  })

  const fetchTickets = () => {
    fetch('/api/admin/maintenance/tickets')
      .then(res => res.json())
      .then(data => {
        if (data.tickets) setTickets(data.tickets)
      })
      .catch(() => toast.error('Failed to load maintenance tickets'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  const updateStatus = (id: string, status: string) => {
    fetch('/api/admin/maintenance/tickets', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          toast.success(`Ticket marked as ${status.replace('_', ' ')}`)
          fetchTickets()
        } else {
          toast.error(data.error || 'Failed to update ticket')
        }
      })
  }

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTicket.issue) return toast.error('Please describe the issue')

    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/maintenance/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicket)
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Maintenance ticket created!')
        setShowModal(false)
        setNewTicket({ issue: '', roomId: '', priority: 'medium' })
        fetchTickets()
      } else {
        toast.error(data.error || 'Failed to create ticket')
      }
    } catch (err: any) {
      toast.error('Error creating ticket')
    } finally {
      setSubmitting(false)
    }
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
        <Button onClick={() => setShowModal(true)} className="bg-primary hover:bg-primary/90 text-white font-bold gap-2 text-xs">
          <Plus className="w-4 h-4" /> Create Work Order
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tickets.map((ticket: any) => {
          const statusStr = (ticket.status || 'pending').toLowerCase()
          return (
            <Card key={ticket.id} className={`bg-[#1a1a1a] border-white/10 ${statusStr === 'resolved' ? 'opacity-50' : ''}`}>
              <CardContent className="p-5 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-lg">{ticket.title || 'Maintenance Request'}</h3>
                    <p className="text-sm text-white/50 mt-1">{ticket.description}</p>
                  </div>
                  {ticket.priority === 'urgent' && statusStr !== 'resolved' && (
                    <AlertCircle className="w-5 h-5 text-red-500 animate-pulse" />
                  )}
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  {ticket.room && (
                    <Badge variant="outline" className="bg-white/5">Room {ticket.room.number}</Badge>
                  )}
                  <Badge variant={ticket.priority === 'urgent' ? 'destructive' : 'secondary'}>
                    {ticket.priority || 'medium'}
                  </Badge>
                  <Badge variant="outline" className={`
                    ${statusStr === 'pending' || statusStr === 'open' ? 'text-yellow-500 border-yellow-500/30' : ''}
                    ${statusStr === 'in_progress' ? 'text-blue-500 border-blue-500/30' : ''}
                    ${statusStr === 'resolved' ? 'text-green-500 border-green-500/30' : ''}
                  `}>
                    {statusStr.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="text-xs text-white/40 flex items-center gap-1 mt-2">
                  <Clock className="w-3 h-3" /> Reported: {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'N/A'}
                </div>

                {statusStr !== 'resolved' && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                    {(statusStr === 'pending' || statusStr === 'open') && (
                      <button onClick={() => updateStatus(ticket.id, 'in_progress')} className="flex-1 text-sm bg-blue-500/20 text-blue-400 py-2 rounded hover:bg-blue-500/30 font-semibold">
                        Start Work
                      </button>
                    )}
                    {statusStr === 'in_progress' && (
                      <button onClick={() => updateStatus(ticket.id, 'resolved')} className="flex-1 text-sm bg-green-500/20 text-green-400 py-2 rounded hover:bg-green-500/30 font-semibold flex justify-center items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Mark Resolved
                      </button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}

        {tickets.length === 0 && !loading && (
          <div className="col-span-full p-8 text-center text-white/40 border-2 border-dashed border-white/10 rounded-xl">
            No maintenance tickets found.
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Maintenance Work Order">
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">
              Issue Description *
            </label>
            <Input
              value={newTicket.issue}
              onChange={(e) => setNewTicket({ ...newTicket, issue: e.target.value })}
              placeholder="e.g. AC leaking in Room 204"
              className="bg-black/40 border-white/10 text-white text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">
                Priority
              </label>
              <select
                value={newTicket.priority}
                onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)} className="text-slate-400">
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="bg-primary text-white font-bold">
              {submitting ? 'Creating...' : 'Create Ticket'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
