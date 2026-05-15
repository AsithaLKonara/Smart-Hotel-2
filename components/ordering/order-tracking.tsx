"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, CheckCircle, ChefHat, Truck, Bell, MapPin, Phone } from "lucide-react"
import { PremiumButton } from "../ui/premium-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    progress: 20
  },
  CONFIRMED: {
    label: 'Order Confirmed',
    description: 'Your order has been confirmed by our kitchen',
    icon: CheckCircle,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    progress: 40
  },
  PREPARING: {
    label: 'Preparing',
    description: 'Our chefs are preparing your delicious meal',
    icon: ChefHat,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    progress: 60
  },
  READY: {
    label: 'Ready for Delivery',
    description: 'Your order is ready and will be delivered shortly',
    icon: Truck,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    progress: 80
  },
  DELIVERED: {
    label: 'Delivered',
    description: 'Your order has been delivered to your room',
    icon: CheckCircle,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    progress: 100
  },
  CANCELLED: {
    label: 'Cancelled',
    description: 'Your order has been cancelled',
    icon: Clock,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    progress: 0
  }
}

export function OrderTracking({ orderId, onOrderComplete, onNewOrder }: OrderTrackingProps) {
  const [order, setOrder] = useState<OrderStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<string[]>([])
  const router = useRouter()

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
        
        if (order && order.status !== transformedOrder.status) {
          const config = statusConfig[transformedOrder.status]
          setNotifications(prev => [...prev, `${config.label}: ${config.description}`])
          
          setTimeout(() => {
            setNotifications(prev => prev.slice(1))
          }, 5000)
          
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

  useEffect(() => {
    fetchOrderStatus()
    const interval = setInterval(fetchOrderStatus, 5000)
    return () => clearInterval(interval)
  }, [fetchOrderStatus])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8 text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-serif font-bold text-white">Order Not Found</h2>
            <p className="text-white/40">We couldn't find an order with that ID.</p>
          </div>
          <Button onClick={() => router.push('/dashboard/dining')} className="bg-primary hover:bg-primary/90 text-white rounded-xl h-12 px-8">
            Place New Order
          </Button>
        </div>
      </div>
    )
  }

  const currentStatusConfig = statusConfig[order.status]
  const StatusIcon = currentStatusConfig.icon

  return (
    <div className="space-y-10">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {notifications.map((notification, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.8 }}
              className="bg-[#121212] border border-white/10 rounded-2xl p-4 shadow-2xl max-w-sm"
            >
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <div className="font-bold text-white text-sm">Order Update</div>
                  <div className="text-xs text-white/40">{notification}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Status Card */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="bg-[#0c0c0c] border-white/5 p-10 rounded-[40px] shadow-2xl relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-64 h-64 blur-[100px] -mr-32 -mt-32 opacity-20 transition-all ${currentStatusConfig.bgColor.replace('bg-', 'bg-')}`} />
            
            <div className="relative z-10 flex items-center justify-between mb-10">
              <div className="flex items-center gap-6">
                <div className={cn("w-20 h-20 rounded-3xl flex items-center justify-center transition-all group-hover:scale-110", currentStatusConfig.bgColor)}>
                  <StatusIcon className={cn("w-10 h-10", currentStatusConfig.color)} />
                </div>
                <div>
                  <h2 className="text-3xl font-serif font-bold text-white">{currentStatusConfig.label}</h2>
                  <p className="text-white/40 text-sm mt-1">{currentStatusConfig.description}</p>
                </div>
              </div>
              
              {order.estimatedTime && order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                <div className="text-right p-6 bg-white/5 rounded-3xl border border-white/5">
                  <div className="text-4xl font-serif font-bold text-primary">{order.estimatedTime}</div>
                  <div className="text-[10px] text-white/20 font-black uppercase tracking-widest mt-1">minutes</div>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mb-12 space-y-4">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/20">
                <span>Preparation Journey</span>
                <span className="text-primary">{currentStatusConfig.progress}% Complete</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${currentStatusConfig.progress}%` }}
                  transition={{ duration: 1.5, ease: 'circOut' }}
                  className="bg-primary h-full rounded-full shadow-[0_0_20px_rgba(var(--primary),0.5)]"
                />
              </div>
            </div>

            {/* Timeline */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              {Object.entries(statusConfig).filter(([s]) => s !== 'CANCELLED').map(([status, config], index) => {
                const isCompleted = currentStatusConfig.progress >= config.progress
                const isCurrent = order.status === status
                const Icon = config.icon

                return (
                  <div key={status} className="relative group">
                    <div className={cn(
                      "flex flex-col items-center gap-4 p-4 rounded-2xl transition-all border",
                      isCurrent ? "bg-primary/10 border-primary/20" : "bg-transparent border-transparent",
                      !isCompleted && "opacity-20"
                    )}>
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                        isCompleted ? config.bgColor : "bg-white/5"
                      )}>
                        <Icon className={cn(
                          "w-5 h-5",
                          isCompleted ? config.color : "text-white/20"
                        )} />
                      </div>
                      <span className={cn(
                        "text-[8px] font-black uppercase tracking-tighter text-center leading-none",
                        isCompleted ? "text-white" : "text-white/20"
                      )}>
                        {config.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Order Details */}
          <Card className="bg-[#0c0c0c] border-white/5 rounded-[40px] shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-white/5 bg-white/[0.02]">
              <h3 className="text-xl font-serif font-bold text-white">Order Details</h3>
            </div>
            <div className="p-8 divide-y divide-white/5">
              {order.items.map((item, index) => (
                <div key={index} className="py-4 flex justify-between items-center group">
                  <div>
                    <div className="font-bold text-white group-hover:text-primary transition-colors">{item.name}</div>
                    {item.specialRequests && (
                      <div className="text-xs text-amber-500 mt-1 italic">"{item.specialRequests}"</div>
                    )}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xs font-black text-white/40">
                    ×{item.quantity}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-8 bg-white/[0.02] flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Total Billable Amount</span>
              <span className="text-3xl font-serif font-bold text-primary">${order.totalAmount.toFixed(2)}</span>
            </div>
          </Card>
        </div>

        {/* Sidebar Support */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="bg-primary/5 border-primary/20 p-8 rounded-[40px] space-y-6">
            <div className="space-y-2">
              <h4 className="font-bold text-white">Need Assistance?</h4>
              <p className="text-xs text-white/40 leading-relaxed">Our concierge is standing by to assist with your order or any special dietary requirements.</p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-[#0c0c0c] border border-white/5 rounded-2xl">
                <Phone className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs font-bold text-white">Call Kitchen</p>
                  <p className="text-[10px] text-white/20 font-black">Ext. 1234</p>
                </div>
              </div>
              <Button className="w-full h-12 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                Connect via Live Chat
              </Button>
            </div>
          </Card>

          <Button 
            onClick={() => router.push('/dashboard/dining')}
            variant="outline" 
            className="w-full h-16 border-white/5 bg-[#0c0c0c] text-white rounded-3xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-white/5 transition-all shadow-2xl"
          >
            Return to Dining
          </Button>
        </div>
      </div>
    </div>
  )
}

