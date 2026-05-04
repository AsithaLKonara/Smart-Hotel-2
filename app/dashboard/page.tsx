"use client"

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { 
  CalendarDays, 
  UtensilsCrossed, 
  Settings, 
  User, 
  LogOut,
  MapPin,
  Clock,
  Sparkles,
  ChevronRight,
  Bell
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { signOut } from 'next-auth/react'
import { PremiumSpinner } from '@/components/ui/premium-spinner'

export default function GuestDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center">
         <PremiumSpinner size="lg" text="Loading your sanctuary..." />
      </div>
    )
  }

  const firstName = session.user?.name?.split(' ')[0] || 'Guest'

  const quickActions = [
    {
      title: 'My Bookings',
      description: 'View upcoming stays and history',
      icon: CalendarDays,
      href: '/my-bookings',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20'
    },
    {
      title: 'Room Service',
      description: 'Order food and beverages',
      icon: UtensilsCrossed,
      href: '/order',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20'
    },
    {
      title: 'Account Settings',
      description: 'Manage your profile and preferences',
      icon: Settings,
      href: '#',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="bg-midnight rounded-3xl p-8 lg:p-12 text-white relative overflow-hidden shadow-2xl mb-8">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1200')] opacity-20 object-cover bg-center"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-midnight via-midnight/80 to-transparent"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 text-luxury uppercase tracking-widest text-xs font-bold mb-4">
                <Sparkles className="w-4 h-4" />
                <span>Guest Portal</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-serif font-bold mb-2">
                Welcome back, {firstName}
              </h1>
              <p className="text-gray-300 max-w-lg leading-relaxed">
                Your personal hub for managing reservations, requesting services, and exploring exclusive member benefits.
              </p>
            </div>
            
            <div className="mt-8 md:mt-0 flex items-center space-x-4">
              <Button 
                variant="outline" 
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md rounded-full px-6"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Quick Actions */}
            <div>
              <h2 className="text-xl font-serif font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {quickActions.map((action, index) => {
                  const Icon = action.icon
                  return (
                    <Link key={index} href={action.href} className="block group">
                      <div className={`p-6 bg-white rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${action.borderColor}`}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${action.bgColor}`}>
                          <Icon className={`w-6 h-6 ${action.color}`} />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-1 group-hover:text-luxury transition-colors">
                          {action.title}
                        </h3>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          {action.description}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Discover Services */}
            <div className="bg-white rounded-3xl p-8 border shadow-sm relative overflow-hidden group cursor-pointer" onClick={() => router.push('/booking')}>
              <div className="absolute right-0 top-0 w-64 h-full bg-gold-gradient opacity-10 group-hover:opacity-20 transition-opacity -skew-x-12 translate-x-10"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-serif font-bold text-gray-900 mb-2">Plan Your Next Escape</h3>
                  <p className="text-gray-600 max-w-sm">Discover our exclusive suites and secure your next unforgettable stay with member rates.</p>
                </div>
                <div className="w-12 h-12 bg-midnight text-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ChevronRight className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-8">
            
            {/* Profile Card */}
            <div className="bg-white rounded-3xl p-6 border shadow-sm flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 border-2 border-luxury/20">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-bold text-lg text-gray-900">{session.user?.name}</h3>
              <p className="text-sm text-gray-500 mb-4">{session.user?.email}</p>
              <div className="w-full flex items-center justify-center space-x-2 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold uppercase tracking-widest">
                <CheckCircle className="w-4 h-4" />
                <span>Verified Member</span>
              </div>
            </div>

            {/* Help / Concierge */}
            <div className="bg-gradient-to-br from-midnight to-gray-900 rounded-3xl p-6 text-white text-center">
               <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                 <Bell className="w-5 h-5 text-luxury" />
               </div>
               <h3 className="font-serif font-bold text-lg mb-2">Need Assistance?</h3>
               <p className="text-sm text-gray-300 mb-6 leading-relaxed">
                 Our digital concierge is available 24/7 to assist with your requests.
               </p>
               <Button className="w-full bg-gold-gradient text-white border-none rounded-xl hover:opacity-90 transition-opacity">
                 Open Concierge
               </Button>
            </div>
            
          </div>

        </div>
      </div>
    </div>
  )
}

function CheckCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}
