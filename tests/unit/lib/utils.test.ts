import { jest } from '@jest/globals'
import { cn, formatPrice, formatDate, formatDateTime, generateId, debounce } from '@/lib/utils'

describe('lib/utils', () => {
  describe('cn', () => {
    it('merges class names intelligently', () => {
      expect(cn('btn', 'btn-primary', ['extra', { hidden: false, block: true }], undefined)).toBe('btn btn-primary extra block')
    })
  })

  describe('formatPrice', () => {
    it('formats price using the provided currency', () => {
      expect(formatPrice(1234.56, 'USD')).toBe('$1,234.56')
      expect(formatPrice(1234.56, 'EUR')).toBe('€1,234.56')
    })

    it('falls back to USD currency when none is provided', () => {
      expect(formatPrice(99.5)).toBe('$99.50')
    })
  })

  describe('formatDate utilities', () => {
    const sampleDate = '2025-03-15T10:30:00.000Z'

    it('formats a date with full month name', () => {
      expect(formatDate(sampleDate)).toBe('March 15, 2025')
    })

    it('formats a date with time details', () => {
      const formatted = formatDateTime(sampleDate)
      expect(formatted).toMatch(/Mar \d{1,2}, 2025/)
      expect(formatted).toMatch(/\d{2}:\d{2}/)
    })
  })

  describe('generateId', () => {
    const originalRandom = Math.random

    beforeEach(() => {
      Math.random = jest.fn(() => 0.123456789)
    })

    afterEach(() => {
      Math.random = originalRandom
    })

    it('creates a deterministic base36 id when Math.random is mocked', () => {
      expect(generateId()).toBe('4fzzzxjyl')
      expect(generateId()).toBe('4fzzzxjyl')
    })
  })

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('delays invocation until the wait period elapses', () => {
      const spy = jest.fn()
      const debounced = debounce(spy, 200)

      debounced('first')
      debounced('second')

      expect(spy).not.toHaveBeenCalled()

      jest.advanceTimersByTime(199)
      expect(spy).not.toHaveBeenCalled()

      jest.advanceTimersByTime(1)
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith('second')
    })
  })
})

