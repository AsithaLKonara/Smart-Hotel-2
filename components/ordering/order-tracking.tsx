"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, CheckCircle, ChefHat, Truck, Bell, MapPin, Phone } from "lucide-react"
import { PremiumButton } from "../ui/premium-button"
import { cn } from "@/lib/utils"

interface OrderStatus {
  id: string
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED'
  estimatedTime?: number
  actualTime?: Date
  items: Array<{
    name: string
    quantity: number
    specialRequests?: string
  }>
  totalAmount: number
  roomNumber: string
  createdAt: Date
  updatedAt: Date
}

interface OrderTrackingProps {
  orderId: string
  onOrderComplete?: () => void
  onNewOrder?: () => void
}

const statusConfig = {
  PENDING: {
    label: 'Order Received',
    description: 'Your order has been received and is being processed',
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    progress: 20
  },
  CONFIRMED: {
    label: 'Order Confirmed',
    description: 'Your order has been confirmed by our kitchen',
    icon: CheckCircle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    progress: 40
  },
  PREPARING: {
    label: 'Preparing',
    description: 'Our chefs are preparing your delicious meal',
    icon: ChefHat,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    progress: 60
  },
  READY: {
    label: 'Ready for Delivery',
    description: 'Your order is ready and will be delivered shortly',
    icon: Truck,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    progress: 80
  },
  DELIVERED: {
    label: 'Delivered',
    description: 'Your order has been delivered to your room',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    progress: 100
  },
  CANCELLED: {
    label: 'Cancelled',
    description: 'Your order has been cancelled',
    icon: Clock,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    progress: 0
  }
}

export function OrderTracking({ orderId, onOrderComplete, onNewOrder }: OrderTrackingProps) {
  const [order, setOrder] = useState<OrderStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<string[]>([])

  const fetchOrderStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/restaurant/orders/${orderId}`)
      if (response.ok) {
        const data = await response.json()
        
        const transformedOrder: OrderStatus = {
          id: data.id,
          status: data.status,
          estimatedTime: data.deliveryTime ? 
            Math.round((new Date(data.deliveryTime).getTime() - Date.now()) / 60000) : 20,
          items: data.items?.map((item: any) => ({
            name: item.menu?.name || 'Item',
            quantity: item.quantity,
            specialRequests: item.notes
          })) || [],
          totalAmount: data.totalAmount,
          roomNumber: data.roomNumber,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt)
        }
        
        // Check for status change and add notification
        if (order && order.status !== transformedOrder.status) {
          const config = statusConfig[transformedOrder.status]
          setNotifications(prev => [...prev, `${config.label}: ${config.description}`])
          
          // Clear notification after 5 seconds
          setTimeout(() => {
            setNotifications(prev => prev.slice(1))
          }, 5000)
          
          // Call completion callback when delivered
          if (transformedOrder.status === 'DELIVERED' && onOrderComplete) {
            setTimeout(() => onOrderComplete(), 2000)
          }
        }
        
        setOrder(transformedOrder)
      }
    } catch (error) {
      console.error('Failed to fetch order:', error)
    } finally {
      setLoading(false)
    }
  }, [orderId, order, onOrderComplete])

  // Fetch real order data from API
  useEffect(() => {
    fetchOrderStatus()
    
    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      fetchOrderStatus()
    }, 5000)

    return () => clearInterval(interval)
  }, [fetchOrderStatus])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">We couldn't find an order with that ID.</p>
          <PremiumButton onClick={onNewOrder}>
            Place New Order
          </PremiumButton>
        </div>
      </div>
    )
  }

  const currentStatusConfig = statusConfig[order.status]
  const StatusIcon = currentStatusConfig.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {notifications.map((notification, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.8 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-lg max-w-sm"
            >
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-amber-600" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Order Update</div>
                  <div className="text-sm text-gray-600">{notification}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <StatusIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Tracking</h1>
          <p className="text-gray-600">Order #{order.id} • Room {order.roomNumber}</p>
        </motion.div>

        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={cn("w-16 h-16 rounded-full flex items-center justify-center", currentStatusConfig.bgColor)}>
                <StatusIcon className={cn("w-8 h-8", currentStatusConfig.color)} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{currentStatusConfig.label}</h2>
                <p className="text-gray-600">{currentStatusConfig.description}</p>
              </div>
            </div>
            
            {order.estimatedTime && order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
              <div className="text-right">
                <div className="text-3xl font-bold text-amber-600">{order.estimatedTime}</div>
                <div className="text-sm text-gray-500">minutes</div>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{currentStatusConfig.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${currentStatusConfig.progress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="bg-gradient-to-r from-amber-500 to-amber-600 h-2 rounded-full"
              />
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            {Object.entries(statusConfig).map(([status, config], index) => {
              const isCompleted = currentStatusConfig.progress > config.progress
              const isCurrent = order.status === status
              const Icon = config.icon

              return (
                <motion.div
                  key={status}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className={cn(
                    "flex items-center gap-4 p-3 rounded-lg transition-all",
                    isCurrent && "bg-amber-50 border border-amber-200",
                    isCompleted && !isCurrent && "opacity-60"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    isCompleted ? config.bgColor : "bg-gray-100"
                  )}>
                    <Icon className={cn(
                      "w-4 h-4",
                      isCompleted ? config.color : "text-gray-400"
                    )} />
                  </div>
                  <div className="flex-1">
                    <div className={cn(
                      "font-medium",
                      isCompleted ? "text-gray-900" : "text-gray-500"
                    )}>
                      {config.label}
                    </div>
                    <div className="text-sm text-gray-500">{config.description}</div>
                  </div>
                  {isCurrent && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-3 h-3 bg-amber-500 rounded-full"
                    />
                  )}
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Order Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Order Details</h3>
          
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex justify-between items-center py-2"
              >
                <div>
                  <div className="font-medium text-gray-900">{item.name}</div>
                  {item.specialRequests && (
                    <div className="text-sm text-amber-600">{item.specialRequests}</div>
                  )}
                </div>
                <div className="text-gray-600">×{item.quantity}</div>
              </motion.div>
            ))}
          </div>
          
          <div className="border-t border-gray-100 pt-4 mt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-amber-600">${order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </motion.div>

        {/* Contact Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-2xl p-6"
        >
          <h3 className="text-xl font-semibold mb-4">Need Help?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5" />
              <div>
                <div className="font-medium">Call Room Service</div>
                <div className="text-teal-100">Ext. 1234</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5" />
              <div>
                <div className="font-medium">Room {order.roomNumber}</div>
                <div className="text-teal-100">Your delivery location</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mt-8"
        >
          <PremiumButton
            variant="outline"
            onClick={onNewOrder}
            className="px-8"
          >
            Place New Order
          </PremiumButton>
          
          {order.status === 'DELIVERED' && (
            <PremiumButton
              variant="primary"
              onClick={() => window.location.reload()}
              className="px-8"
            >
              Track Another Order
            </PremiumButton>
          )}
        </motion.div>
      </div>
    </div>
  )
}

