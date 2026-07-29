import { NextResponse } from 'next/server'
import { z } from 'zod'
import { GuestExperienceService } from '@/lib/services/guest-experience-service'

const companyProfileSchema = z.object({
  name: z.string().min(2, 'Company name is required'),
  taxId: z.string().optional(),
  address: z.string().optional(),
  billingEmail: z.string().email().optional().or(z.literal('')),
  creditLimit: z.number().min(0).optional()
}).strict()

export async function GET() {
  const traceId = `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`
  try {
    const companies = await GuestExperienceService.listCompanyProfiles()
    return NextResponse.json({
      success: true,
      data: companies,
      count: companies.length,
      timestamp: new Date().toISOString(),
      traceId
    }, { status: 200 })
  } catch (error: any) {
    console.error(`[${traceId}] List Company Profiles Error:`, error)
    return NextResponse.json({
      error: 'ERR_COMPANIES_FETCH',
      message: error.message || 'Failed to retrieve corporate company billing profiles',
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
    const parsed = companyProfileSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({
        error: 'ERR_VALIDATION_FAILED',
        message: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', '),
        statusCode: 400,
        timestamp: new Date().toISOString(),
        traceId
      }, { status: 400 })
    }

    const company = await GuestExperienceService.registerCompanyProfile(parsed.data)

    return NextResponse.json({
      success: true,
      data: company,
      message: 'Corporate company billing profile created or updated successfully.',
      timestamp: new Date().toISOString(),
      traceId
    }, { status: 201 })
  } catch (error: any) {
    console.error(`[${traceId}] Register Company Profile Error:`, error)
    return NextResponse.json({
      error: 'ERR_COMPANIES_UPSERT',
      message: error.message || 'Internal Server Error during corporate account processing',
      statusCode: 500,
      timestamp: new Date().toISOString(),
      traceId
    }, { status: 500 })
  }
}
