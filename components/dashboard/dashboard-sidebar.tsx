'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  LayoutDashboard, Bed, Calendar, Users, ClipboardList, UtensilsCrossed, 
  ShoppingCart, Package, Image as ImageIcon, QrCode, BarChart3, LogOut, 
  UserCheck, Menu, X, Settings as SettingsIcon, ChevronLeft, ChevronRight, 
  ChevronDown, MessageSquare, AlertTriangle, Home, User, CreditCard, Star, 
  Grid, Globe, ShieldCheck, Activity, History, Box, Gift, Building2, FileText, 
  Moon, Brush, Wrench, TrendingUp, CalendarDays, Plane, Truck, FileCheck,
  Briefcase, CalendarRange, Clock, CircleDollarSign, CalendarClock, ClipboardCheck, 
  Award, MessageCircle, PieChart, Link as LinkIcon, Palmtree
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSidebar } from '@/lib/sidebar-context'
import { cn } from '@/lib/utils'
import { PropertySwitcher } from './property-switcher'

interface NavItem {
  name: string
  href: string
  icon: any
  roles: string[]
  group?: string
}

export default function DashboardSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { isCollapsed, isMobileOpen, toggleSidebar, toggleMobileMenu, closeMobileMenu } = useSidebar()
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'Front Desk & Bookings': true,
    'Financials & Revenue': true,
    'Operations & Inventory': true,
    'Management & CRM': true,
    'Platform Settings': false
  })

  const rawRole = session?.user?.roleName || (session?.user as any)?.role?.name || (session?.user as any)?.role;
  const role = rawRole === 'ADMIN' ? 'SUPER_ADMIN' : rawRole;

  const toggleGroup = (group: string) => {
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }))
  }

  const getNavigation = () => {
    const items: NavItem[] = [
      // 🌐 UNIFIED DASHBOARD LINKS (NO GROUP)
      { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['GUEST'] },
      { name: 'Dashboard', href: '/kitchen/dashboard', icon: UtensilsCrossed, roles: ['KITCHEN'] },
      { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, roles: ['MANAGER', 'SUPER_ADMIN'] },
      { name: 'Dashboard', href: '/admin/receptionist', icon: LayoutDashboard, roles: ['RECEPTIONIST'] },
      { name: 'Dashboard', href: '/admin/tasks', icon: LayoutDashboard, roles: ['HOUSEKEEPING', 'MAINTENANCE'] },

      // 🟢 GUEST SUITE (NO GROUP)
      { name: 'Dining Hub', href: '/dashboard/dining', icon: UtensilsCrossed, roles: ['GUEST'] },
      { name: 'Service Requests', href: '/dashboard/requests', icon: ClipboardList, roles: ['GUEST'] },
      { name: 'Resolution Desk', href: '/dashboard/complaints', icon: AlertTriangle, roles: ['GUEST'] },
      { name: 'Elite Rewards', href: '/dashboard/loyalty', icon: Gift, roles: ['GUEST'] },
      { name: 'Financials', href: '/dashboard/spending', icon: CreditCard, roles: ['GUEST'] },
      { name: 'Memories', href: '/dashboard/reviews', icon: Star, roles: ['GUEST'] },
      { name: 'Profile Settings', href: '/profile', icon: User, roles: ['GUEST'] },

      // 🟠 KITCHEN COMMAND (NO GROUP)
      { name: 'Point of Sale', href: '/kitchen/pos', icon: ShoppingCart, roles: ['KITCHEN'] },
      
      // ==========================================
      // GROUPED ADMIN SECTIONS
      // ==========================================

      // 🔵 FRONT DESK & BOOKINGS
      { name: 'Front Desk', href: '/admin/receptionist', icon: UserCheck, roles: ['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'], group: 'Front Desk & Bookings' },
      { name: 'Point of Sale', href: '/admin/pos', icon: ShoppingCart, roles: ['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'], group: 'Front Desk & Bookings' },
      { name: 'Reservations', href: '/admin/bookings', icon: CalendarDays, roles: ['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'], group: 'Front Desk & Bookings' },
      { name: 'Resort & Spa', href: '/admin/resort', icon: Palmtree, roles: ['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'], group: 'Front Desk & Bookings' },

      // 🟢 FINANCIALS & REVENUE
      { name: 'Yield Engine', href: '/admin/yield', icon: TrendingUp, roles: ['MANAGER', 'SUPER_ADMIN'], group: 'Financials & Revenue' },
      { name: 'Folios & Billing', href: '/admin/accounting/folios', icon: CreditCard, roles: ['MANAGER', 'SUPER_ADMIN'], group: 'Financials & Revenue' },
      { name: 'Night Audit', href: '/admin/accounting/night-audit', icon: Moon, roles: ['MANAGER', 'SUPER_ADMIN'], group: 'Financials & Revenue' },

      // 🧹 OPERATIONS & INVENTORY
      { name: 'Room Directory', href: '/admin/rooms', icon: Bed, roles: ['MANAGER', 'SUPER_ADMIN'], group: 'Operations & Inventory' },
      { name: 'Room Types', href: '/admin/room-types', icon: ImageIcon, roles: ['MANAGER', 'SUPER_ADMIN'], group: 'Operations & Inventory' },
      { name: 'Housekeeping', href: '/admin/housekeeping', icon: Brush, roles: ['HOUSEKEEPING', 'MANAGER', 'SUPER_ADMIN'], group: 'Operations & Inventory' },
      { name: 'Service Tickets', href: '/admin/maintenance/tickets', icon: Wrench, roles: ['MAINTENANCE', 'MANAGER', 'SUPER_ADMIN', 'RECEPTIONIST'], group: 'Operations & Inventory' },
      { name: 'Preventative Schedules', href: '/admin/maintenance/schedules', icon: CalendarClock, roles: ['MAINTENANCE', 'MANAGER', 'SUPER_ADMIN'], group: 'Operations & Inventory' },
      { name: 'Inspection Logs', href: '/admin/maintenance/inspections', icon: ClipboardCheck, roles: ['MAINTENANCE', 'MANAGER', 'SUPER_ADMIN'], group: 'Operations & Inventory' },
      { name: 'Event Command', href: '/admin/events/dashboard', icon: CalendarDays, roles: ['MANAGER', 'SUPER_ADMIN'], group: 'Operations & Inventory' },
      { name: 'Master Inventory', href: '/admin/inventory', icon: Box, roles: ['MANAGER', 'SUPER_ADMIN', 'RECEPTIONIST', 'HOUSEKEEPING', 'MAINTENANCE', 'KITCHEN'], group: 'Operations & Inventory' },
      { name: 'Procurement', href: '/admin/procurement/orders', icon: FileCheck, roles: ['MANAGER', 'SUPER_ADMIN'], group: 'Operations & Inventory' },
      
      // 👥 HUMAN RESOURCES
      { name: 'Employee Directory', href: '/admin/hr/employees', icon: Briefcase, roles: ['MANAGER', 'SUPER_ADMIN'], group: 'Human Resources' },
      { name: 'Shift Roster', href: '/admin/hr/shifts', icon: Clock, roles: ['MANAGER', 'SUPER_ADMIN'], group: 'Human Resources' },
      { name: 'Payroll Center', href: '/admin/hr/payroll', icon: CircleDollarSign, roles: ['MANAGER', 'SUPER_ADMIN'], group: 'Human Resources' },

      // 🔴 MANAGEMENT & CRM
      { name: 'Enterprise BI', href: '/admin/analytics/bi', icon: PieChart, roles: ['MANAGER', 'SUPER_ADMIN'], group: 'Management & CRM' },
      { name: 'Operations Map', href: '/admin/manager', icon: BarChart3, roles: ['MANAGER', 'SUPER_ADMIN'], group: 'Management & CRM' },
      { name: 'Guest CRM', href: '/admin/crm/guests', icon: UserCheck, roles: ['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'], group: 'Management & CRM' },
      { name: 'Travel Agents', href: '/admin/crm/travel-agents', icon: Plane, roles: ['MANAGER', 'SUPER_ADMIN'], group: 'Management & CRM' },
      { name: 'Corporate B2B', href: '/admin/crm/corporate', icon: Building2, roles: ['MANAGER', 'SUPER_ADMIN'], group: 'Management & CRM' },
      { name: 'Global Properties', href: '/admin/corporate/properties', icon: Globe, roles: ['SUPER_ADMIN'], group: 'Management & CRM' },
      
      // ⚙️ PLATFORM SETTINGS
      { name: 'System Settings', href: '/admin/settings', icon: SettingsIcon, roles: ['MANAGER', 'SUPER_ADMIN'], group: 'Platform Settings' },
      { name: 'App Integrations', href: '/admin/settings/integrations', icon: LinkIcon, roles: ['SUPER_ADMIN'], group: 'Platform Settings' },
      { name: 'Security (RBAC)', href: '/admin/roles', icon: ShieldCheck, roles: ['SUPER_ADMIN'], group: 'Platform Settings' },
      { name: 'Audit Stream', href: '/admin/audit-logs', icon: History, roles: ['SUPER_ADMIN'], group: 'Platform Settings' }
    ]

    if (role === 'KITCHEN') {
      items.push({ name: 'Report Issue', href: '/kitchen/complain', icon: AlertTriangle, roles: ['KITCHEN'] })
    }

    return items.filter(item => item.roles.includes(role || ''))
  }

  const navigation = getNavigation()

  // Group items
  const ungroupedItems = navigation.filter(i => !i.group)
  const groupedItems = navigation.filter(i => i.group).reduce((acc, item) => {
    if (!acc[item.group!]) acc[item.group!] = []
    acc[item.group!].push(item)
    return acc
  }, {} as Record<string, NavItem[]>)

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0c0c0c]">
      <div className={cn("p-6 border-b border-white/5 flex items-center justify-between", isCollapsed && "p-4 justify-center")}>
        <Link href="/" className="flex items-center space-x-3 overflow-hidden">
          <div className="flex-shrink-0 w-10 h-10 bg-gold-gradient rounded-xl flex items-center justify-center shadow-luxury">
            <span className="text-white font-bold text-lg">SH</span>
          </div>
          {!isCollapsed && (
            <div className="transition-all duration-300">
              <div className="text-lg font-bold text-white leading-tight">SmartHotel</div>
              <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Experience Elite</p>
            </div>
          )}
        </Link>
      </div>

      <div className={cn("p-4 border-b border-white/5 transition-all duration-300", isCollapsed && "p-2")}>
        <div className={cn("flex items-center space-x-3 px-3 py-2 rounded-xl bg-white/5", isCollapsed && "px-1 justify-center")}>
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 border border-primary/30">
            <span className="text-primary font-bold text-xs">
              {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0 transition-all duration-300">
              <p className="text-sm font-bold text-white truncate">{session?.user?.name || 'User'}</p>
              <p className="text-[10px] text-white/40 truncate uppercase tracking-tighter">{rawRole || 'Guest'}</p>
            </div>
          )}
        </div>
        {!isCollapsed && ['MANAGER', 'SUPER_ADMIN'].includes(role) && (
          <div className="mt-4">
            <PropertySwitcher />
          </div>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">
        {/* Ungrouped Links (Dashboard, Guest stuff) */}
        {ungroupedItems.length > 0 && (
          <div className="space-y-1">
            {ungroupedItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                    isActive ? 'bg-primary/20 text-primary border border-primary/30 shadow-luxury' : 'text-white/50 hover:bg-white/5 hover:text-white',
                    isCollapsed && "justify-center px-0"
                  )}
                >
                  <Icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-white" : "group-hover:scale-110 transition-transform")} />
                  {!isCollapsed && <span className="text-sm font-medium">{item.name}</span>}
                </Link>
              )
            })}
          </div>
        )}

        {/* Grouped Accordions */}
        {!isCollapsed && Object.keys(groupedItems).map((groupName) => {
          const items = groupedItems[groupName]
          const isOpen = openGroups[groupName]
          return (
            <div key={groupName} className="space-y-1">
              <button 
                onClick={() => toggleGroup(groupName)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-white/40 uppercase tracking-wider hover:text-white/70 transition-colors"
              >
                <span>{groupName}</span>
                <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen ? "rotate-180" : "rotate-0")} />
              </button>
              {isOpen && (
                <div className="space-y-1 pl-2 border-l border-white/5 ml-4">
                  {items.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={closeMobileMenu}
                        className={cn(
                          "flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 group",
                          isActive ? 'text-primary bg-primary/10' : 'text-white/50 hover:text-white hover:bg-white/5'
                        )}
                      >
                        <Icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-primary" : "group-hover:scale-110")} />
                        <span className="text-sm">{item.name}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {/* Render flat icons for grouped items if sidebar is collapsed */}
        {isCollapsed && Object.keys(groupedItems).map((groupName) => (
          <div key={groupName} className="space-y-1 pt-2 border-t border-white/5">
            {groupedItems[groupName].map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={closeMobileMenu}
                  title={item.name}
                  className={cn(
                    "flex items-center justify-center space-x-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                    isActive ? 'bg-primary/20 text-primary border border-primary/30 shadow-luxury' : 'text-white/50 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-white" : "group-hover:scale-110 transition-transform")} />
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5">
        <Button
          variant="outline"
          className={cn(
            "w-full transition-all duration-300 border-white/10 bg-white/5 text-white/60 hover:bg-red-900/20 hover:text-red-400 hover:border-red-900/30",
            isCollapsed ? "justify-center px-0" : "justify-start px-4"
          )}
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          <LogOut className="w-4 h-4" />
          {!isCollapsed && <span className="ml-3 text-xs font-bold uppercase tracking-widest">Logout</span>}
        </Button>
      </div>

      <button
        onClick={toggleSidebar}
        className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-black/70 backdrop-blur-md border border-white/10 rounded-full items-center justify-center shadow-luxury hover:border-primary/40 transition-colors z-50"
      >
        {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </div>
  )

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-black/70 backdrop-blur-xl border-b border-white/5 p-4 hide-on-print">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gold-gradient rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">SH</span>
            </div>
            <span className="font-bold text-white uppercase tracking-tighter tracking-widest text-[10px]">SmartHotel</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileMenu}
            className="text-white hover:bg-white/10"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={closeMobileMenu}>
          <div
            className="fixed inset-y-0 left-0 w-72 bg-[#0c0c0c] border-r border-white/5 shadow-2xl flex flex-col animate-in slide-in-from-left duration-300"
            onClick={(e: any) => e.stopPropagation()}
          >
            <SidebarContent />
          </div>
        </div>
      )}

      <aside className={cn(
        "hidden lg:flex fixed left-0 top-0 bottom-0 bg-[#0c0c0c] border-r border-white/5 flex-col transition-all duration-300 z-40 hide-on-print",
        isCollapsed ? "w-20" : "w-64"
      )}>
        <SidebarContent />
      </aside>
    </>
  )
}
