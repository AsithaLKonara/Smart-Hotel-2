'use client'

import { useState, useEffect, useRef } from 'react'
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
  Award, MessageCircle, PieChart, Link as LinkIcon, Palmtree, Layers, Network
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
    'Front Desk': true,
    'Room Operations': true,
    'Billing & POS': true,
    'OTA & Rates': false,
    'Management': false
  })

  const rawRole = session?.user?.roleName || (session?.user as any)?.role?.name || (session?.user as any)?.role;
  const role = rawRole === 'ADMIN' ? 'SUPER_ADMIN' : rawRole;

  const toggleGroup = (group: string) => {
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }))
  }

  // Auto-scroll active item into view and ensure its group is open
  useEffect(() => {
    const activeItem = getNavigation().find(i => 
      pathname === i.href || (i.href !== '/admin/dashboard' && i.href !== '/dashboard' && pathname.startsWith(i.href))
    );
    
    if (activeItem && activeItem.group && !openGroups[activeItem.group]) {
      setOpenGroups(prev => ({ ...prev, [activeItem.group!]: true }))
    }
    
    // Scroll active item within the nav container only, preventing window scroll jumps
    setTimeout(() => {
      const activeEl = document.getElementById('active-sidebar-item');
      const navEl = document.getElementById('sidebar-nav-container');
      
      if (activeEl && navEl) {
        const navRect = navEl.getBoundingClientRect();
        const activeRect = activeEl.getBoundingClientRect();
        
        // If element is not fully visible, scroll the container
        if (activeRect.top < navRect.top || activeRect.bottom > navRect.bottom) {
          navEl.scrollTo({
            top: navEl.scrollTop + (activeRect.top - navRect.top) - (navRect.height / 2) + (activeRect.height / 2),
            behavior: 'smooth'
          });
        }
      }
    }, 150);
  }, [pathname]); // Exclude getNavigation and openGroups to prevent infinite loops

  const getNavigation = () => {
    const items: NavItem[] = [
      // 🌐 UNIFIED DASHBOARD LINKS FOR NON-ADMIN ROLES
      { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['GUEST'] },
      { name: 'Kitchen KDS', href: '/kitchen/dashboard', icon: UtensilsCrossed, roles: ['KITCHEN'] },

      // 🟢 GUEST SUITE (NO GROUP)
      { name: 'Dining Hub', href: '/dashboard/dining', icon: UtensilsCrossed, roles: ['GUEST'] },
      { name: 'Service Requests', href: '/dashboard/requests', icon: ClipboardList, roles: ['GUEST'] },
      { name: 'Resolution Desk', href: '/dashboard/complaints', icon: AlertTriangle, roles: ['GUEST'] },
      { name: 'Elite Rewards', href: '/dashboard/loyalty', icon: Gift, roles: ['GUEST'] },
      { name: 'Financials', href: '/dashboard/spending', icon: CreditCard, roles: ['GUEST'] },
      { name: 'Memories', href: '/dashboard/reviews', icon: Star, roles: ['GUEST'] },
      { name: 'Profile Settings', href: '/profile', icon: User, roles: ['GUEST'] },

      // 🟠 KITCHEN COMMAND (NO GROUP)
      { name: 'Kitchen POS', href: '/kitchen/pos', icon: ShoppingCart, roles: ['KITCHEN'] },
      { name: 'Menu Editor', href: '/admin/menu', icon: Layers, roles: ['KITCHEN'] },
      
      // ==========================================
      // 5 LEAN OPERATIONAL PILLARS (MID-LEVEL PMS)
      // ==========================================

      // 1. 🛎️ FRONT DESK
      { name: 'Front Desk', href: '/admin/receptionist', icon: UserCheck, roles: ['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'], group: 'Front Desk' },
      { name: 'Guest CRM', href: '/admin/crm/guests', icon: Users, roles: ['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'], group: 'Front Desk' },

      // 2. 🧹 ROOM OPERATIONS
      { name: 'Housekeeping & Maint', href: '/admin/housekeeping', icon: Brush, roles: ['HOUSEKEEPING', 'MAINTENANCE', 'RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'], group: 'Room Operations' },
      { name: 'Room Directory', href: '/admin/rooms', icon: Bed, roles: ['MANAGER', 'SUPER_ADMIN'], group: 'Room Operations' },
      { name: 'Master Inventory', href: '/admin/inventory', icon: Box, roles: ['MANAGER', 'SUPER_ADMIN', 'HOUSEKEEPING', 'MAINTENANCE'], group: 'Room Operations' },

      // 3. 💳 BILLING & POS
      { name: 'Point of Sale', href: '/admin/pos', icon: ShoppingCart, roles: ['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'], group: 'Billing & POS' },
      { name: 'Folios & Billing', href: '/admin/accounting/folios', icon: CreditCard, roles: ['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'], group: 'Billing & POS' },
      { name: 'Night Audit', href: '/admin/accounting/night-audit', icon: Moon, roles: ['MANAGER', 'SUPER_ADMIN'], group: 'Billing & POS' },

      // 4. 🌐 OTA & RATES
      { name: 'Channel Manager', href: '/admin/integrations/channel-manager', icon: Network, roles: ['MANAGER', 'SUPER_ADMIN'], group: 'OTA & Rates' },
      { name: 'Rates & Pricing', href: '/admin/pricing', icon: TrendingUp, roles: ['MANAGER', 'SUPER_ADMIN'], group: 'OTA & Rates' },

      // 5. 📊 HOTEL MANAGEMENT
      { name: 'Manager Cockpit', href: '/admin/dashboard', icon: LayoutDashboard, roles: ['MANAGER', 'SUPER_ADMIN'], group: 'Management' },
      { name: 'Website CMS', href: '/admin/cms', icon: Globe, roles: ['MANAGER', 'SUPER_ADMIN'], group: 'Management' },
      { name: 'Team & Staff', href: '/admin/staff', icon: ShieldCheck, roles: ['MANAGER', 'SUPER_ADMIN'], group: 'Management' },
      { name: 'System Settings', href: '/admin/settings', icon: SettingsIcon, roles: ['MANAGER', 'SUPER_ADMIN'], group: 'Management' },
      { name: 'Audit Stream', href: '/admin/audit-logs', icon: History, roles: ['SUPER_ADMIN'], group: 'Management' }
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
    <div className="flex flex-col h-full bg-[#090A0C]">
      {/* Brand Header */}
      <div className={cn("h-[64px] px-4 border-b border-[#1C2025] flex items-center justify-between shrink-0", isCollapsed && "px-2 justify-center")}>
        <Link href="/" className="flex items-center space-x-2.5 overflow-hidden">
          <div className="flex-shrink-0 w-8 h-8 bg-zinc-900 border border-zinc-700/60 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-mono font-black text-xs">SH</span>
          </div>
          {!isCollapsed && (
            <div className="flex items-center gap-2 transition-all duration-300">
              <span className="text-sm font-bold text-white tracking-tight">SmartHotel</span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/30 uppercase tracking-wider">
                ELITE
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* User Info / Property Switcher */}
      <div className={cn("p-3 border-b border-[#1C2025] transition-all duration-300 shrink-0", isCollapsed && "p-2")}>
        <div className={cn("flex items-center space-x-2.5 p-2 rounded-lg bg-[#121417] border border-[#1E2227]", isCollapsed && "p-1 justify-center")}>
          <div className="w-7 h-7 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center flex-shrink-0 text-white font-mono font-bold text-xs">
            {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0 transition-all duration-300">
              <p className="text-xs font-semibold text-white truncate leading-tight">{session?.user?.name || 'Administrator'}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-[10px] text-zinc-400 truncate uppercase font-mono font-medium">{rawRole || 'Staff'}</p>
              </div>
            </div>
          )}
        </div>
        {!isCollapsed && ['MANAGER', 'SUPER_ADMIN'].includes(role) && (
          <div className="mt-2.5">
            <PropertySwitcher />
          </div>
        )}
      </div>

      {/* Nav List */}
      <nav id="sidebar-nav-container" className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar">
        {/* Ungrouped Links (Dashboard, Guest Hub) */}
        {ungroupedItems.length > 0 && (
          <div className="space-y-1">
            {ungroupedItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.name === 'Procurement' && pathname.startsWith('/admin/procurement'))
              return (
                <Link
                  key={item.name}
                  id={isActive ? "active-sidebar-item" : undefined}
                  href={item.href}
                  scroll={false}
                  onClick={closeMobileMenu}
                  className={cn(
                    "flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all group relative",
                    isActive 
                      ? 'bg-[#181A1D] text-white border border-[#2B3037] shadow-sm font-semibold' 
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#131518]',
                    isCollapsed && "justify-center px-0"
                  )}
                >
                  <Icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-white" : "text-zinc-500 group-hover:text-zinc-300")} />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
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
                className="w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider hover:text-zinc-300 transition-colors"
              >
                <span>{groupName}</span>
                <ChevronDown className={cn("w-3.5 h-3.5 text-zinc-600 transition-transform", isOpen ? "rotate-180" : "rotate-0")} />
              </button>
              {isOpen && (
                <div className="space-y-1 pl-1.5 border-l border-[#1C2025] ml-2">
                  {items.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && item.href !== '/dashboard' && pathname.startsWith(item.href))
                    const isTelemetryTab = ['Front Desk', 'Master Inventory', 'Folios & Billing'].includes(item.name)
                    return (
                      <Link
                        key={item.name}
                        id={isActive ? "active-sidebar-item" : undefined}
                        href={item.href}
                        scroll={false}
                        onClick={closeMobileMenu}
                        className={cn(
                          "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all group",
                          isActive 
                            ? 'bg-[#181A1D] text-white border border-[#2B3037] shadow-sm font-semibold' 
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#131518]'
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon className={cn("w-3.5 h-3.5 flex-shrink-0", isActive ? "text-white" : "text-zinc-500 group-hover:text-zinc-300")} />
                          <span className="truncate">{item.name}</span>
                        </div>
                        {isTelemetryTab && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {/* Collapsed view icons */}
        {isCollapsed && Object.keys(groupedItems).map((groupName) => (
          <div key={groupName} className="space-y-1 pt-2 border-t border-[#1C2025]">
            {groupedItems[groupName].map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.name}
                  id={isActive ? "active-sidebar-item" : undefined}
                  href={item.href}
                  scroll={false}
                  onClick={closeMobileMenu}
                  title={item.name}
                  className={cn(
                    "flex items-center justify-center p-2 rounded-lg transition-all duration-200 group relative",
                    isActive 
                      ? 'bg-[#181A1D] text-white border border-[#2B3037] shadow-sm' 
                      : 'text-zinc-500 hover:text-zinc-200 hover:bg-[#131518]'
                  )}
                >
                  <Icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-white" : "text-zinc-500 group-hover:text-zinc-200")} />
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer Profile & Logout Bar */}
      <div className="p-3 border-t border-[#1C2025] shrink-0 bg-[#090A0C]">
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-[#131518] transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white font-bold text-xs shrink-0 font-mono">
              {session?.user?.name?.substring(0, 2).toUpperCase() || 'SA'}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-white truncate leading-tight">
                  {session?.user?.name || "Admin"}
                </span>
                <span className="text-[10px] text-zinc-500 truncate font-mono">
                  {session?.user?.email || "admin@smarthotel.com"}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/20 rounded-md transition-colors shrink-0"
            title="Sign out of System"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>

      {/* Desktop Collapse Toggle */}
      <button
        onClick={toggleSidebar}
        className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-[#121417] border border-[#2B3037] rounded-full items-center justify-center text-zinc-400 hover:text-white transition-colors z-50 shadow-sm"
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        aria-label="Toggle Collapse"
      >
        {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </div>
  )

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#090A0C]/90 backdrop-blur-md border-b border-[#1C2025] p-3.5 hide-on-print">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-zinc-900 border border-zinc-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-mono font-bold text-xs">SH</span>
            </div>
            <span className="font-bold text-white text-xs tracking-tight">SmartHotel</span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/30 uppercase tracking-wider">
              ELITE
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileMenu}
            className="text-zinc-400 hover:text-white hover:bg-[#181A1D] h-8 w-8"
          >
            {isMobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" onClick={closeMobileMenu}>
          <div
            className="fixed inset-y-0 left-0 w-72 bg-[#090A0C] border-r border-[#1C2025] shadow-2xl flex flex-col animate-in slide-in-from-left duration-300"
            onClick={(e: any) => e.stopPropagation()}
          >
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop Aside */}
      <aside className={cn(
        "hidden lg:flex fixed left-0 top-0 bottom-0 bg-[#090A0C] border-r border-[#1C2025] flex-col transition-all duration-300 z-40 hide-on-print",
        isCollapsed ? "w-20" : "w-64"
      )}>
        <SidebarContent />
      </aside>
    </>
  )
}
