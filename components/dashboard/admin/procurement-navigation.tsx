'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function ProcurementNavigation() {
  const pathname = usePathname()

  const tabs = [
    { name: 'Inventory & Orders', href: '/admin/inventory?tab=orders' },
    { name: 'Vendors', href: '/admin/procurement/vendors' },
    { name: 'Catalog Items', href: '/admin/procurement/items' }
  ]

  return (
    <div className="flex space-x-2 border-b border-white/10 mb-6 pb-2">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
              isActive 
                ? "bg-primary text-white" 
                : "text-white/60 hover:text-white hover:bg-white/5"
            )}
          >
            {tab.name}
          </Link>
        )
      })}
    </div>
  )
}
