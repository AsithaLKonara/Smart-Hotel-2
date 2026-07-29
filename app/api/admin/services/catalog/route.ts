import { NextResponse } from 'next/server'
import { z } from 'zod'
import { GuestExperienceService } from '@/lib/services/guest-experience-service'

const resortServiceSchema = z.object({
  facilityName: z.string().min(2, 'facilityName must be at least 2 characters'),
  serviceName: z.string().min(2, 'serviceName must be at least 2 characters'),
  durationMins: z.number().int().positive('durationMins must be a positive integer'),
  price: z.number().min(0, 'price cannot be negative')
}).strict()

export async function GET() {
  const traceId = `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`
  try {
    const services = await GuestExperienceService.listResortServices()
    return NextResponse.json({
      success: true,
      data: services,
      count: services.length,
      timestamp: new Date().toISOString(),
      traceId
    }, { status: 200 })
  } catch (error: any) {
    console.error(`[${traceId}] List Resort Services Error:`, error)
    return NextResponse.json({
      error: 'ERR_SERVICES_FETCH',
      message: error.message || 'Failed to retrieve resort services catalog',
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
    const parsed = resortServiceSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({
        error: 'ERR_VALIDATION_FAILED',
        message: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', '),
        statusCode: 400,
        timestamp: new Date().toISOString(),
        traceId
      }, { status: 400 })
    }

    const service = await GuestExperienceService.addResortService(parsed.data)

    return NextResponse.json({
      success: true,
      data: service,
      message: 'Resort spa/recreation service successfully added to property catalog.',
      timestamp: new Date().toISOString(),
      traceId
    }, { status: 201 })
  } catch (error: any) {
    console.error(`[${traceId}] Add Resort Service Error:`, error)
    return NextResponse.json({
      error: 'ERR_SERVICES_CREATE',
      message: error.message || 'Internal Server Error while creating resort service',
      statusCode: 500,
      timestamp: new Date().toISOString(),
      traceId
    }, { status: 500 })
  }
}
