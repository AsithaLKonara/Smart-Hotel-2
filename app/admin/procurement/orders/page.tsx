"use client"

import { useState, useEffect } from 'react'
import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import * as Dialog from '@radix-ui/react-dialog'
import { Plus, FileText, CheckCircle2, Clock, Package, Truck, X } from 'lucide-react'
import toast from 'react-hot-toast'

function ModalShell({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <Dialog.Root open={open} onOpenChange={(o: boolean) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl p-6 z-50 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  APPROVED:         { label: 'Approved',  className: 'bg-emerald-500/20 text-emerald-400', icon: <CheckCircle2 className="w-3 h-3" /> },
  PENDING_APPROVAL: { label: 'Pending',   className: 'bg-amber-500/20 text-amber-400',   icon: <Clock className="w-3 h-3" /> },
  DELIVERED:        { label: 'Delivered', className: 'bg-blue-500/20 text-blue-400',      icon: <Package className="w-3 h-3" /> },
  SHIPPED:          { label: 'Shipped',   className: 'bg-violet-500/20 text-violet-400',  icon: <Truck className="w-3 h-3" /> },
}

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const [formData, setFormData] = useState({
    vendorId: '', expectedDate: '', notes: '',
    orderItems: [{ itemId: '', quantity: 1, unitPrice: 0 }]
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [or, vr, ir] = await Promise.all([
        fetch('/api/admin/procurement/orders'),
        fetch('/api/admin/procurement/vendors'),
        fetch('/api/admin/procurement/items')
      ])
      if (or.ok) setOrders(await or.json())
      if (vr.ok) setVendors(await vr.json())
      if (ir.ok) setItems(await ir.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.orderItems]
    newItems[index] = { ...newItems[index], [field]: value }
    if (field === 'itemId') {
      const found = items.find(i => i.id === value)
      if (found) newItems[index].unitPrice = found.unitPrice
    }
    setFormData({ ...formData, orderItems: newItems })
  }

  const removeItemRow = (index: number) => {
    if (formData.orderItems.length === 1) return
    setFormData({ ...formData, orderItems: formData.orderItems.filter((_, i) => i !== index) })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/procurement/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: formData.vendorId,
          expectedDate: formData.expectedDate || undefined,
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
        setShowModal(false)
        setFormData({ vendorId: '', expectedDate: '', notes: '', orderItems: [{ itemId: '', quantity: 1, unitPrice: 0 }] })
        fetchData()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to create PO")
      }
    } catch { toast.error("Error submitting form") }
  }

  const orderTotal = formData.orderItems.reduce((acc, curr) => acc + (Number(curr.quantity) * Number(curr.unitPrice)), 0)

  return (
    <AdminPageShell title="Purchase Orders" subtitle="Draft and track supplier purchase orders." onRefresh={fetchData}>

      <div className="flex justify-end mb-8">
        <Button onClick={() => setShowModal(true)} className="bg-primary text-white">
          <Plus className="w-4 h-4 mr-2" /> Create PO
        </Button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><PremiumSpinner /></div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm text-white">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="p-4 text-white/50 text-xs uppercase">PO Number</th>
                <th className="p-4 text-white/50 text-xs uppercase">Vendor</th>
                <th className="p-4 text-white/50 text-xs uppercase">Date</th>
                <th className="p-4 text-white/50 text-xs uppercase">Expected</th>
                <th className="p-4 text-white/50 text-xs uppercase text-right">Total</th>
                <th className="p-4 text-white/50 text-xs uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {orders.map(order => {
                const st = STATUS_CONFIG[order.status]
                return (
                  <tr key={order.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-white/40" />
                        </div>
                        <span className="font-mono text-sm">{order.orderNumber}</span>
                      </div>
                    </td>
                    <td className="p-4 text-white/70">{order.vendor?.name}</td>
                    <td className="p-4 text-white/50 text-xs">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-white/50 text-xs">{order.expectedDate ? new Date(order.expectedDate).toLocaleDateString() : '—'}</td>
                    <td className="p-4 font-bold text-right text-emerald-400">${order.totalAmount.toFixed(2)}</td>
                    <td className="p-4">
                      {st ? (
                        <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded ${st.className}`}>
                          {st.icon} {st.label}
                        </span>
                      ) : (
                        <span className="text-white/40 text-xs">{order.status}</span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {orders.length === 0 && (
                <tr><td colSpan={6} className="p-12 text-center text-white/40">No purchase orders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <ModalShell open={showModal} onClose={() => setShowModal(false)} title="Draft Purchase Order">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-2 block">Vendor</label>
              <select required value={formData.vendorId} onChange={e => setFormData({ ...formData, vendorId: e.target.value })}
                className="w-full bg-[#1a1a24] border border-white/10 rounded-lg p-2.5 text-sm text-white">
                <option value="">Select vendor...</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-2 block">Expected Delivery</label>
              <Input type="date" value={formData.expectedDate} onChange={e => setFormData({ ...formData, expectedDate: e.target.value })} className="bg-[#1a1a24] border-white/10 text-white" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-2 block">Notes</label>
              <Input value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="bg-[#1a1a24] border-white/10 text-white" placeholder="Optional instructions..." />
            </div>
          </div>

          <div className="border border-white/10 rounded-xl p-4 bg-white/[0.02]">
            <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Order Lines</h4>
            {formData.orderItems.map((item, idx) => (
              <div key={idx} className="flex gap-3 mb-3 items-end">
                <div className="flex-1">
                  {idx === 0 && <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Item</label>}
                  <select required value={item.itemId} onChange={e => handleItemChange(idx, 'itemId', e.target.value)}
                    className="w-full bg-[#1a1a24] border border-white/10 rounded-lg p-2 text-sm text-white">
                    <option value="">Select item...</option>
                    {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </div>
                <div className="w-20">
                  {idx === 0 && <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Qty</label>}
                  <Input type="number" min="1" required value={item.quantity}
                    onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                    className="bg-[#1a1a24] border-white/10 text-white text-center" />
                </div>
                <div className="w-28">
                  {idx === 0 && <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Unit Price</label>}
                  <Input type="number" step="0.01" required value={item.unitPrice}
                    onChange={e => handleItemChange(idx, 'unitPrice', e.target.value)}
                    className="bg-[#1a1a24] border-white/10 text-white font-mono text-sm" />
                </div>
                <button type="button" onClick={() => removeItemRow(idx)}
                  className="text-white/30 hover:text-rose-400 transition-colors mb-1 flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm"
              onClick={() => setFormData({ ...formData, orderItems: [...formData.orderItems, { itemId: '', quantity: 1, unitPrice: 0 }] })}
              className="border-white/10 text-white hover:bg-white/5 mt-2">
              <Plus className="w-3 h-3 mr-1" /> Add Line
            </Button>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/10">
            <div className="text-white">
              <span className="text-white/50 text-sm">Total: </span>
              <span className="text-xl font-bold text-primary">${orderTotal.toFixed(2)}</span>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit" className="bg-primary text-white">Submit for Approval</Button>
            </div>
          </div>
        </form>
      </ModalShell>

    </AdminPageShell>
  )
}
