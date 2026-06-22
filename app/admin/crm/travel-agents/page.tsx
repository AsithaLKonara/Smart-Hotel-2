'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Plane, Users, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function TravelAgentCRMPage() {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAgents = () => {
    fetch('/api/admin/crm/travel-agents')
      .then(res => res.json())
      .then(data => {
        if (data.agents) setAgents(data.agents)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchAgents()
  }, [])

  const handleCreate = () => {
    const agencyName = prompt('Agency Name:')
    if (!agencyName) return
    const iataNumber = prompt('IATA Number:')
    const contactName = prompt('Contact Name:')
    const contactEmail = prompt('Contact Email:')
    const contactPhone = prompt('Contact Phone:')
    const commissionRate = prompt('Commission Rate (e.g. 10 for 10%):')

    fetch('/api/admin/crm/travel-agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agencyName, iataNumber, contactName, contactEmail, contactPhone, commissionRate })
    }).then(() => fetchAgents())
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Plane className="w-6 h-6 text-primary" /> Travel Agents
        </h1>
        <Button onClick={handleCreate} className="bg-primary text-white flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Agent
        </Button>
      </div>
      
      {loading ? (
        <div className="text-white/50">Loading agents...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent: any) => (
            <Card key={agent.id} className="bg-[#1a1a1a] border-white/10 hover:border-white/30 transition-colors">
              <CardContent className="p-5 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Plane className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-white">{agent.agencyName}</h3>
                  </div>
                  {agent.commissionRate && (
                    <span className="bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded text-xs font-bold">
                        {agent.commissionRate}% Comm
                    </span>
                  )}
                </div>
                {agent.iataNumber && <p className="text-xs text-white/40">IATA: {agent.iataNumber}</p>}
                <p className="text-sm text-white/50">{agent.contactName} • {agent.contactEmail}</p>
                <div className="flex items-center gap-2 mt-2 pt-4 border-t border-white/10">
                  <Users className="w-4 h-4 text-white/40" />
                  <span className="text-sm text-white/70">{agent._count?.users || 0} Sub-agents</span>
                </div>
              </CardContent>
            </Card>
          ))}
          {agents.length === 0 && (
            <div className="text-white/50 p-8 bg-white/5 rounded-xl border-2 border-dashed border-white/10 text-center col-span-full">
              No travel agents found.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
