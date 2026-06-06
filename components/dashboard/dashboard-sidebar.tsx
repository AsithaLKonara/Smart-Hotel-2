'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  LayoutDashboard, Bed, Calendar, Users, ClipboardList, UtensilsCrossed, 
  ShoppingCart, Package, Image as ImageIcon, QrCode, BarChart3, LogOut, 
  UserCheck, Menu, X, Settings as SettingsIcon, ChevronLeft, ChevronRight, 
  MessageSquare, AlertTriangle, Home, User, CreditCard, Star, Grid, Globe, 
  ShieldCheck, Activity, History, Box, Gift, Building2, FileText, Moon, 
  Brush, Wrench, TrendingUp, Store, CalendarDays, Plane, Truck, FileCheck,
  Briefcase, CalendarRange, Clock, CircleDollarSign, CalendarClock, ClipboardCheck, Award, MessageCircle, PieChart, Link as LinkIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSidebar } from '@/lib/sidebar-context'
import { cn } from '@/lib/utils'

export default function DashboardSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { isCollapsed, isMobileOpen, toggleSidebar, toggleMobileMenu, closeMobileMenu } = useSidebar()

  const getNavigation = () => {
    const role = session?.user?.role
    
    // Define navigation items per role as requested by the user
    const items = [
      // 🌐 UNIFIED DASHBOARD LINKS (AT THE VERY TOP)
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['GUEST'] },
      { name: 'Dashboard', href: '/kitchen/dashboard', icon: LayoutDashboard, roles: ['KITCHEN'] },
      { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, roles: ['RECEPTIONIST', 'HOUSEKEEPING', 'MAINTENANCE', 'MANAGER', 'SUPER_ADMIN'] },

      // 🟢 GUEST SUITE
      { name: 'My Sanctuary', href: '/dashboard', icon: Home, roles: ['GUEST'] },
      { name: 'Dining Hub', href: '/dashboard/dining', icon: UtensilsCrossed, roles: ['GUEST'] },
      { name: 'Service Requests', href: '/dashboard/requests', icon: ClipboardList, roles: ['GUEST'] },
      { name: 'Resolution Desk', href: '/dashboard/complaints', icon: AlertTriangle, roles: ['GUEST'] },
      { name: 'Elite Rewards', href: '/dashboard/loyalty', icon: Gift, roles: ['GUEST'] },
      { name: 'Financials', href: '/dashboard/spending', icon: CreditCard, roles: ['GUEST'] },
      { name: 'Memories', href: '/dashboard/reviews', icon: Star, roles: ['GUEST'] },
      { name: 'Profile Settings', href: '/profile', icon: User, roles: ['GUEST'] },

      // 🟠 KITCHEN COMMAND
      { name: 'Execution Deck', href: '/kitchen/dashboard', icon: UtensilsCrossed, roles: ['KITCHEN'] },
      { name: 'Point of Sale', href: '/kitchen/pos', icon: ShoppingCart, roles: ['KITCHEN'] },
      
      // 🔵 FRONT DESK OPERATIONS
      { name: 'Reception Rack', href: '/admin/receptionist', icon: Bed, roles: ['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'] },
      { name: 'Point of Sale', href: '/admin/pos', icon: ShoppingCart, roles: ['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'] },
      { name: 'Live Bookings', href: '/admin/bookings', icon: Calendar, roles: ['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'] },
      { name: 'Inventory Engine', href: '/admin/inventory', icon: Box, roles: ['MANAGER', 'SUPER_ADMIN'] },
      
      // 🧹 HOUSEKEEPING & MAINTENANCE
      { name: 'Room Status', href: '/admin/housekeeping', icon: Bed, roles: ['HOUSEKEEPER', 'MANAGER', 'SUPER_ADMIN'] },
      { name: 'Service Tickets', href: '/admin/maintenance', icon: Wrench, roles: ['MAINTENANCE', 'MANAGER', 'SUPER_ADMIN'] },
      { name: 'Asset Registry', href: '/admin/maintenance/assets', icon: Box, roles: ['MAINTENANCE', 'MANAGER', 'SUPER_ADMIN'] },
      { name: 'Preventative Schedules', href: '/admin/maintenance/schedules', icon: CalendarClock, roles: ['MAINTENANCE', 'MANAGER', 'SUPER_ADMIN'] },
      { name: 'Inspection Logs', href: '/admin/maintenance/inspections', icon: ClipboardCheck, roles: ['MAINTENANCE', 'MANAGER', 'SUPER_ADMIN'] },

      // 🟢 REVENUE MANAGEMENT
      { name: 'Yield Engine', href: '/admin/yield', icon: TrendingUp, roles: ['MANAGER', 'SUPER_ADMIN'] },

      // 🛒 ENTERPRISE POS
      { name: 'POS Terminal', href: '/admin/pos/terminal', icon: Store, roles: ['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'] },

      // 🎉 EVENTS & BANQUETING
      { name: 'Event Command Center', href: '/admin/events/dashboard', icon: CalendarDays, roles: ['MANAGER', 'SUPER_ADMIN'] },

      // 📦 PROCUREMENT & INVENTORY
      { name: 'Vendors & Suppliers', href: '/admin/procurement/vendors', icon: Truck, roles: ['MANAGER', 'SUPER_ADMIN'] },
      { name: 'Master Inventory', href: '/admin/procurement/items', icon: Package, roles: ['MANAGER', 'SUPER_ADMIN'] },
      { name: 'Purchase Orders', href: '/admin/procurement/orders', icon: FileCheck, roles: ['MANAGER', 'SUPER_ADMIN'] },

      // 👥 HUMAN RESOURCES (HR)
      { name: 'Employee Directory', href: '/admin/hr/employees', icon: Briefcase, roles: ['MANAGER', 'SUPER_ADMIN'] },
      { name: 'Shift Roster', href: '/admin/hr/shifts', icon: Clock, roles: ['MANAGER', 'SUPER_ADMIN'] },
      { name: 'Leave Management', href: '/admin/hr/leaves', icon: CalendarRange, roles: ['MANAGER', 'SUPER_ADMIN'] },
      { name: 'Payroll Center', href: '/admin/hr/payroll', icon: CircleDollarSign, roles: ['MANAGER', 'SUPER_ADMIN'] },

      // 🔴 MANAGEMENT & GOVERNANCE
      { name: 'Enterprise BI', href: '/admin/analytics/bi', icon: PieChart, roles: ['MANAGER', 'SUPER_ADMIN'] },
      { name: 'Operations Map', href: '/admin/manager', icon: BarChart3, roles: ['MANAGER', 'SUPER_ADMIN'] },
      { name: 'Guest CRM', href: '/admin/crm/guests', icon: UserCheck, roles: ['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'] },
      { name: 'Guest Messaging', href: '/admin/crm/messaging', icon: MessageCircle, roles: ['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'] },
      { name: 'System Settings', href: '/admin/settings', icon: SettingsIcon, roles: ['MANAGER', 'SUPER_ADMIN'] },
      { name: 'App Integrations', href: '/admin/settings/integrations', icon: LinkIcon, roles: ['SUPER_ADMIN'] },

      // 🌐 CORPORATE HQ (MULTI-PROPERTY)
      { name: 'Global Properties', href: '/admin/corporate/properties', icon: Globe, roles: ['SUPER_ADMIN'] },
      { name: 'Loyalty Engine', href: '/admin/corporate/loyalty', icon: Award, roles: ['SUPER_ADMIN'] },

      { name: 'Corporate B2B', href: '/admin/crm/corporate', icon: Building2, roles: ['MANAGER', 'SUPER_ADMIN'] },
      { name: 'Travel Agents', href: '/admin/crm/travel-agents', icon: Plane, roles: ['MANAGER', 'SUPER_ADMIN'] },
      { name: 'Channel Sync', href: '/admin/ota', icon: Globe, roles: ['MANAGER', 'SUPER_ADMIN'] },
      { name: 'Folios & Billing', href: '/admin/accounting/folios', icon: FileText, roles: ['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'] },
      { name: 'Night Audit', href: '/admin/accounting/night-audit', icon: Moon, roles: ['MANAGER', 'SUPER_ADMIN'] },
      { name: 'Audit Stream', href: '/admin/audit-logs', icon: History, roles: ['SUPER_ADMIN'] },
      { name: 'Security (RBAC)', href: '/admin/roles', icon: ShieldCheck, roles: ['SUPER_ADMIN'] },
      
      // 🛠 PLATFORM ENGINEERING (Hidden/SRE)
      { name: 'Chaos Console', href: '/admin/chaos', icon: Activity, roles: ['SUPER_ADMIN'] },
      { name: 'Platform Settings', href: '/admin/settings', icon: SettingsIcon, roles: ['SUPER_ADMIN'] },
    ]

    // Special items available for multiple roles (like Complaints)
    // The user specifically wants one extra option for Kitchen: "Complain to Admin"
    if (role === 'KITCHEN') {
      items.push({ name: 'Report Issue', href: '/kitchen/complain', icon: AlertTriangle, roles: ['KITCHEN'] })
    }

    return items.filter(item => item.roles.includes(role || ''))
  }

  const navigation = getNavigation()

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0c0c0c]">
      <div className={cn(
        "p-6 border-b border-white/5 flex items-center justify-between",
        isCollapsed && "p-4 justify-center"
      )}>
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

      <div className={cn(
        "p-4 border-b border-white/5 transition-all duration-300",
        isCollapsed && "p-2"
      )}>
        <div className={cn(
          "flex items-center space-x-3 px-3 py-2 rounded-xl bg-white/5",
          isCollapsed && "px-1 justify-center"
        )}>
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 border border-primary/30">
            <span className="text-primary font-bold text-xs">
              {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0 transition-all duration-300">
              <p className="text-sm font-bold text-white truncate">
                {session?.user?.name || 'User'}
              </p>
              <p className="text-[10px] text-white/40 truncate uppercase tracking-tighter">
                {session?.user?.role || 'Guest'}
              </p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={closeMobileMenu}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                isActive
                  ? 'bg-primary/20 text-primary border border-primary/30 shadow-luxury'
                  : 'text-white/50 hover:bg-white/5 hover:text-white',
                isCollapsed && "justify-center px-0"
              )}
            >
              <Icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-white" : "group-hover:scale-110 transition-transform")} />
              {!isCollapsed && <span className="text-sm font-medium">{item.name}</span>}
            </Link>
          )
        })}
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
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-black/70 backdrop-blur-xl border-b border-white/5 p-4">
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
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent />
          </div>
        </div>
      )}

      <aside className={cn(
        "hidden lg:flex fixed left-0 top-0 bottom-0 bg-[#0c0c0c] border-r border-white/5 flex-col transition-all duration-300 z-40",
        isCollapsed ? "w-20" : "w-64"
      )}>
        <SidebarContent />
      </aside>
    </>
  )
}
