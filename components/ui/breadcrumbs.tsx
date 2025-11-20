"use client"

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const allItems = [
    { label: 'Home', href: '/' },
    ...items,
  ]

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400', className)}
    >
      {allItems.map((item, index) => {
        const isLast = index === allItems.length - 1
        const isFirst = index === 0

        return (
          <div key={index} className="flex items-center space-x-2">
            {isFirst ? (
              <Link
                href={item.href || '#'}
                className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                aria-label="Home"
              >
                <Home className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                {isLast ? (
                  <span className="text-gray-900 dark:text-gray-100 font-medium" aria-current="page">
                    {item.label}
                  </span>
                ) : item.href ? (
                  <Link
                    href={item.href}
                    className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span>{item.label}</span>
                )}
              </>
            )}
          </div>
        )
      })}
    </nav>
  )
}

