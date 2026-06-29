"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Plus, FileText, CheckCircle2, Clock, Ban, Package } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  const [formData, setFormData] = useState({
    vendorId: '',
    expectedDate: '',
    notes: '',
    orderItems: [{ itemId: '', quantity: 1, unitPrice: 0 }]
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [ordersRes, vendorsRes, itemsRes] = await Promise.all([
        fetch('/api/admin/procurement/orders'),
        fetch('/api/admin/procurement/vendors'),
        fetch('/api/admin/procurement/items')
      ])
      if (ordersRes.ok) setOrders(await ordersRes.json())
      if (vendorsRes.ok) setVendors(await vendorsRes.json())
      if (itemsRes.ok) setItems(await itemsRes.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.orderItems]
    newItems[index] = { ...newItems[index], [field]: value }
    
    // Auto fill unit price if item selected
    if (field === 'itemId') {
        const selectedItem = items.find(i => i.id === value)
        if (selectedItem) {
            newItems[index].unitPrice = selectedItem.unitPrice
        }
    }
    setFormData({ ...formData, orderItems: newItems })
  }

  const addItemRow = () => {
      setFormData({
          ...formData,
          orderItems: [...formData.orderItems, { itemId: '', quantity: 1, unitPrice: 0 }]
      })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/procurement/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            vendorId: formData.vendorId,
            expectedDate: formData.expectedDate,
            notes: formData.notes,
            items: formData.orderItems.map(i => ({
                itemId: i.itemId,
                quantity: parseInt(i.quantity.toString()),
                unitPrice: parseFloat(i.unitPrice.toString())
            }))
        })
      })
      if (res.ok) {
        toast.success("Purchase Order created")
        setShowForm(false)
        setFormData({ vendorId: '', expectedDate: '', notes: '', orderItems: [{ itemId: '', quantity: 1, unitPrice: 0 }] })
        fetchData()
      } else {
        toast.error("Failed to create PO")
      }
    } catch (e) {
      toast.error("Error submitting form")
    }
  }

  const getStatusBadge = (status: string) => {
      switch (status) {
          case 'APPROVED': return <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded"><CheckCircle2 className="w-3 h-3"/> APPROVED</span>
          case 'PENDING_APPROVAL': return <span className="flex items-center gap-1 text-amber-400 text-xs font-bold bg-amber-500/10 px-2 py-1 rounded"><Clock className="w-3 h-3"/> PENDING</span>
          case 'DELIVERED': return <span className="flex items-center gap-1 text-blue-400 text-xs font-bold bg-blue-500/10 px-2 py-1 rounded"><Package className="w-3 h-3"/> DELIVERED</span>
          default: return <span className="text-slate-400 text-xs">{status}</span>
      }
  }

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8" /></div>

  return (
    <div className="p-6 text-white max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-serif">Purchase Orders</h1>
          <p className="text-slate-400">Request supplies from vendors</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" /> Create PO
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8 bg-[#1a1a1a] border-white/10 text-white">
          <CardHeader>
            <CardTitle>Draft Purchase Order</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400">Vendor</label>
                  <select required value={formData.vendorId} onChange={e=>setFormData({...formData, vendorId: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1">
                    <option value="">Select Vendor...</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Expected Delivery</label>
                  <input type="date" value={formData.expectedDate} onChange={e=>setFormData({...formData, expectedDate: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-400">Notes / Instructions</label>
                  <input value={formData.notes} onChange={e=>setFormData({...formData, notes: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                </div>
              </div>

              <div className="border border-white/10 rounded p-4 bg-black/20">
                  <h4 className="font-bold mb-4">Order Lines</h4>
                  {formData.orderItems.map((item, idx) => (
                      <div key={idx} className="flex gap-4 mb-4 items-end">
                          <div className="flex-1">
                              <label className="text-xs text-slate-400">Item</label>
                              <select required value={item.itemId} onChange={e=>handleItemChange(idx, 'itemId', e.target.value)} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1">
                                  <option value="">Select Item...</option>
                                  {items.filter(i => i.vendorId === formData.vendorId || !formData.vendorId).map(i => (
                                      <option key={i.id} value={i.id}>{i.name}</option>
                                  ))}
                              </select>
                          </div>
                          <div className="w-24">
                              <label className="text-xs text-slate-400">Qty</label>
                              <input type="number" min="1" required value={item.quantity} onChange={e=>handleItemChange(idx, 'quantity', e.target.value)} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                          </div>
                          <div className="w-32">
                              <label className="text-xs text-slate-400">Unit Price</label>
                              <input type="number" step="0.01" required value={item.unitPrice} onChange={e=>handleItemChange(idx, 'unitPrice', e.target.value)} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                          </div>
                      </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addItemRow} className="border-white/10 text-white mt-2">
                      <Plus className="w-3 h-3 mr-1" /> Add Line
                  </Button>
              </div>

              <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/10">
                <div className="text-xl font-bold">
                    Total: ${formData.orderItems.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0).toFixed(2)}
                </div>
                <div className="flex gap-2">
                    <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                    <Button type="submit">Submit for Approval</Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="p-4 font-medium">PO Number</th>
              <th className="p-4 font-medium text-slate-400">Vendor</th>
              <th className="p-4 font-medium text-slate-400">Date</th>
              <th className="p-4 font-medium text-slate-400">Total Amount</th>
              <th className="p-4 font-medium text-slate-400">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {orders.map(order => (
              <tr key={order.id} className="hover:bg-white/5">
                <td className="p-4 font-medium flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                  </div>
                  {order.orderNumber}
                </td>
                <td className="p-4 text-slate-300">{order.vendor?.name}</td>
                <td className="p-4 text-slate-300">{new Date(order.createdAt).toLocaleDateString()}</td>
                <td className="p-4 font-bold">${order.totalAmount.toFixed(2)}</td>
                <td className="p-4">{getStatusBadge(order.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && !loading && (
          <div className="p-12 text-center text-slate-500">No purchase orders found.</div>
        )}
      </div>
    </div>
  )
}
