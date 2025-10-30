"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, CheckCircle, ChefHat, Truck, AlertCircle, Bell, Timer, Users } from "lucide-react"
import { PremiumButton } from "../ui/premium-button"
import { KpiCard } from "../ui/kpi-card"
import { cn } from "@/lib/utils"

interface OrderItem {
  id: string
  menuItem: {
    name: string
    category: string
  }
  quantity: number
  specialRequests?: string
  status: 'pending' | 'preparing' | 'ready'
}

interface KitchenOrder {
  id: string
  roomNumber: string
  guestName: string
  items: OrderItem[]
  totalAmount: number
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED'
  createdAt: Date
  estimatedTime?: number
  priority: 'normal' | 'high' | 'urgent'
  specialInstructions?: string
}

interface KitchenDashboardProps {
  onOrderUpdate?: (orderId: string, status: string) => void
}

const statusConfig = {
  PENDING: {
    label: 'New Order',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: Clock
  },
  CONFIRMED: {
    label: 'Confirmed',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: CheckCircle
  },
  PREPARING: {
    label: 'Preparing',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    icon: ChefHat
  },
  READY: {
    label: 'Ready',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: CheckCircle
  },
  DELIVERED: {
    label: 'Delivered',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: CheckCircle
  }
}

const priorityConfig = {
  normal: { color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'Normal' },
  high: { color: 'text-orange-600', bgColor: 'bg-orange-100', label: 'High' },
  urgent: { color: 'text-red-600', bgColor: 'bg-red-100', label: 'Urgent' }
}

export function KitchenDashboard({ onOrderUpdate }: KitchenDashboardProps) {
  const [orders, setOrders] = useState<KitchenOrder[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    preparingOrders: 0,
    readyOrders: 0,
    averageTime: 25
  })

  // Fetch real orders from API
  useEffect(() => {
    fetchOrders()
    
    // Poll for new orders every 10 seconds
    const interval = setInterval(() => {
      fetchOrders()
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/kitchen/orders?today=true')
      if (response.ok) {
        const data = await response.json()
        
        // Transform API data to component format
        const transformedOrders: KitchenOrder[] = data.map((order: any) => ({
          id: order.id,
          roomNumber: order.roomNumber,
          guestName: order.user?.name || 'Guest',
          items: order.items.map((item: any) => ({
            id: item.id,
            menuItem: {
              name: item.menu.name,
              category: item.menu.category
            },
            quantity: item.quantity,
            specialRequests: item.notes,
            status: 'pending' as const
          })),
          totalAmount: order.totalAmount,
          status: order.status,
          createdAt: new Date(order.createdAt),
          estimatedTime: order.items.reduce((total: number, item: any) => 
            total + (item.menu.preparationTime || 15), 0),
          priority: determinePriority(order.createdAt, order.totalAmount),
          specialInstructions: order.specialRequests
        }))
        
        setOrders(transformedOrders)
        
        // Calculate stats
        setStats({
          totalOrders: transformedOrders.length,
          pendingOrders: transformedOrders.filter(o => o.status === 'PENDING').length,
          preparingOrders: transformedOrders.filter(o => o.status === 'PREPARING').length,
          readyOrders: transformedOrders.filter(o => o.status === 'READY').length,
          averageTime: transformedOrders.length > 0 
            ? Math.round(transformedOrders.reduce((sum, o) => sum + (o.estimatedTime || 0), 0) / transformedOrders.length)
            : 25
        })
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    }
  }

  const determinePriority = (createdAt: string, totalAmount: number): 'normal' | 'high' | 'urgent' => {
    const minutesOld = (Date.now() - new Date(createdAt).getTime()) / 1000 / 60
    if (minutesOld > 30) return 'urgent'
    if (totalAmount > 50 || minutesOld > 15) return 'high'
    return 'normal'
  }

  const filteredOrders = selectedStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === selectedStatus)

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, status: newStatus as any, updatedAt: new Date() }
        : order
    ))
    
    // Update stats
    const order = orders.find(o => o.id === orderId)
    if (order) {
      setStats(prev => ({
        ...prev,
        pendingOrders: newStatus === 'CONFIRMED' ? prev.pendingOrders - 1 : prev.pendingOrders,
        preparingOrders: newStatus === 'PREPARING' ? prev.preparingOrders + 1 : 
                        order.status === 'PREPARING' ? prev.preparingOrders - 1 : prev.preparingOrders,
        readyOrders: newStatus === 'READY' ? prev.readyOrders + 1 : 
                    order.status === 'READY' ? prev.readyOrders - 1 : prev.readyOrders
      }))
    }
    
    onOrderUpdate?.(orderId, newStatus)
  }

  const getTimeElapsed = (createdAt: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - createdAt.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    return diffMins
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Kitchen Dashboard</h1>
              <p className="text-gray-600">Manage orders and track preparation status</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Live Updates</span>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <KpiCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={<ChefHat className="w-5 h-5" />}
            color="primary"
          />
          <KpiCard
            title="Pending"
            value={stats.pendingOrders}
            icon={<Clock className="w-5 h-5" />}
            color="warning"
          />
          <KpiCard
            title="Preparing"
            value={stats.preparingOrders}
            icon={<Timer className="w-5 h-5" />}
            color="info"
          />
          <KpiCard
            title="Ready"
            value={stats.readyOrders}
            icon={<CheckCircle className="w-5 h-5" />}
            color="success"
          />
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2 mb-6 overflow-x-auto"
        >
          {[
            { key: 'all', label: 'All Orders', count: orders.length },
            { key: 'PENDING', label: 'New', count: stats.pendingOrders },
            { key: 'PREPARING', label: 'Preparing', count: stats.preparingOrders },
            { key: 'READY', label: 'Ready', count: stats.readyOrders }
          ].map((filter) => (
            <motion.button
              key={filter.key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedStatus(filter.key)}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-lg border-2 transition-all font-medium flex items-center gap-2",
                selectedStatus === filter.key
                  ? "border-orange-500 bg-orange-500 text-white shadow-lg"
                  : "border-gray-200 bg-white text-gray-700 hover:border-orange-300"
              )}
            >
              {filter.label}
              {filter.count > 0 && (
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-bold",
                  selectedStatus === filter.key
                    ? "bg-white/20 text-white"
                    : "bg-orange-100 text-orange-600"
                )}>
                  {filter.count}
                </span>
              )}
            </motion.button>
          ))}
        </motion.div>

        {/* Orders Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatePresence>
            {filteredOrders.map((order, index) => {
              const statusConf = statusConfig[order.status]
              const priorityConf = priorityConfig[order.priority]
              const StatusIcon = statusConf.icon
              const timeElapsed = getTimeElapsed(order.createdAt)

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
                >
                  {/* Order Header */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", statusConf.bgColor)}>
                          <StatusIcon className={cn("w-5 h-5", statusConf.color)} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Order #{order.id}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Users className="w-3 h-3" />
                            {order.guestName} • Room {order.roomNumber}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          priorityConf.bgColor,
                          priorityConf.color
                        )}>
                          {priorityConf.label}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {timeElapsed}m ago
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-2">
                      {order.items.map((item, itemIndex) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + itemIndex * 0.05 }}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{item.menuItem.name}</div>
                            <div className="text-sm text-gray-500">
                              × {item.quantity} • {item.menuItem.category}
                            </div>
                            {item.specialRequests && (
                              <div className="text-xs text-amber-600 mt-1">
                                Note: {item.specialRequests}
                              </div>
                            )}
                          </div>
                          <div className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            item.status === 'ready' ? "bg-green-100 text-green-600" :
                            item.status === 'preparing' ? "bg-orange-100 text-orange-600" :
                            "bg-yellow-100 text-yellow-600"
                          )}>
                            {item.status}
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Special Instructions */}
                    {order.specialInstructions && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <span className="text-sm font-medium text-amber-800">Special Instructions</span>
                        </div>
                        <p className="text-sm text-amber-700">{order.specialInstructions}</p>
                      </div>
                    )}
                  </div>

                  {/* Order Footer */}
                  <div className="p-6 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-lg font-semibold text-gray-900">
                        Total: ${order.totalAmount.toFixed(2)}
                      </div>
                      {order.estimatedTime && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Timer className="w-4 h-4" />
                          {order.estimatedTime} min
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {order.status === 'PENDING' && (
                        <PremiumButton
                          onClick={() => handleStatusUpdate(order.id, 'CONFIRMED')}
                          variant="primary"
                          size="sm"
                          className="flex-1"
                        >
                          Confirm Order
                        </PremiumButton>
                      )}
                      
                      {order.status === 'CONFIRMED' && (
                        <PremiumButton
                          onClick={() => handleStatusUpdate(order.id, 'PREPARING')}
                          variant="secondary"
                          size="sm"
                          className="flex-1"
                        >
                          Start Preparing
                        </PremiumButton>
                      )}
                      
                      {order.status === 'PREPARING' && (
                        <PremiumButton
                          onClick={() => handleStatusUpdate(order.id, 'READY')}
                          variant="success"
                          size="sm"
                          className="flex-1"
                        >
                          Mark Ready
                        </PremiumButton>
                      )}
                      
                      {order.status === 'READY' && (
                        <PremiumButton
                          onClick={() => handleStatusUpdate(order.id, 'DELIVERED')}
                          variant="primary"
                          size="sm"
                          className="flex-1"
                        >
                          Mark Delivered
                        </PremiumButton>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredOrders.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500">No orders match the current filter</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
