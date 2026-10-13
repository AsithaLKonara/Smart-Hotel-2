/**
 * Centralized React Query Keys
 * Enforces global query deduplication by providing a single source of truth for query keys.
 */
export const QueryKeys = {
  orders: {
    all: ['restaurant-orders'] as const,
    kitchenToday: ['restaurant-orders', 'kitchen-today'] as const,
    byStatus: (status: string) => ['restaurant-orders', { status }] as const,
    detail: (id: string) => ['restaurant-orders', id] as const,
  },
  payroll: {
    all: ['payroll'] as const,
    paginated: (page: number, limit: number) => ['payroll', { page, limit }] as const,
  },
  employees: {
    all: ['employees'] as const,
    compact: ['employees', { compact: true }] as const,
  }
} as const
