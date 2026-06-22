/// <reference types="jest" />
import { connectWithRetry } from '../../lib/db'

describe('Database connection retry unit tests', () => {
  describe('connectWithRetry', () => {
    it('should resolve immediately if function succeeds', async () => {
      const mockFn = jest.fn().mockResolvedValue('success')
      const result = await connectWithRetry(mockFn)
      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should retry on connection error and eventually succeed', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('connection failed'))
        .mockRejectedValueOnce(new Error('network timeout'))
        .mockResolvedValueOnce('success')

      const result = await connectWithRetry(mockFn, 3, 10)
      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(3)
    })

    it('should throw after max retries', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('connection failed'))
      
      await expect(connectWithRetry(mockFn, 2, 10)).rejects.toThrow('connection failed')
      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    it('should not retry on non-connection errors', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('invalid query parameter'))
      
      await expect(connectWithRetry(mockFn, 3, 10)).rejects.toThrow('invalid query parameter')
      expect(mockFn).toHaveBeenCalledTimes(1) // Only called once
    })
  })
})
