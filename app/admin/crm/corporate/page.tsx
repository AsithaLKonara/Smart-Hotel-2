'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users } from 'lucide-react'

export default function CorporateCRMPage() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/crm/corporate')
      .then(res => res.json())
      .then(data => {
        if (data.accounts) setAccounts(data.accounts)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Corporate & B2B Accounts</h1>
      
      {loading ? (
        <div className="text-white/50">Loading accounts...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account: any) => (
            <Card key={account.id} className="bg-[#1a1a1a] border-white/10">
              <CardContent className="p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-white">{account.companyName}</h3>
                </div>
                <p className="text-sm text-white/50">{account.contactName} • {account.contactEmail}</p>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10">
                  <Users className="w-4 h-4 text-white/40" />
                  <span className="text-sm text-white/70">{account._count?.users || 0} Employees</span>
                  {account.negotiatedRate && (
                    <span className="ml-auto text-sm text-primary font-bold">{account.negotiatedRate}% Rate</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {accounts.length === 0 && (
            <div className="text-white/50 p-4 bg-white/5 rounded-xl border border-white/5 text-center col-span-full">
              No corporate accounts found.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
