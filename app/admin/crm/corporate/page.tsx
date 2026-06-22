'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CorporateCRMPage() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAccounts = () => {
    fetch('/api/admin/crm/corporate')
      .then(res => res.json())
      .then(data => {
        if (data.accounts) setAccounts(data.accounts)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  const handleCreate = () => {
    const companyName = prompt('Company Name:')
    if (!companyName) return
    const contactName = prompt('Contact Name:')
    const contactEmail = prompt('Contact Email:')
    const contactPhone = prompt('Contact Phone:')
    const negotiatedRate = prompt('Negotiated Discount Rate (e.g. 20 for 20%):')

    fetch('/api/admin/crm/corporate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName, contactName, contactEmail, contactPhone, negotiatedRate })
    }).then(() => fetchAccounts())
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" /> Corporate & B2B Accounts
        </h1>
        <Button onClick={handleCreate} className="bg-primary text-white flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Account
        </Button>
      </div>
      
      {loading ? (
        <div className="text-white/50">Loading accounts...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account: any) => (
            <Card key={account.id} className="bg-[#1a1a1a] border-white/10 hover:border-white/30 transition-colors">
              <CardContent className="p-5 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-white">{account.companyName}</h3>
                  </div>
                  {account.negotiatedRate && (
                    <span className="bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded text-xs font-bold">
                        {account.negotiatedRate}% Off
                    </span>
                  )}
                </div>
                <p className="text-sm text-white/50">{account.contactName} • {account.contactEmail}</p>
                <div className="flex items-center gap-2 mt-2 pt-4 border-t border-white/10">
                  <Users className="w-4 h-4 text-white/40" />
                  <span className="text-sm text-white/70">{account._count?.users || 0} Registered Employees</span>
                </div>
              </CardContent>
            </Card>
          ))}
          {accounts.length === 0 && (
            <div className="text-white/50 p-8 bg-white/5 rounded-xl border-2 border-dashed border-white/10 text-center col-span-full">
              No corporate accounts found.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
