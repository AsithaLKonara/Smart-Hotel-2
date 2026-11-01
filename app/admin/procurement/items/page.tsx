"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Plus, Package, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell'
import { ProcurementNavigation } from '@/components/dashboard/admin/procurement-navigation'

export default function ItemsPage() {
  const [items, setItems] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'FOOD',
    unit: 'KG',
    unitPrice: 0,
    parLevel: 10,
    vendorId: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [itemsRes, vendorsRes] = await Promise.all([
        fetch('/api/admin/procurement/items'),
        fetch('/api/admin/procurement/vendors')
      ])
      if (itemsRes.ok) setItems(await itemsRes.json())
      if (vendorsRes.ok) setVendors(await vendorsRes.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/procurement/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...formData,
            unitPrice: parseFloat(formData.unitPrice.toString()),
            parLevel: parseInt(formData.parLevel.toString())
        })
      })
      if (res.ok) {
        toast.success("Item added")
        setShowForm(false)
        fetchData()
      } else {
        toast.error("Failed to add item")
      }
    } catch (e) {
      toast.error("Error submitting form")
    }
  }

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8" /></div>

  return (
    <AdminPageShell title="Catalog Items" subtitle="Manage the global catalog of procurement items." onRefresh={fetchData}>
      <ProcurementNavigation />

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-serif text-foreground dark:text-white">Master Inventory</h1>
          <p className="text-muted-foreground dark:text-slate-400">Track items and stock levels</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> New Item
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8 bg-card dark:bg-[#1a1a1a] border border-border dark:border-white/10 text-foreground dark:text-white shadow-md">
          <CardHeader>
            <CardTitle className="text-foreground dark:text-white">Add New Item</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground dark:text-slate-400">Item Name</label>
                  <input required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full p-2 rounded bg-background dark:bg-black/50 border border-input dark:border-white/10 text-foreground dark:text-white mt-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground dark:text-slate-400">SKU</label>
                  <input value={formData.sku} onChange={e=>setFormData({...formData, sku: e.target.value})} className="w-full p-2 rounded bg-background dark:bg-black/50 border border-input dark:border-white/10 text-foreground dark:text-white mt-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground dark:text-slate-400">Category</label>
                  <select value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="w-full p-2 rounded bg-background dark:bg-black/50 border border-input dark:border-white/10 text-foreground dark:text-white mt-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="FOOD">Food</option>
                    <option value="BEVERAGE">Beverage</option>
                    <option value="LINEN">Linen</option>
                    <option value="MAINTENANCE">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground dark:text-slate-400">Unit of Measure</label>
                  <select value={formData.unit} onChange={e=>setFormData({...formData, unit: e.target.value})} className="w-full p-2 rounded bg-background dark:bg-black/50 border border-input dark:border-white/10 text-foreground dark:text-white mt-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="KG">KG</option>
                    <option value="LITER">Liter</option>
                    <option value="PIECE">Piece</option>
                    <option value="BOX">Box</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground dark:text-slate-400">Unit Price</label>
                  <input type="number" step="0.01" required value={formData.unitPrice} onChange={e=>setFormData({...formData, unitPrice: parseFloat(e.target.value)})} className="w-full p-2 rounded bg-background dark:bg-black/50 border border-input dark:border-white/10 text-foreground dark:text-white mt-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground dark:text-slate-400">Par Level (Min Stock)</label>
                  <input type="number" required value={formData.parLevel} onChange={e=>setFormData({...formData, parLevel: parseInt(e.target.value)})} className="w-full p-2 rounded bg-background dark:bg-black/50 border border-input dark:border-white/10 text-foreground dark:text-white mt-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground dark:text-slate-400">Preferred Vendor</label>
                  <select value={formData.vendorId} onChange={e=>setFormData({...formData, vendorId: e.target.value})} className="w-full p-2 rounded bg-background dark:bg-black/50 border border-input dark:border-white/10 text-foreground dark:text-white mt-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="">Select Vendor...</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-sm">Save Item</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="bg-card dark:bg-[#1a1a1a] border border-border dark:border-white/10 rounded-xl overflow-hidden shadow-md">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/60 dark:bg-white/5 border-b border-border dark:border-white/10">
            <tr>
              <th className="p-4 font-medium text-foreground dark:text-white">Item</th>
              <th className="p-4 font-medium text-muted-foreground dark:text-slate-400">Category</th>
              <th className="p-4 font-medium text-muted-foreground dark:text-slate-400">Unit</th>
              <th className="p-4 font-medium text-muted-foreground dark:text-slate-400">Price</th>
              <th className="p-4 font-medium text-muted-foreground dark:text-slate-400">Vendor</th>
              <th className="p-4 font-medium text-muted-foreground dark:text-slate-400">Total Stock</th>
              <th className="p-4 font-medium text-muted-foreground dark:text-slate-400">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border dark:divide-white/5">
            {items.map(item => {
              const totalStock = item.stocks?.reduce((acc: number, stock: any) => acc + stock.quantity, 0) || 0
              const isLowStock = totalStock <= item.parLevel
              
              return (
                <tr key={item.id} className="hover:bg-muted/30 dark:hover:bg-white/5 transition-colors">
                  <td className="p-4 font-medium flex items-center gap-3 text-foreground dark:text-white">
                    <div className="w-8 h-8 rounded bg-muted/60 dark:bg-white/5 flex items-center justify-center text-muted-foreground dark:text-white/60">
                        <Package className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="font-semibold">{item.name}</div>
                        {item.sku && <div className="text-xs text-muted-foreground dark:text-slate-500">{item.sku}</div>}
                    </div>
                  </td>
                  <td className="p-4"><span className="px-2 py-1 bg-muted/60 dark:bg-white/5 rounded text-xs text-foreground/80 dark:text-slate-300">{item.category}</span></td>
                  <td className="p-4 text-foreground/80 dark:text-slate-300">{item.unit}</td>
                  <td className="p-4 text-foreground/80 dark:text-slate-300">${Number(item.unitPrice).toFixed(2)}</td>
                  <td className="p-4 text-foreground/80 dark:text-slate-300">{item.vendor?.name || '-'}</td>
                  <td className="p-4 font-bold text-foreground dark:text-white">{totalStock}</td>
                  <td className="p-4">
                    {isLowStock ? (
                        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-500 text-xs font-bold">
                            <AlertTriangle className="w-3 h-3" /> LOW STOCK
                        </div>
                    ) : (
                        <span className="text-emerald-600 dark:text-emerald-500 text-xs font-bold">HEALTHY</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {items.length === 0 && !loading && (
          <div className="p-12 text-center text-muted-foreground dark:text-slate-500">No items in inventory.</div>
        )}
      </div>
    </AdminPageShell>
  )
}
