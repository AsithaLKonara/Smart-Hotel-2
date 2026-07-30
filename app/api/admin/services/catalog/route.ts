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
  return Response.json({ error: 'Not Implemented' }, { status: 501 })
}

export async function POST() {
  return Response.json({ error: 'Not Implemented' }, { status: 501 })
}
