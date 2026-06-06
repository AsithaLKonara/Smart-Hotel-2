"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Plus, Award, Star } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoyaltyPage() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  const [formData, setFormData] = useState({
    accountId: '',
    points: 0,
    description: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/corporate/loyalty')
      if (res.ok) setAccounts(await res.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/corporate/loyalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        toast.success("Transaction processed")
        setShowForm(false)
        fetchData()
      } else {
        toast.error("Failed to process transaction")
      }
    } catch (e) {
      toast.error("Error submitting form")
    }
  }

  const getTierColor = (tier: string) => {
      switch(tier) {
          case 'PLATINUM': return 'text-slate-100 bg-slate-100/10 border-slate-100/30'
          case 'GOLD': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
          default: return 'text-slate-400 bg-slate-400/10 border-slate-400/30'
      }
  }

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8" /></div>

  return (
    <div className="p-6 text-white max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-serif">Loyalty Program</h1>
          <p className="text-slate-400">Manage VIP guests, tiers, and points</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" /> Issue Points
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8 bg-[#1a1a1a] border-white/10 text-white">
          <CardHeader>
            <CardTitle>Manual Points Adjustment</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs text-slate-400">Select Member</label>
                  <select required value={formData.accountId} onChange={e=>setFormData({...formData, accountId: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1">
                    <option value="">Select Member...</option>
                    {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.user?.name} ({acc.user?.email}) - {acc.points} pts</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Points (+ to add, - to deduct)</label>
                  <input type="number" required value={formData.points} onChange={e=>setFormData({...formData, points: parseInt(e.target.value)})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Reason / Description</label>
                  <input required value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" placeholder="e.g. Service recovery" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">Process Transaction</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="p-4 font-medium">Member</th>
              <th className="p-4 font-medium text-slate-400">Current Tier</th>
              <th className="p-4 font-medium text-slate-400 text-right">Available Points</th>
              <th className="p-4 font-medium text-slate-400 text-right">Lifetime Earned</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {accounts.map(acc => (
              <tr key={acc.id} className="hover:bg-white/5">
                <td className="p-4 font-medium flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Star className="w-4 h-4" />
                  </div>
                  <div>
                      <div>{acc.user?.name}</div>
                      <div className="text-xs text-slate-500">{acc.user?.email}</div>
                  </div>
                </td>
                <td className="p-4">
                    <span className={`px-2 py-1 rounded border text-xs font-bold tracking-widest ${getTierColor(acc.tier)}`}>
                        {acc.tier}
                    </span>
                </td>
                <td className="p-4 text-right font-bold text-lg text-indigo-400">
                    {acc.points.toLocaleString()}
                </td>
                <td className="p-4 text-right text-slate-400">
                    {acc.totalEarned.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {accounts.length === 0 && !loading && (
          <div className="p-12 text-center text-slate-500">No loyalty accounts found. Ensure users have been migrated or assigned points.</div>
        )}
      </div>
    </div>
  )
}
