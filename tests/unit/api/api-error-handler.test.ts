import { handleZodError } from '@/lib/api-utils'
import { z } from 'zod'

describe('handleZodError', () => {
  it('returns a formatted 400 Bad Request response for a ZodError', async () => {
    const schema = z.object({
      name: z.string().min(5),
      age: z.number().positive(),
    })

    let zodError: z.ZodError | null = null;
    try {
      schema.parse({ name: 'abc', age: -1 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        zodError = error;
      }
    }

    expect(zodError).not.toBeNull();
    
    if (zodError) {
      const response = handleZodError(zodError)
      expect(response.status).toBe(400)
      
      const data = await response.json()
      
      // Assert root structure
      expect(data).toHaveProperty('error', 'Validation error')
      expect(data).toHaveProperty('details')
      
      // Assert specific field validation failures inside details
      expect(data.details.name).toBeDefined()
      expect(data.details.name._errors.length).toBeGreaterThan(0)
      
      expect(data.details.age).toBeDefined()
      expect(data.details.age._errors.length).toBeGreaterThan(0)
    }
  })
})
