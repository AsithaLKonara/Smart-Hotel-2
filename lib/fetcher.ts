export const fetcher = async ([url, propertyId]: [string, string | null]) => {
  const headers: HeadersInit = {}
  
  if (propertyId) {
    headers['x-property-id'] = propertyId
  }

  const res = await fetch(url, { headers })
  
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.')
    const info = await res.json().catch(() => ({}))
    ;(error as any).info = info
    ;(error as any).status = res.status
    throw error
  }

  return res.json()
}
