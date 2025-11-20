/**
 * Optimistic Update Utilities
 * 
 * Provides utilities for optimistic UI updates
 */

export interface OptimisticAction<T> {
  type: 'add' | 'update' | 'delete'
  item: T
  id: string
}

/**
 * Create optimistic update handler
 */
export function createOptimisticHandler<T extends { id: string }>({
  onSuccess,
  onError,
  getItemId = (item) => item.id,
}: {
  onSuccess?: (item: T) => void
  onError?: (error: Error, item: T) => void
  getItemId?: (item: T) => string
}) {
  return async (
    optimisticItem: T,
    apiCall: () => Promise<T>,
    updateState: (items: T[], newItem: T) => T[]
  ) => {
    // Optimistically update UI
    let currentItems: T[] = []
    const setItems = (items: T[]) => {
      currentItems = items
    }

    // Apply optimistic update
    const updatedItems = updateState(currentItems, optimisticItem)
    setItems(updatedItems)

    try {
      // Make API call
      const result = await apiCall()
      
      // Replace optimistic with real data
      const finalItems = currentItems.map(item =>
        getItemId(item) === getItemId(optimisticItem) ? result : item
      )
      setItems(finalItems)
      
      onSuccess?.(result)
      return { success: true, data: result }
    } catch (error) {
      // Revert optimistic update
      const revertedItems = currentItems.filter(
        item => getItemId(item) !== getItemId(optimisticItem)
      )
      setItems(revertedItems)
      
      const err = error instanceof Error ? error : new Error(String(error))
      onError?.(err, optimisticItem)
      return { success: false, error: err }
    }
  }
}

/**
 * Optimistic add handler
 */
export function optimisticAdd<T extends { id: string }>(
  items: T[],
  newItem: T,
  apiCall: () => Promise<T>,
  onSuccess?: (item: T) => void,
  onError?: (error: Error) => void
): Promise<{ success: boolean; data?: T; error?: Error }> {
  return new Promise(async (resolve) => {
    // Optimistically add item
    const optimisticItems = [...items, newItem]

    try {
      const result = await apiCall()
      // Replace optimistic with real data
      const finalItems = optimisticItems.map(item =>
        item.id === newItem.id ? result : item
      )
      onSuccess?.(result)
      resolve({ success: true, data: result })
    } catch (error) {
      // Revert on error
      const err = error instanceof Error ? error : new Error(String(error))
      onError?.(err)
      resolve({ success: false, error: err })
    }
  })
}

/**
 * Optimistic update handler
 */
export function optimisticUpdate<T extends { id: string }>(
  items: T[],
  updatedItem: T,
  apiCall: () => Promise<T>,
  onSuccess?: (item: T) => void,
  onError?: (error: Error) => void
): Promise<{ success: boolean; data?: T; error?: Error }> {
  return new Promise(async (resolve) => {
    // Optimistically update item
    const optimisticItems = items.map(item =>
      item.id === updatedItem.id ? updatedItem : item
    )

    try {
      const result = await apiCall()
      // Replace optimistic with real data
      const finalItems = optimisticItems.map(item =>
        item.id === updatedItem.id ? result : item
      )
      onSuccess?.(result)
      resolve({ success: true, data: result })
    } catch (error) {
      // Revert on error
      const err = error instanceof Error ? error : new Error(String(error))
      onError?.(err)
      resolve({ success: false, error: err })
    }
  })
}

/**
 * Optimistic delete handler
 */
export function optimisticDelete<T extends { id: string }>(
  items: T[],
  itemId: string,
  apiCall: () => Promise<void>,
  onSuccess?: () => void,
  onError?: (error: Error, originalItem: T) => void
): Promise<{ success: boolean; error?: Error }> {
  return new Promise(async (resolve) => {
    // Find original item for potential revert
    const originalItem = items.find(item => item.id === itemId)
    if (!originalItem) {
      resolve({ success: false, error: new Error('Item not found') })
      return
    }

    // Optimistically remove item
    const optimisticItems = items.filter(item => item.id !== itemId)

    try {
      await apiCall()
      onSuccess?.()
      resolve({ success: true })
    } catch (error) {
      // Revert on error - restore original item
      const err = error instanceof Error ? error : new Error(String(error))
      onError?.(err, originalItem)
      resolve({ success: false, error: err })
    }
  })
}

