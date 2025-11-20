import { LucideIcon } from 'lucide-react'
import { Button } from './button'
import { Card } from './card'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn('p-12 text-center', className)}>
      <div className="flex flex-col items-center">
        <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-4 mb-4">
          <Icon className="h-8 w-8 text-amber-600 dark:text-amber-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
          {description}
        </p>
        {action && (
          <Button onClick={action.onClick} className="bg-amber-600 hover:bg-amber-700">
            {action.label}
          </Button>
        )}
      </div>
    </Card>
  )
}

