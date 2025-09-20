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

  // Mock data and real-time simulation
  useEffect(() => {
    const generateMockOrders = (): LiveOrder[] => {
      const baseOrders: LiveOrder[] = [
        {
          id: 'ORD001',
          roomNumber: '101',
          guestName: 'John Smith',
          items: [
            { id: '1', name: 'Continental Breakfast', quantity: 2, status: 'preparing' },
            { id: '2', name: 'Fresh Orange Juice', quantity: 1, status: 'ready' }
          ],
          totalAmount: 45.97,
          status: 'PREPARING',
          priority: 'high',
          estimatedTime: 15,
          createdAt: new Date(Date.now() - 15 * 60 * 1000),
          updatedAt: new Date(Date.now() - 5 * 60 * 1000),
          specialInstructions: 'Extra hot coffee'
        },
        {
          id: 'ORD002',
          roomNumber: '205',
          guestName: 'Sarah Johnson',
          items: [
            { id: '3', name: 'Caesar Salad', quantity: 1, status: 'pending' },
            { id: '4', name: 'Grilled Salmon', quantity: 1, status: 'pending', specialRequests: 'No salt' }
          ],
          totalAmount: 37.98,
          status: 'CONFIRMED',
          priority: 'normal',
          estimatedTime: 25,
          createdAt: new Date(Date.now() - 5 * 60 * 1000),
          updatedAt: new Date(Date.now() - 2 * 60 * 1000)
        },
        {
          id: 'ORD003',
          roomNumber: '312',
          guestName: 'Mike Davis',
          items: [
            { id: '5', name: 'Full English Breakfast', quantity: 1, status: 'ready' }
          ],
          totalAmount: 18.99,
          status: 'READY',
          priority: 'normal',
          estimatedTime: 0,
          createdAt: new Date(Date.now() - 30 * 60 * 1000),
          updatedAt: new Date(Date.now() - 5 * 60 * 1000)
        }
      ]

      return baseOrders
    }

    setOrders(generateMockOrders())

    if (autoRefresh) {
      const interval = setInterval(() => {
        // Simulate new orders coming in
        if (Math.random() > 0.7) {
          const newOrder: LiveOrder = {
            id: `ORD${String(Math.random()).substr(2, 6).toUpperCase()}`,
            roomNumber: String(Math.floor(Math.random() * 400) + 100),
            guestName: 'New Guest',
            items: [
              { id: '6', name: 'Premium Coffee', quantity: 1, status: 'pending' }
            ],
            totalAmount: 3.99,
            status: 'PENDING',
            priority: 'normal',
            estimatedTime: 10,
            createdAt: new Date(),
            updatedAt: new Date(),
            isNew: true
          }
          
          setOrders(prev => {
            const updated = [newOrder, ...prev]
            // Remove new flag after a few seconds
            setTimeout(() => {
              setOrders(prev => prev.map(order => 
                order.id === newOrder.id ? { ...order, isNew: false } : order
              ))
            }, 3000)
            return updated
          })
        }

        // Simulate status updates
        setOrders(prev => prev.map(order => {
          if (Math.random() > 0.95 && order.status !== 'DELIVERED') {
            const statuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED'] as const
            const currentIndex = statuses.indexOf(order.status)
            if (currentIndex < statuses.length - 1) {
              return {
                ...order,
                status: statuses[currentIndex + 1],
                updatedAt: new Date()
              }
            }
          }
          return order
        }))
      }, refreshInterval)

      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

  // Update stats
  useEffect(() => {
    setStats({
      total: orders.length,
      pending: orders.filter(o => o.status === 'PENDING').length,
      preparing: orders.filter(o => o.status === 'PREPARING').length,
      ready: orders.filter(o => o.status === 'READY').length
    })
  }, [orders])

  const filteredOrders = selectedStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === selectedStatus)

  const statusFilters = [
    { key: 'all', label: 'All Orders', count: stats.total },
    { key: 'PENDING', label: 'New', count: stats.pending },
    { key: 'PREPARING', label: 'Preparing', count: stats.preparing },
    { key: 'READY', label: 'Ready', count: stats.ready }
  ]

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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Order Feed</h1>
              <p className="text-gray-600">Real-time restaurant order management</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-3 h-3 rounded-full animate-pulse",
                isLive ? "bg-green-500" : "bg-gray-400"
              )}></div>
              <span className="text-sm text-gray-600">
                {isLive ? 'Live Updates' : 'Paused'}
              </span>
              <PremiumButton
                variant="outline"
                size="sm"
                onClick={() => setIsLive(!isLive)}
              >
                {isLive ? 'Pause' : 'Resume'}
              </PremiumButton>
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
          {statusFilters.map((filter) => (
            <div key={filter.key} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{filter.count}</div>
                  <div className="text-sm text-gray-600">{filter.label}</div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center">
                  {filter.key === 'all' && <Bell className="w-6 h-6 text-amber-600" />}
                  {filter.key === 'PENDING' && <Clock className="w-6 h-6 text-yellow-600" />}
                  {filter.key === 'PREPARING' && <ChefHat className="w-6 h-6 text-orange-600" />}
                  {filter.key === 'READY' && <CheckCircle className="w-6 h-6 text-green-600" />}
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2 mb-6 overflow-x-auto"
        >
          {statusFilters.map((filter) => (
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
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredOrders.map((order, index) => (
              <OrderCard
                key={order.id}
                order={order}
                index={index}
                onClick={onOrderClick}
                onStatusUpdate={onStatusUpdate}
              />
            ))}
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

// Export with error boundary
export function LiveOrderFeed(props: LiveOrderFeedProps) {
  return <LiveOrderFeedContent {...props} />
}
