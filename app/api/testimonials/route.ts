import { NextResponse } from 'next/server'
import { z } from 'zod'
import { GuestExperienceService } from '@/lib/services/guest-experience-service'

const testimonialSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  role: z.string().optional(),
  content: z.string().min(10, 'Testimonial content must be at least 10 characters'),
  rating: z.number().int().min(1).max(5).optional(),
  image: z.string().url().optional().or(z.literal(''))
}).strict()

export async function GET() {
  const traceId = `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`
  try {
    const testimonials = await GuestExperienceService.listActiveTestimonials()
    return NextResponse.json({
      success: true,
      data: testimonials,
      count: testimonials.length,
      timestamp: new Date().toISOString(),
      traceId
    }, { status: 200 })
  } catch (error: any) {
    console.error(`[${traceId}] List Testimonials Error:`, error)
    return NextResponse.json({
      error: 'ERR_TESTIMONIALS_FETCH',
      message: error.message || 'Failed to retrieve active guest testimonials',
      statusCode: 500,
      timestamp: new Date().toISOString(),
      traceId
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const traceId = `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`
  try {
    const body = await request.json()
    const parsed = testimonialSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({
        error: 'ERR_VALIDATION_FAILED',
        message: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', '),
        statusCode: 400,
        timestamp: new Date().toISOString(),
        traceId
      }, { status: 400 })
    }

    const testimonial = await GuestExperienceService.addTestimonial(parsed.data)

    return NextResponse.json({
      success: true,
      data: testimonial,
      message: 'Testimonial recorded successfully for promotional publication.',
      timestamp: new Date().toISOString(),
      traceId
    }, { status: 201 })
  } catch (error: any) {
    console.error(`[${traceId}] Add Testimonial Error:`, error)
    return NextResponse.json({
      error: 'ERR_TESTIMONIALS_CREATE',
      message: error.message || 'Internal Server Error while creating testimonial',
      statusCode: 500,
      timestamp: new Date().toISOString(),
      traceId
    }, { status: 500 })
  }
}
