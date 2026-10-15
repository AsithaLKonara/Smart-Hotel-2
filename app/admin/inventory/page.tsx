"use client"

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useProperty } from '@/contexts/property-context'
import { 
  Package, 
  ShoppingCart, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  Loader2, 
  Save, 
  X, 
  SlidersHorizontal,
  FileText,
  Truck,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  Building2,
  Layers,
  ArrowUpRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell'
import * as Dialog from '@radix-ui/react-dialog'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useLuxuryConfirm } from '@/components/ui/luxury-confirm-dialog'

interface InventoryItem {
  id: string
  name: string
  description?: string
  category: string
  quantity: number
  unit: string
  minQuantity: number
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DISCONTINUED'
  stocks?: any[]
}

const PO_STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  APPROVED:         { label: 'Approved',  className: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30', icon: <CheckCircle2 className="w-3 h-3" /> },
  PENDING_APPROVAL: { label: 'Pending',   className: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',   icon: <Clock className="w-3 h-3" /> },
  DELIVERED:        { label: 'Delivered', className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',      icon: <Package className="w-3 h-3" /> },
  SHIPPED:          { label: 'Shipped',   className: 'bg-violet-500/20 text-violet-400 border border-violet-500/30',  icon: <Truck className="w-3 h-3" /> },
  REJECTED:         { label: 'Rejected',  className: 'bg-red-500/20 text-red-400 border border-red-500/30',        icon: <X className="w-3 h-3" /> },
}

function ModalShell({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <Dialog.Root open={open} onOpenChange={(o: boolean) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl p-6 z-50 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default function UnifiedInventoryPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#0c0c0c]">
        <PremiumSpinner size="lg" text="Loading Inventory & Procurement..." />
      </div>
    }>
      <UnifiedInventoryContent />
    </Suspense>
  )
}

function UnifiedInventoryContent() {
  const { data: session, status: authStatus } = useSession()
  const { activePropertyId } = useProperty()
  const confirm = useLuxuryConfirm()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') === 'orders' ? 'ORDERS' : 'STOCK'

  const [activeTab, setActiveTab] = useState<'STOCK' | 'ORDERS'>(initialTab)

  // =====================
  // STOCK TAB STATE
  // =====================
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loadingItems, setLoadingItems] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  
  // Stock Item Add/Edit Modal
  const [showItemModal, setShowItemModal] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [itemFormData, setItemFormData] = useState({
    name: '',
    description: '',
    category: '',
    quantity: '',
    unit: '',
    minQuantity: '',
    status: 'IN_STOCK'
  })

  // Stock Adjustment Modal
  const [adjustModal, setAdjustModal] = useState<InventoryItem | null>(null)
  const [adjustForm, setAdjustForm] = useState({ newQuantity: '', location: 'Main Storage', reason: 'Manual Count' })
  const [submittingAdjust, setSubmittingAdjust] = useState(false)

  // =====================
  // PROCUREMENT TAB STATE
  // =====================
  const [orders, setOrders] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [procurementCatalog, setProcurementCatalog] = useState<any[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)

  // PO Creation Modal
  const [showPoModal, setShowPoModal] = useState(false)
  const [poFormData, setPoFormData] = useState({
    vendorId: '',
    expectedDate: '',
    notes: '',
    orderItems: [{ itemId: '', quantity: 1, unitPrice: 0 }]
  })

  // Goods Receipt Modal
  const [receiveModal, setReceiveModal] = useState<any>(null)
  const [receiveForm, setReceiveForm] = useState({ targetLocation: 'MAIN_WAREHOUSE', notes: '' })

  // Invoice Registration Modal
  const [invoiceModal, setInvoiceModal] = useState<any>(null)
  const [invoiceForm, setInvoiceForm] = useState({ invoiceNumber: '', amount: '' })

  // 1. Fetch Inventory Items
  const fetchInventory = async () => {
    try {
      setLoadingItems(true)
      const res = await fetch('/api/inventory', {
        headers: { 'x-property-id': activePropertyId || '' }
      })
      if (!res.ok) throw new Error('Failed to fetch inventory')
      const data = await res.json()
      const itemsArray = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : [])
      setItems(itemsArray)
    } catch (error) {
      console.error('Error fetching inventory:', error)
      toast.error('Failed to load inventory items')
    } finally {
      setLoadingItems(false)
    }
  }

  // 2. Fetch Procurement Orders, Vendors & Catalog
  const fetchProcurementData = async () => {
    try {
      setLoadingOrders(true)
      const [ordersRes, vendorsRes, catalogRes] = await Promise.all([
        fetch('/api/admin/procurement/orders'),
        fetch('/api/admin/procurement/vendors'),
        fetch('/api/admin/procurement/items')
      ])
      
      if (ordersRes.ok) {
        const payload = await ordersRes.json()
        setOrders(payload.data || (Array.isArray(payload) ? payload : []))
      }
      if (vendorsRes.ok) {
        const vPayload = await vendorsRes.json()
        setVendors(Array.isArray(vPayload) ? vPayload : (vPayload.data || []))
      }
      if (catalogRes.ok) {
        const cPayload = await catalogRes.json()
        setProcurementCatalog(Array.isArray(cPayload) ? cPayload : (cPayload.items || []))
      }
    } catch (error) {
      console.error('Error fetching procurement data:', error)
      toast.error('Failed to load procurement data')
    } finally {
      setLoadingOrders(false)
    }
  }

  useEffect(() => {
    fetchInventory()
    fetchProcurementData()
  }, [activePropertyId])

  // =====================
  // INVENTORY ITEM ACTIONS
  // =====================
  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (activePropertyId === 'all') {
      toast.error('Please select a specific property to add inventory')
      return
    }

    try {
      const payload = {
        name: itemFormData.name,
        description: itemFormData.description || undefined,
        category: itemFormData.category,
        quantity: parseInt(itemFormData.quantity) || 0,
        unit: itemFormData.unit,
        minQuantity: parseInt(itemFormData.minQuantity) || 0,
        status: itemFormData.status
      }

      const url = editingItem ? `/api/inventory/${editingItem.id}` : '/api/inventory'
      const method = editingItem ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'x-property-id': activePropertyId || ''
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error(editingItem ? 'Failed to update item' : 'Failed to create item')

      toast.success(editingItem ? 'Item updated successfully' : 'Item created successfully')
      setShowItemModal(false)
      setEditingItem(null)
      fetchInventory()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save inventory item')
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    const approved = await confirm({
      title: 'Delete Inventory Item',
      message: 'Are you sure you want to delete this inventory item? Stock tracking for this item will be removed.',
      confirmText: 'Delete Item',
      isDestructive: true
    })
    if (!approved) return

    try {
      const response = await fetch(`/api/inventory/${itemId}`, {
        method: 'DELETE',
        headers: { 'x-property-id': activePropertyId || '' }
      })
      if (!response.ok) throw new Error('Failed to delete item')

      toast.success('Item deleted successfully')
      fetchInventory()
    } catch (error) {
      toast.error('Failed to delete item')
    }
  }

  // Trigger Quick Reorder for low/out of stock items
  const handleQuickReorder = (item: InventoryItem) => {
    const suggestedQty = Math.max(1, (item.minQuantity * 2) - item.quantity)
    // Find matching catalog item if any
    const matchingCatalogItem = procurementCatalog.find(
      c => c.name.toLowerCase() === item.name.toLowerCase()
    )

    setPoFormData({
      vendorId: vendors[0]?.id || '',
      expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: `Reorder replenishment for ${item.name} (Current Stock: ${item.quantity} ${item.unit}, Min Threshold: ${item.minQuantity})`,
      orderItems: [
        {
          itemId: matchingCatalogItem?.id || procurementCatalog[0]?.id || '',
          quantity: suggestedQty,
          unitPrice: matchingCatalogItem?.unitPrice || 10
        }
      ]
    })

    setActiveTab('ORDERS')
    setShowPoModal(true)
    toast.success(`Started Purchase Order for ${item.name}`)
  }

  // =====================
  // PROCUREMENT PO ACTIONS
  // =====================
  const handlePoItemChange = (index: number, field: string, value: any) => {
    const updated = [...poFormData.orderItems]
    updated[index] = { ...updated[index], [field]: value }
    if (field === 'itemId') {
      const found = procurementCatalog.find(i => i.id === value)
      if (found) updated[index].unitPrice = found.unitPrice
    }
    setPoFormData({ ...poFormData, orderItems: updated })
  }

  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/procurement/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: poFormData.vendorId,
          expectedDate: poFormData.expectedDate || undefined,
          notes: poFormData.notes,
          items: poFormData.orderItems.map(i => ({
            itemId: i.itemId,
            quantity: parseInt(i.quantity.toString()),
            unitPrice: parseFloat(i.unitPrice.toString())
          }))
        })
      })

      if (res.ok) {
        toast.success("Purchase Order drafted successfully")
        setShowPoModal(false)
        setPoFormData({
          vendorId: '',
          expectedDate: '',
          notes: '',
          orderItems: [{ itemId: '', quantity: 1, unitPrice: 0 }]
        })
        fetchProcurementData()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to create PO")
      }
    } catch {
      toast.error("Network error creating PO")
    }
  }

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/procurement/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        toast.success(`Purchase Order updated to ${status}`)
        fetchProcurementData()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to update order status")
      }
    } catch {
      toast.error("Error updating order status")
    }
  }

  const handleReceiveGoods = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/procurement/receive-goods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseOrderId: receiveModal.id,
          targetLocation: receiveForm.targetLocation,
          notes: receiveForm.notes || undefined
        })
      })
      if (res.ok) {
        toast.success("Goods received! Storeroom inventory replenished.")
        setReceiveModal(null)
        setReceiveForm({ targetLocation: 'MAIN_WAREHOUSE', notes: '' })
        fetchProcurementData()
        fetchInventory() // Refresh stock levels!
      } else {
        const data = await res.json()
        toast.error(data.message || "Failed to receive goods")
      }
    } catch {
      toast.error("Error processing goods receipt")
    }
  }

  const handleRegisterInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/procurement/vendor-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseOrderId: invoiceModal.id,
          invoiceNumber: invoiceForm.invoiceNumber,
          amount: parseFloat(invoiceForm.amount)
        })
      })
      if (res.ok) {
        toast.success("Vendor invoice registered successfully")
        setInvoiceModal(null)
        setInvoiceForm({ invoiceNumber: '', amount: '' })
        fetchProcurementData()
      } else {
        const data = await res.json()
        toast.error(data.message || "Invoice registration failed")
      }
    } catch {
      toast.error("Error registering vendor invoice")
    }
  }

  // Filtered Stock Items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = !searchTerm || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = filterCategory === 'all' || item.category === filterCategory
      const matchesStatus = filterStatus === 'all' || item.status === filterStatus
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [items, searchTerm, filterCategory, filterStatus])

  const categories = useMemo(() => Array.from(new Set(items.map(i => i.category))), [items])

  const stats = useMemo(() => ({
    total: items.length,
    inStock: items.filter(i => i.status === 'IN_STOCK').length,
    lowStock: items.filter(i => i.status === 'LOW_STOCK').length,
    outOfStock: items.filter(i => i.status === 'OUT_OF_STOCK').length,
    pendingPos: orders.filter(o => o.status === 'PENDING_APPROVAL').length
  }), [items, orders])

  const poTotalAmount = poFormData.orderItems.reduce(
    (sum, i) => sum + (Number(i.quantity || 0) * Number(i.unitPrice || 0)), 
    0
  )

  return (
    <AdminPageShell
      title="Master Inventory & Procurement"
      subtitle="Monitor hotel storeroom supplies, track par levels, and manage supplier purchase orders."
      onRefresh={() => {
        fetchInventory()
        fetchProcurementData()
      }}
      actions={
        <div className="flex items-center gap-2">
          {activeTab === 'STOCK' ? (
            <Button
              onClick={() => {
                if (activePropertyId === 'all') {
                  toast.error('Please select a specific property to add inventory')
                  return
                }
                setEditingItem(null)
                setItemFormData({
                  name: '',
                  description: '',
                  category: categories[0] || 'Amenities',
                  quantity: '',
                  unit: 'units',
                  minQuantity: '10',
                  status: 'IN_STOCK'
                })
                setShowItemModal(true)
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Item
            </Button>
          ) : (
            <Button
              onClick={() => setShowPoModal(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create Purchase Order
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">

        {/* View Switcher Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('STOCK')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'STOCK'
                  ? 'bg-primary text-black shadow-lg font-black'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/5'
              }`}
            >
              <Package className="w-4 h-4" />
              Stock Catalog & Levels ({items.length})
            </button>
            <button
              onClick={() => setActiveTab('ORDERS')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'ORDERS'
                  ? 'bg-primary text-black shadow-lg font-black'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/5'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              Purchase Orders & Deliveries ({orders.length})
              {stats.pendingPos > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-black font-black">
                  {stats.pendingPos}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-white/50">
            <Link 
              href="/admin/procurement/vendors" 
              className="hover:text-primary transition-colors flex items-center gap-1 font-semibold"
            >
              <Building2 className="w-3.5 h-3.5" /> Manage Vendors <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Quick KPI Stat Strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="bg-[#121118] border-white/5 p-4 rounded-xl">
            <p className="text-[10px] uppercase font-bold text-white/40">Total Items</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
          </Card>
          <Card className="bg-[#121118] border-white/5 p-4 rounded-xl">
            <p className="text-[10px] uppercase font-bold text-emerald-400">In Stock</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.inStock}</p>
          </Card>
          <Card className="bg-[#121118] border-white/5 p-4 rounded-xl">
            <p className="text-[10px] uppercase font-bold text-amber-400">Low Stock Alert</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{stats.lowStock}</p>
          </Card>
          <Card className="bg-[#121118] border-white/5 p-4 rounded-xl">
            <p className="text-[10px] uppercase font-bold text-rose-400">Out of Stock</p>
            <p className="text-2xl font-bold text-rose-400 mt-1">{stats.outOfStock}</p>
          </Card>
          <Card className="bg-[#121118] border-white/5 p-4 rounded-xl">
            <p className="text-[10px] uppercase font-bold text-sky-400">Pending POs</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.pendingPos}</p>
          </Card>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: STOCK CATALOG & INVENTORY LEVELS                   */}
        {/* ========================================================= */}
        {activeTab === 'STOCK' && (
          <div className="space-y-4">
            
            {/* Search and Category Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Search item name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white text-xs h-10 placeholder:text-white/30 focus-visible:border-primary/50"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-[#121118] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50"
                >
                  <option value="all">All Categories</option>
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-[#121118] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50"
                >
                  <option value="all">All Status</option>
                  <option value="IN_STOCK">In Stock</option>
                  <option value="LOW_STOCK">Low Stock</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                  <option value="DISCONTINUED">Discontinued</option>
                </select>
              </div>
            </div>

            {/* Inventory Table */}
            {loadingItems ? (
              <div className="py-20 flex justify-center"><PremiumSpinner /></div>
            ) : (
              <div className="bg-[#121118] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                <table className="w-full text-left text-sm text-white">
                  <thead className="bg-white/5 text-white/50 text-xs uppercase border-b border-white/10">
                    <tr>
                      <th className="p-4">Item Name</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Current Stock</th>
                      <th className="p-4">Par Threshold</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredItems.map(item => {
                      const isLowOrOut = item.status === 'LOW_STOCK' || item.status === 'OUT_OF_STOCK'
                      return (
                        <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-4">
                            <p className="font-semibold text-white">{item.name}</p>
                            {item.description && (
                              <p className="text-xs text-white/40 line-clamp-1">{item.description}</p>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="text-xs px-2.5 py-1 rounded bg-white/5 text-white/70 border border-white/10">
                              {item.category}
                            </span>
                          </td>
                          <td className="p-4 font-mono font-bold text-white">
                            {item.quantity} <span className="text-xs font-normal text-white/40">{item.unit}</span>
                          </td>
                          <td className="p-4 text-xs text-white/50 font-mono">
                            {item.minQuantity} {item.unit}
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                              item.status === 'IN_STOCK' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              item.status === 'LOW_STOCK' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse' :
                              item.status === 'OUT_OF_STOCK' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                              'bg-white/5 text-white/40 border-white/10'
                            }`}>
                              {item.status === 'IN_STOCK' && <CheckCircle className="w-3 h-3" />}
                              {item.status === 'LOW_STOCK' && <AlertTriangle className="w-3 h-3" />}
                              {item.status === 'OUT_OF_STOCK' && <AlertTriangle className="w-3 h-3" />}
                              {item.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Integrated Reorder Trigger */}
                              {isLowOrOut && (
                                <Button
                                  size="sm"
                                  onClick={() => handleQuickReorder(item)}
                                  className="h-7 text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 gap-1"
                                >
                                  <ShoppingCart className="w-3 h-3" /> Reorder PO
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setAdjustModal(item)
                                  setAdjustForm({
                                    newQuantity: item.quantity.toString(),
                                    location: item.stocks && item.stocks.length > 0 ? item.stocks[0].location : 'Main Storage',
                                    reason: 'Manual Count'
                                  })
                                }}
                                className="h-7 px-2 border-white/10 text-white/70 hover:text-white"
                                title="Adjust Stock"
                              >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingItem(item)
                                  setItemFormData({
                                    name: item.name,
                                    description: item.description || '',
                                    category: item.category,
                                    quantity: item.quantity.toString(),
                                    unit: item.unit,
                                    minQuantity: item.minQuantity.toString(),
                                    status: item.status
                                  })
                                  setShowItemModal(true)
                                }}
                                className="h-7 px-2 border-white/10 text-white/70 hover:text-white"
                                title="Edit Item"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteItem(item.id)}
                                className="h-7 px-2 border-white/10 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                                title="Delete Item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    {filteredItems.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-white/40">
                          No inventory items match your current filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: PURCHASE ORDERS & PROCUREMENT                      */}
        {/* ========================================================= */}
        {activeTab === 'ORDERS' && (
          <div className="space-y-4">
            
            {loadingOrders ? (
              <div className="py-20 flex justify-center"><PremiumSpinner /></div>
            ) : (
              <div className="bg-[#121118] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                <table className="w-full text-left text-sm text-white">
                  <thead className="bg-white/5 text-white/50 text-xs uppercase border-b border-white/10">
                    <tr>
                      <th className="p-4">PO Number</th>
                      <th className="p-4">Supplier / Vendor</th>
                      <th className="p-4">Date Created</th>
                      <th className="p-4">Expected Delivery</th>
                      <th className="p-4 text-right">Order Total</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {orders.map(order => {
                      const st = PO_STATUS_CONFIG[order.status]
                      return (
                        <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-primary" />
                              <span className="font-mono font-bold text-xs text-white">{order.orderNumber}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <p className="font-semibold text-white">{order.vendor?.name || 'Vendor'}</p>
                            <p className="text-xs text-white/40">{order.vendor?.email || ''}</p>
                          </td>
                          <td className="p-4 text-xs text-white/50">
                            {new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="p-4 text-xs text-white/50">
                            {order.expectedDate ? new Date(order.expectedDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                          </td>
                          <td className="p-4 font-mono font-bold text-right text-emerald-400">
                            ${Number(order.totalAmount || 0).toFixed(2)}
                          </td>
                          <td className="p-4">
                            {st ? (
                              <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded ${st.className}`}>
                                {st.icon} {st.label}
                              </span>
                            ) : (
                              <span className="text-white/40 text-xs">{order.status}</span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {order.status === 'PENDING_APPROVAL' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateOrderStatus(order.id, 'APPROVED')}
                                    className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateOrderStatus(order.id, 'REJECTED')}
                                    className="h-7 text-xs border-white/10 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}

                              {(order.status === 'APPROVED' || order.status === 'SHIPPED') && (
                                <Button
                                  size="sm"
                                  onClick={() => setReceiveModal(order)}
                                  className="h-7 text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold gap-1"
                                >
                                  <Package className="w-3.5 h-3.5" /> Receive Goods
                                </Button>
                              )}

                              {order.status === 'DELIVERED' && (
                                <Button
                                  size="sm"
                                  onClick={() => setInvoiceModal(order)}
                                  className="h-7 text-xs bg-emerald-700 hover:bg-emerald-600 text-white font-bold gap-1"
                                >
                                  <FileText className="w-3.5 h-3.5" /> Register Invoice
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-white/40">
                          No purchase orders recorded. Click "+ Create Purchase Order" to start your first replenishment.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        )}

      </div>

      {/* ========================================================= */}
      {/* MODAL 1: ADD / EDIT INVENTORY ITEM                        */}
      {/* ========================================================= */}
      <ModalShell
        open={showItemModal}
        onClose={() => {
          setShowItemModal(false)
          setEditingItem(null)
        }}
        title={editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
      >
        <form onSubmit={handleItemSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-1 block">Item Name *</label>
            <Input
              required
              value={itemFormData.name}
              onChange={e => setItemFormData({ ...itemFormData, name: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
              placeholder="e.g. Luxury Egyptian Cotton Towel"
            />
          </div>

          <div>
            <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-1 block">Description</label>
            <Input
              value={itemFormData.description}
              onChange={e => setItemFormData({ ...itemFormData, description: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
              placeholder="e.g. 800 GSM White Bath Towel"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-1 block">Category *</label>
              <Input
                required
                value={itemFormData.category}
                onChange={e => setItemFormData({ ...itemFormData, category: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="e.g. Linens, Amenities, F&B"
              />
            </div>
            <div>
              <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-1 block">Unit of Measure *</label>
              <Input
                required
                value={itemFormData.unit}
                onChange={e => setItemFormData({ ...itemFormData, unit: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="e.g. pcs, sets, kg, bottles"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-1 block">Initial Quantity *</label>
              <Input
                type="number"
                min="0"
                required
                disabled={!!editingItem}
                value={itemFormData.quantity}
                onChange={e => setItemFormData({ ...itemFormData, quantity: e.target.value })}
                className="bg-white/5 border-white/10 text-white disabled:opacity-50"
              />
            </div>
            <div>
              <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-1 block">Par Threshold (Min Qty) *</label>
              <Input
                type="number"
                min="0"
                required
                value={itemFormData.minQuantity}
                onChange={e => setItemFormData({ ...itemFormData, minQuantity: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowItemModal(false)
                setEditingItem(null)
              }}
              className="border-white/10 text-white/60 hover:text-white"
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
              {editingItem ? 'Save Changes' : 'Create Item'}
            </Button>
          </div>
        </form>
      </ModalShell>

      {/* ========================================================= */}
      {/* MODAL 2: ADJUST STOCK                                     */}
      {/* ========================================================= */}
      <ModalShell
        open={!!adjustModal}
        onClose={() => setAdjustModal(null)}
        title={`Adjust Stock — ${adjustModal?.name || ''}`}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            if (!adjustModal) return
            if (activePropertyId === 'all') {
              toast.error('Please select a specific property')
              return
            }
            setSubmittingAdjust(true)
            try {
              const res = await fetch(`/api/inventory/${adjustModal.id}/adjust`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'x-property-id': activePropertyId || ''
                },
                body: JSON.stringify({
                  location: adjustForm.location,
                  newQuantity: parseInt(adjustForm.newQuantity),
                  reason: adjustForm.reason
                })
              })
              if (res.ok) {
                toast.success(`Stock adjusted to ${adjustForm.newQuantity} ${adjustModal.unit}`)
                setAdjustModal(null)
                fetchInventory()
              } else {
                const data = await res.json()
                toast.error(data.error || 'Adjustment failed')
              }
            } finally {
              setSubmittingAdjust(false)
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-1 block">
              New Count ({adjustModal?.unit}) *
            </label>
            <Input
              type="number"
              min="0"
              required
              value={adjustForm.newQuantity}
              onChange={e => setAdjustForm({ ...adjustForm, newQuantity: e.target.value })}
              className="bg-white/5 border-white/10 text-white text-lg font-bold"
            />
          </div>

          <div>
            <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-1 block">Storage Location *</label>
            <Input
              required
              value={adjustForm.location}
              onChange={e => setAdjustForm({ ...adjustForm, location: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
              placeholder="e.g. Main Storage, Storeroom B"
            />
          </div>

          <div>
            <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-1 block">Adjustment Reason *</label>
            <Input
              required
              value={adjustForm.reason}
              onChange={e => setAdjustForm({ ...adjustForm, reason: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
              placeholder="e.g. Weekly Physical Audit, Breakage, Restock"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAdjustModal(null)}
              className="border-white/10 text-white/60 hover:text-white"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submittingAdjust} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
              {submittingAdjust ? 'Updating...' : 'Confirm Count'}
            </Button>
          </div>
        </form>
      </ModalShell>

      {/* ========================================================= */}
      {/* MODAL 3: DRAFT PURCHASE ORDER                             */}
      {/* ========================================================= */}
      <ModalShell
        open={showPoModal}
        onClose={() => setShowPoModal(false)}
        title="Draft Supplier Purchase Order"
      >
        <form onSubmit={handleCreatePo} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-1 block">Supplier / Vendor *</label>
              <select
                required
                value={poFormData.vendorId}
                onChange={e => setPoFormData({ ...poFormData, vendorId: e.target.value })}
                className="w-full bg-[#121118] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-primary/50"
              >
                <option value="">Select Vendor...</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-1 block">Expected Delivery</label>
              <Input
                type="date"
                value={poFormData.expectedDate}
                onChange={e => setPoFormData({ ...poFormData, expectedDate: e.target.value })}
                className="bg-white/5 border-white/10 text-white text-xs h-9"
              />
            </div>

            <div className="col-span-2">
              <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-1 block">Order Notes</label>
              <Input
                value={poFormData.notes}
                onChange={e => setPoFormData({ ...poFormData, notes: e.target.value })}
                className="bg-white/5 border-white/10 text-white text-xs h-9"
                placeholder="Special delivery instructions..."
              />
            </div>
          </div>

          <div className="border border-white/10 rounded-xl p-4 bg-white/[0.02] space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white/70">Order Line Items</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPoFormData({
                  ...poFormData,
                  orderItems: [...poFormData.orderItems, { itemId: '', quantity: 1, unitPrice: 0 }]
                })}
                className="h-7 text-xs border-white/10 text-primary hover:bg-white/5"
              >
                <Plus className="w-3 h-3 mr-1" /> Add Line
              </Button>
            </div>

            {poFormData.orderItems.map((line, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <div className="flex-1">
                  <select
                    required
                    value={line.itemId}
                    onChange={e => handlePoItemChange(idx, 'itemId', e.target.value)}
                    className="w-full bg-[#121118] border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-primary/50"
                  >
                    <option value="">Select Catalog Item...</option>
                    {procurementCatalog.map(catItem => (
                      <option key={catItem.id} value={catItem.id}>
                        {catItem.name} (${Number(catItem.unitPrice || 0).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-20">
                  <Input
                    type="number"
                    min="1"
                    required
                    value={line.quantity}
                    onChange={e => handlePoItemChange(idx, 'quantity', e.target.value)}
                    className="bg-white/5 border-white/10 text-white text-center text-xs h-9"
                    placeholder="Qty"
                  />
                </div>

                <div className="w-24">
                  <Input
                    type="number"
                    step="0.01"
                    required
                    value={line.unitPrice}
                    onChange={e => handlePoItemChange(idx, 'unitPrice', e.target.value)}
                    className="bg-white/5 border-white/10 text-white font-mono text-xs h-9"
                    placeholder="Unit $"
                  />
                </div>

                {poFormData.orderItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setPoFormData({
                      ...poFormData,
                      orderItems: poFormData.orderItems.filter((_, i) => i !== idx)
                    })}
                    className="text-white/30 hover:text-rose-400 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/10">
            <div>
              <span className="text-white/40 text-xs uppercase tracking-wider block">Total Estimated Cost</span>
              <span className="text-xl font-bold font-mono text-emerald-400">
                ${poTotalAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPoModal(false)}
                className="border-white/10 text-white/60 hover:text-white"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                Submit Purchase Order
              </Button>
            </div>
          </div>
        </form>
      </ModalShell>

      {/* ========================================================= */}
      {/* MODAL 4: RECEIVE GOODS                                    */}
      {/* ========================================================= */}
      <ModalShell
        open={!!receiveModal}
        onClose={() => setReceiveModal(null)}
        title={`Receive Goods — ${receiveModal?.orderNumber || ''}`}
      >
        <form onSubmit={handleReceiveGoods} className="space-y-4">
          <div>
            <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-1 block">Target Storeroom Location *</label>
            <select
              required
              value={receiveForm.targetLocation}
              onChange={e => setReceiveForm({ ...receiveForm, targetLocation: e.target.value })}
              className="w-full bg-[#121118] border border-white/10 rounded-lg p-2.5 text-xs text-white"
            >
              <option value="MAIN_WAREHOUSE">Main Storeroom A</option>
              <option value="KITCHEN_STORE">Kitchen Store</option>
              <option value="BAR_STORE">Bar Depot</option>
              <option value="HOUSEKEEPING">Housekeeping Depot</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-1 block">Delivery Slip / Inspection Notes</label>
            <Input
              value={receiveForm.notes}
              onChange={e => setReceiveForm({ ...receiveForm, notes: e.target.value })}
              className="bg-white/5 border-white/10 text-white text-xs"
              placeholder="e.g. Delivered in full, packaging in good condition."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => setReceiveModal(null)}
              className="border-white/10 text-white/60 hover:text-white"
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold">
              Confirm Goods Receipt
            </Button>
          </div>
        </form>
      </ModalShell>

      {/* ========================================================= */}
      {/* MODAL 5: REGISTER INVOICE                                 */}
      {/* ========================================================= */}
      <ModalShell
        open={!!invoiceModal}
        onClose={() => setInvoiceModal(null)}
        title={`Register Vendor Invoice — ${invoiceModal?.orderNumber || ''}`}
      >
        <form onSubmit={handleRegisterInvoice} className="space-y-4">
          <div>
            <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-1 block">Invoice Reference Number *</label>
            <Input
              required
              value={invoiceForm.invoiceNumber}
              onChange={e => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
              className="bg-white/5 border-white/10 text-white text-xs font-mono"
              placeholder="e.g. INV-2026-9481"
            />
          </div>

          <div>
            <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-1 block">Billed Amount ($) *</label>
            <Input
              type="number"
              step="0.01"
              required
              value={invoiceForm.amount}
              onChange={e => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
              className="bg-white/5 border-white/10 text-white text-xs font-mono"
              placeholder={invoiceModal?.totalAmount ? Number(invoiceModal.totalAmount).toFixed(2) : '0.00'}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => setInvoiceModal(null)}
              className="border-white/10 text-white/60 hover:text-white"
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
              Record Invoice
            </Button>
          </div>
        </form>
      </ModalShell>

    </AdminPageShell>
  )
}
