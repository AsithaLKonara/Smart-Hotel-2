"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Plus, Package, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

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
    <div className="p-6 text-white max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-serif">Master Inventory</h1>
          <p className="text-slate-400">Track items and stock levels</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" /> New Item
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8 bg-[#1a1a1a] border-white/10 text-white">
          <CardHeader>
            <CardTitle>Add New Item</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2">
                  <label className="text-xs text-slate-400">Item Name</label>
                  <input required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">SKU</label>
                  <input value={formData.sku} onChange={e=>setFormData({...formData, sku: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Category</label>
                  <select value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1">
                    <option value="FOOD">Food</option>
                    <option value="BEVERAGE">Beverage</option>
                    <option value="LINEN">Linen</option>
                    <option value="MAINTENANCE">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Unit of Measure</label>
                  <select value={formData.unit} onChange={e=>setFormData({...formData, unit: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1">
                    <option value="KG">KG</option>
                    <option value="LITER">Liter</option>
                    <option value="PIECE">Piece</option>
                    <option value="BOX">Box</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Unit Price</label>
                  <input type="number" step="0.01" required value={formData.unitPrice} onChange={e=>setFormData({...formData, unitPrice: parseFloat(e.target.value)})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Par Level (Min Stock)</label>
                  <input type="number" required value={formData.parLevel} onChange={e=>setFormData({...formData, parLevel: parseInt(e.target.value)})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-400">Preferred Vendor</label>
                  <select value={formData.vendorId} onChange={e=>setFormData({...formData, vendorId: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1">
                    <option value="">Select Vendor...</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">Save Item</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="p-4 font-medium">Item</th>
              <th className="p-4 font-medium text-slate-400">Category</th>
              <th className="p-4 font-medium text-slate-400">Unit</th>
              <th className="p-4 font-medium text-slate-400">Price</th>
              <th className="p-4 font-medium text-slate-400">Vendor</th>
              <th className="p-4 font-medium text-slate-400">Total Stock</th>
              <th className="p-4 font-medium text-slate-400">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {items.map(item => {
              const totalStock = item.stocks?.reduce((acc: number, stock: any) => acc + stock.quantity, 0) || 0
              const isLowStock = totalStock <= item.parLevel
              
              return (
                <tr key={item.id} className="hover:bg-white/5">
                  <td className="p-4 font-medium flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center">
                        <Package className="w-4 h-4" />
                    </div>
                    <div>
                        {item.name}
                        {item.sku && <div className="text-xs text-slate-500">{item.sku}</div>}
                    </div>
                  </td>
                  <td className="p-4"><span className="px-2 py-1 bg-white/5 rounded text-xs">{item.category}</span></td>
                  <td className="p-4 text-slate-300">{item.unit}</td>
                  <td className="p-4 text-slate-300">${item.unitPrice.toFixed(2)}</td>
                  <td className="p-4 text-slate-300">{item.vendor?.name || '-'}</td>
                  <td className="p-4 font-bold">{totalStock}</td>
                  <td className="p-4">
                    {isLowStock ? (
                        <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                            <AlertTriangle className="w-3 h-3" /> LOW STOCK
                        </div>
                    ) : (
                        <span className="text-emerald-500 text-xs font-bold">HEALTHY</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {items.length === 0 && !loading && (
          <div className="p-12 text-center text-slate-500">No items in inventory.</div>
        )}
      </div>
    </div>
  )
}
