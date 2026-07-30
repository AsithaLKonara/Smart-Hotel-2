import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

type ShortcutMap = {
  [key: string]: (e: KeyboardEvent) => void
}

export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger if the user is typing in an input or textarea
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement).isContentEditable
      ) {
        return
      }

      // Build a string representation of the key combination
      const keys = []
      if (event.ctrlKey || event.metaKey) keys.push('mod')
      if (event.shiftKey) keys.push('shift')
      if (event.altKey) keys.push('alt')
      
      const key = event.key.toLowerCase()
      if (!['control', 'meta', 'shift', 'alt'].includes(key)) {
        keys.push(key)
      }

      const combo = keys.join('+')

      if (shortcuts[combo]) {
        event.preventDefault()
        shortcuts[combo](event)
      } else if (shortcuts[key] && keys.length === 1) {
        // Also support simple single-key shortcuts without modifiers
        event.preventDefault()
        shortcuts[key](event)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

// Global Front Desk Shortcuts Hook
export function useFrontDeskShortcuts() {
  const router = useRouter()

  useKeyboardShortcuts({
    'mod+i': () => {
      // Command/Ctrl + I = Quick Check-in
      console.log('Triggering Quick Check-in')
      router.push('/admin/front-desk/check-in/new')
    },
    'mod+o': () => {
      // Command/Ctrl + O = Quick Check-out
      console.log('Triggering Quick Check-out')
      router.push('/admin/front-desk/check-out')
    },
    'mod+p': () => {
      // Command/Ctrl + P = Post Payment
      console.log('Triggering Post Payment')
      // This would normally open a modal using a global state store like Zustand
      // window.dispatchEvent(new CustomEvent('open-payment-modal'))
    },
    'mod+f': () => {
      // Command/Ctrl + F = Search Folios/Guests
      const searchBox = document.querySelector('input[type="search"]') as HTMLInputElement
      if (searchBox) searchBox.focus()
    }
  })
}
