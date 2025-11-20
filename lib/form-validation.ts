/**
 * Enhanced Form Validation Utilities
 * 
 * Provides real-time validation, async validation, and field-level error handling
 */

import { z } from 'zod'

export interface ValidationRule<T = any> {
  validate: (value: T) => boolean | Promise<boolean>
  message: string
}

export interface FieldValidation {
  isValid: boolean
  error?: string
  isDirty: boolean
  isTouched: boolean
}

export interface FormValidationState {
  [field: string]: FieldValidation
}

/**
 * Create real-time validator
 */
export function createValidator<T>(
  schema: z.ZodSchema<T>,
  customRules?: Record<string, ValidationRule[]>
) {
  return {
    validate: (data: Partial<T>): { isValid: boolean; errors: Record<string, string> } => {
      const errors: Record<string, string> = {}
      
      try {
        schema.parse(data)
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.errors.forEach((err) => {
            const path = err.path.join('.')
            errors[path] = err.message
          })
        }
      }

      // Apply custom rules
      if (customRules) {
        for (const [field, rules] of Object.entries(customRules)) {
          const value = (data as any)[field]
          for (const rule of rules) {
            const isValid = rule.validate(value)
            if (!isValid) {
              errors[field] = rule.message
              break
            }
          }
        }
      }

      return {
        isValid: Object.keys(errors).length === 0,
        errors,
      }
    },

    validateField: async (
      field: string,
      value: any,
      allData?: Partial<T>
    ): Promise<{ isValid: boolean; error?: string }> => {
      // Validate with schema
      try {
        const fieldSchema = (schema as any).shape?.[field]
        if (fieldSchema) {
          fieldSchema.parse(value)
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          return {
            isValid: false,
            error: error.errors[0]?.message,
          }
        }
      }

      // Apply custom rules
      if (customRules?.[field]) {
        for (const rule of customRules[field]) {
          const isValid = await rule.validate(value)
          if (!isValid) {
            return {
              isValid: false,
              error: rule.message,
            }
          }
        }
      }

      return { isValid: true }
    },
  }
}

/**
 * Async validation helpers
 */
export const asyncValidators = {
  /**
   * Check if email exists
   */
  emailExists: async (email: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/users/check-email?email=${encodeURIComponent(email)}`)
      const data = await response.json()
      return !data.exists
    } catch {
      return true // Assume valid if check fails
    }
  },

  /**
   * Check if room is available
   */
  roomAvailable: async (roomId: string, checkIn: string, checkOut: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `/api/rooms/check-availability?roomId=${roomId}&checkIn=${checkIn}&checkOut=${checkOut}`
      )
      const data = await response.json()
      return data.available === true
    } catch {
      return false
    }
  },

  /**
   * Check if confirmation code is unique
   */
  confirmationCodeUnique: async (code: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/bookings/check-code?code=${encodeURIComponent(code)}`)
      const data = await response.json()
      return !data.exists
    } catch {
      return true
    }
  },
}

/**
 * Common validation rules
 */
export const validationRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    validate: (value: any) => {
      if (value === null || value === undefined) return false
      if (typeof value === 'string') return value.trim().length > 0
      if (Array.isArray(value)) return value.length > 0
      return true
    },
    message,
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (value: string) => value.length >= min,
    message: message || `Must be at least ${min} characters`,
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    validate: (value: string) => value.length <= max,
    message: message || `Must be no more than ${max} characters`,
  }),

  email: (message = 'Invalid email address'): ValidationRule => ({
    validate: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message,
  }),

  phone: (message = 'Invalid phone number'): ValidationRule => ({
    validate: (value: string) => /^[\d\s\-\+\(\)]+$/.test(value) && value.replace(/\D/g, '').length >= 10,
    message,
  }),

  min: (min: number, message?: string): ValidationRule => ({
    validate: (value: number) => value >= min,
    message: message || `Must be at least ${min}`,
  }),

  max: (max: number, message?: string): ValidationRule => ({
    validate: (value: number) => value <= max,
    message: message || `Must be no more than ${max}`,
  }),

  pattern: (pattern: RegExp, message: string): ValidationRule => ({
    validate: (value: string) => pattern.test(value),
    message,
  }),
}

/**
 * Debounced validation
 */
export function debounceValidation<T>(
  validator: (value: T) => Promise<{ isValid: boolean; error?: string }>,
  delay: number = 300
) {
  let timeoutId: NodeJS.Timeout | null = null

  return (value: T, callback: (result: { isValid: boolean; error?: string }) => void) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(async () => {
      const result = await validator(value)
      callback(result)
    }, delay)
  }
}

