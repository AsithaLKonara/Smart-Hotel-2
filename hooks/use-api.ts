import useSWR from 'swr'
import { useProperty } from '@/contexts/property-context'
import { fetcher } from '@/lib/fetcher'

export function useApi<T = any>(url: string | null) {
  const { activePropertyId } = useProperty()

  // SWR automatically dedupes, caches, and re-fetches when activePropertyId changes
  const key = url ? [url, activePropertyId || 'all'] : null

  const { data, error, isLoading, mutate } = useSWR<T>(key, fetcher, {
    revalidateOnFocus: true,
  })

  return { data, error, isLoading, mutate }
}
