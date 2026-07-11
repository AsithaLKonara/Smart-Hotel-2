import { NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { handleZodError } from '@/lib/api-utils'

const prisma = new PrismaClient()

const OcrRequestSchema = z.object({
  base64Image: z.string().min(1, 'Image data is required'),
  documentType: z.enum(['PASSPORT', 'ID_CARD', 'DRIVERS_LICENSE']).default('PASSPORT')
})

// Simulates parsing MRZ (Machine Readable Zone) from passports/IDs
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validatedData = OcrRequestSchema.parse(body)

    // Log the OCR usage for billing/auditing purposes
    await prisma.auditLog.create({
      data: {
        action: 'OCR_SCAN_REQUEST',
        resource: 'DOCUMENT',
        actor: 'SYSTEM', // Replace with session user ID
        details: {
          documentType: validatedData.documentType,
          imageLength: validatedData.base64Image.length
        }
      }
    })

    // Simulate OCR processing delay
    await new Promise(resolve => setTimeout(resolve, 800))

    // Mock extracted data
    // In a real application, this would pipe to Google Cloud Vision API, AWS Textract, or specialized providers like BlinkID
    const extractedData = {
      success: true,
      documentType: validatedData.documentType,
      parsedData: {
        firstName: 'JOHN',
        lastName: 'DOE',
        documentNumber: `P${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
        nationality: 'USA',
        dateOfBirth: '1985-12-15',
        expiryDate: '2032-12-14',
        gender: 'M'
      },
      confidenceScore: 0.98
    }

    return NextResponse.json(extractedData)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error)
    }
    console.error('OCR integration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
