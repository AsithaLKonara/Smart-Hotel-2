'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { 
  LayoutDashboard, 
  Bed, 
  Calendar, 
  Users, 
  ClipboardList, 
  UtensilsCrossed, 
  ShoppingCart,
  Package,
  Image as ImageIcon,
  QrCode,
  BarChart3,
  LogOut,
  UserCheck,
  Menu,
  X,
  Settings as SettingsIcon,
  Share2,
  MapPin,
  Link as LinkIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSidebar } from '@/lib/sidebar-context'
import { cn } from '@/lib/utils'

export default function AdminSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { isCollapsed, isMobileOpen, toggleSidebar, toggleMobileMenu, closeMobileMenu } = useSidebar()

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Rooms', href: '/admin/rooms', icon: Bed },
    { name: 'Bookings', href: '/admin/bookings', icon: Calendar },
    { name: 'Check-In/Out', href: '/admin/dashboard/checkin-checkout', icon: UserCheck },
    { name: 'Staff', href: '/admin/staff', icon: Users },
    { name: 'Tasks', href: '/admin/tasks', icon: ClipboardList },
    { name: 'Menu', href: '/admin/menu', icon: UtensilsCrossed },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
    { name: 'Inventory', href: '/admin/inventory', icon: Package },
    { name: 'Gallery', href: '/admin/gallery', icon: ImageIcon },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/admin/settings', icon: SettingsIcon },
  ]

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className={cn(
        "p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between",
        isCollapsed && "p-4 justify-center"
      )}>
        <Link href="/" className="flex items-center space-x-3 overflow-hidden">
          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">SH</span>
          </div>
          {!isCollapsed && (
            <div className="transition-all duration-300">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">SmartHotel</h1>
              <p className="text-[10px] uppercase tracking-widest text-amber-600 font-bold">Admin Panel</p>
            </div>
          )}
        </Link>
      </div>

      <div className={cn(
        "p-4 border-b border-gray-200 dark:border-gray-700 transition-all duration-300",
        isCollapsed && "p-2"
      )}>
        <div className={cn(
          "flex items-center space-x-3 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800/50",
          isCollapsed && "px-1 justify-center"
        )}>
          <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0 border border-amber-200 dark:border-amber-800">
            <span className="text-amber-700 dark:text-amber-400 font-bold text-xs">
              {session?.user?.name?.charAt(0).toUpperCase() || 'A'}
            </span>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0 transition-all duration-300">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {session?.user?.name || 'Admin'}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate uppercase tracking-tighter">
                {session?.user?.role || 'Administrator'}
              </p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={closeMobileMenu}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                isActive
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
                isCollapsed && "justify-center px-0"
              )}
              title={isCollapsed ? item.name : ""}
            >
              <Icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-white" : "group-hover:scale-110 transition-transform")} />
              {!isCollapsed && <span className="text-sm font-medium">{item.name}</span>}
              {isCollapsed && isActive && (
                <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full" />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="outline"
          className={cn(
            "w-full transition-all duration-300 border-none bg-gray-50 dark:bg-gray-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20",
            isCollapsed ? "justify-center px-0" : "justify-start px-4"
          )}
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          <LogOut className="w-4 h-4" />
          {!isCollapsed && <span className="ml-3 text-xs font-bold uppercase tracking-widest">Sign Out</span>}
        </Button>
      </div>

      {/* Desktop Collapse Toggle */}
      <button 
        onClick={toggleSidebar}
        className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full items-center justify-center shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors z-50"
      >
        {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </div>
  )

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">SH</span>
            </div>
            <span className="font-bold text-gray-900 dark:text-white uppercase tracking-tighter">SmartHotel Admin</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileMenu}
            className="hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={closeMobileMenu}>
          <div 
            className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-gray-900 shadow-2xl flex flex-col animate-in slide-in-from-left duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex fixed left-0 top-0 bottom-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex-col transition-all duration-300 z-40",
        isCollapsed ? "w-20" : "w-64"
      )}>
        <SidebarContent />
      </aside>
    </>
  )
}




