import { NextRequest, NextResponse } from 'next/server'
import { StayExtraService } from '@/lib/services/stay-extra-service'
import { isDatabaseConfigured } from '@/lib/db-helpers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ items: [] })
  }

  try {
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId') || undefined
    const activeOnly = searchParams.get('activeOnly') !== 'false'

    await StayExtraService.ensureDefaultExtraServices()
    const extras = await StayExtraService.getExtraServices({ propertyId, activeOnly })

    return NextResponse.json({ items: extras })
  } catch (error: any) {
    console.error('Error fetching stay services:', error)
    return NextResponse.json({ items: [], error: 'Failed to load services' }, { status: 500 })
  }
}
