"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Clock, 
  CheckCircle, 
  ChefHat, 
  Truck, 
  Bell, 
  AlertCircle,
  Users,
  MapPin,
  Timer,
  Star,
  Zap,
  Eye
} from "lucide-react"
import { PremiumButton } from "../ui/premium-button"
import { cn } from "@/lib/utils"

// Types
interface OrderItem {
  id: string
  name: string
  quantity: number
  specialRequests?: string
  status: 'pending' | 'preparing' | 'ready'
}

interface LiveOrder {
  id: string
  roomNumber: string
  guestName: string
  items: OrderItem[]
  totalAmount: number
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED'
  priority: 'normal' | 'high' | 'urgent'
  estimatedTime: number
  createdAt: Date
  updatedAt: Date
  specialInstructions?: string
  isNew?: boolean
}

interface LiveOrderFeedProps {
  onOrderClick?: (orderId: string) => void
  onStatusUpdate?: (orderId: string, status: string) => void
  autoRefresh?: boolean
  refreshInterval?: number
}

const statusConfig = {
  PENDING: {
    label: 'New Order',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200',
    icon: Clock
  },
  CONFIRMED: {
    label: 'Confirmed',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
    icon: CheckCircle
  },
  PREPARING: {
    label: 'Preparing',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-200',
    icon: ChefHat
  },
  READY: {
    label: 'Ready',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
    icon: CheckCircle
  },
  DELIVERED: {
    label: 'Delivered',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
    icon: CheckCircle
  }
}

const priorityConfig = {
  normal: { color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'Normal' },
  high: { color: 'text-orange-600', bgColor: 'bg-orange-100', label: 'High' },
  urgent: { color: 'text-red-600', bgColor: 'bg-red-100', label: 'Urgent' }
}

// Order card component
function OrderCard({ 
  order, 
  index, 
  onClick, 
  onStatusUpdate 
}: {
  order: LiveOrder
  index: number
  onClick?: (orderId: string) => void
  onStatusUpdate?: (orderId: string, status: string) => void
}) {
  const statusConf = statusConfig[order.status]
  const priorityConf = priorityConfig[order.priority]
  const StatusIcon = statusConf.icon

  const getTimeElapsed = (createdAt: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - createdAt.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    return diffMins
  }

  const timeElapsed = getTimeElapsed(order.createdAt)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      onClick={() => onClick?.(order.id)}
      className={cn(
        "bg-white rounded-2xl shadow-lg border-2 cursor-pointer transition-all",
        statusConf.borderColor,
        order.isNew && "ring-2 ring-amber-400 ring-opacity-50",
        "hover:shadow-xl"
      )}
    >
      {/* New Order Indicator */}
      {order.isNew && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center"
        >
          <Zap className="w-3 h-3 text-white" />
        </motion.div>
      )}

      <div className="p-6">
        {/* Header */}
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
              "px-2 py-1 rounded-full text-xs font-medium mb-1",
              priorityConf.bgColor,
              priorityConf.color
            )}>
              {priorityConf.label}
            </div>
            <div className="text-sm text-gray-500">
              {timeElapsed}m ago
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="space-y-2 mb-4">
          {order.items.slice(0, 3).map((item, itemIndex) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + itemIndex * 0.05 }}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
            >
              <div className="flex-1">
                <div className="font-medium text-gray-900">{item.name}</div>
                <div className="text-sm text-gray-500">
                  × {item.quantity}
                  {item.specialRequests && (
                    <span className="text-amber-600 ml-2">• {item.specialRequests}</span>
                  )}
                </div>
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
          
          {order.items.length > 3 && (
            <div className="text-sm text-gray-500 text-center py-2">
              +{order.items.length - 3} more items
            </div>
          )}
        </div>

        {/* Special Instructions */}
        {order.specialInstructions && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">Special Instructions</span>
            </div>
            <p className="text-sm text-amber-700">{order.specialInstructions}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold text-gray-900">
            ${order.totalAmount.toFixed(2)}
          </div>
          
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">{order.estimatedTime} min</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          {order.status === 'PENDING' && (
            <PremiumButton
              onClick={(e) => {
                e.stopPropagation()
                onStatusUpdate?.(order.id, 'CONFIRMED')
              }}
              variant="primary"
              size="sm"
              className="flex-1"
            >
              Confirm
            </PremiumButton>
          )}
          
          {order.status === 'CONFIRMED' && (
            <PremiumButton
              onClick={(e) => {
                e.stopPropagation()
                onStatusUpdate?.(order.id, 'PREPARING')
              }}
              variant="secondary"
              size="sm"
              className="flex-1"
            >
              Start Preparing
            </PremiumButton>
          )}
          
          {order.status === 'PREPARING' && (
            <PremiumButton
              onClick={(e) => {
                e.stopPropagation()
                onStatusUpdate?.(order.id, 'READY')
              }}
              variant="success"
              size="sm"
              className="flex-1"
            >
              Mark Ready
            </PremiumButton>
          )}
          
          {order.status === 'READY' && (
            <PremiumButton
              onClick={(e) => {
                e.stopPropagation()
                onStatusUpdate?.(order.id, 'DELIVERED')
              }}
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
}

// Live Order Feed Component
function LiveOrderFeedContent({ 
  onOrderClick, 
  onStatusUpdate, 
  autoRefresh = true, 
  refreshInterval = 5000 
}: LiveOrderFeedProps) {
  const [orders, setOrders] = useState<LiveOrder[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [isLive, setIsLive] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    preparing: 0,
    ready: 0
  })

  // Fetch real orders from API
  useEffect(() => {
    fetchOrders()
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchOrders()
      }, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/restaurant/orders')
      if (response.ok) {
        const data = await response.json()
        
        const transformedOrders: LiveOrder[] = data.map((order: any) => {
          const minutesOld = (Date.now() - new Date(order.createdAt).getTime()) / 1000 / 60
          const priority = minutesOld > 30 ? 'urgent' : minutesOld > 15 ? 'high' : 'normal'
          
          return {
            id: order.id,
            roomNumber: order.roomNumber,
            guestName: 'Guest',
            items: order.items?.map((item: any) => ({
              id: item.id,
              name: item.menu?.name || 'Item',
              quantity: item.quantity,
              specialRequests: item.notes,
              status: 'pending' as const
            })) || [],
            totalAmount: order.totalAmount,
            status: order.status,
            priority,
            estimatedTime: order.deliveryTime ? 
              Math.round((new Date(order.deliveryTime).getTime() - Date.now()) / 60000) : 20,
            createdAt: new Date(order.createdAt),
            updatedAt: new Date(order.updatedAt),
            specialInstructions: order.specialRequests
          }
        })
        
        setOrders(transformedOrders)
        
        // Update stats
        setStats({
          total: transformedOrders.length,
          pending: transformedOrders.filter(o => o.status === 'PENDING').length,
          preparing: transformedOrders.filter(o => o.status === 'PREPARING').length,
          ready: transformedOrders.filter(o => o.status === 'READY').length
        })
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    }
  }

  // Remove duplicate stats - already handled in fetchOrders

  const handleOrderClick = (orderId: string) => {
    onOrderClick?.(orderId)
  }

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/restaurant/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (response.ok) {
        fetchOrders() // Refresh orders
        onStatusUpdate?.(orderId, newStatus)
      }
    } catch (error) {
      console.error('Failed to update order:', error)
    }
  }

  const activeOrders = orders.filter(o => 
    o.status !== 'DELIVERED'
  )

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Bell className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        
        <div className="bg-yellow-50 rounded-xl shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700">Pending</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-xl shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700">Preparing</p>
              <p className="text-2xl font-bold text-orange-900">{stats.preparing}</p>
            </div>
            <ChefHat className="w-8 h-8 text-orange-600" />
          </div>
        </div>
        
        <div className="bg-green-50 rounded-xl shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700">Ready</p>
              <p className="text-2xl font-bold text-green-900">{stats.ready}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Active Orders ({activeOrders.length})</h3>
        
        <AnimatePresence mode="popLayout">
          {activeOrders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 bg-white rounded-xl shadow-md"
            >
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No active orders</p>
            </motion.div>
          ) : (
            activeOrders.map((order, index) => (
              <OrderCard
                key={order.id}
                order={order}
                index={index}
                onClick={handleOrderClick}
                onStatusUpdate={handleStatusUpdate}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export function LiveOrderFeed({ 
  onOrderClick, 
  onStatusUpdate, 
  autoRefresh = true, 
  refreshInterval = 5000 
}: LiveOrderFeedProps) {
  return (
    <LiveOrderFeedContent
      onOrderClick={onOrderClick}
      onStatusUpdate={onStatusUpdate}
      autoRefresh={autoRefresh}
      refreshInterval={refreshInterval}
    />
  )
}
