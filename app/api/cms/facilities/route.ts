import { NextRequest, NextResponse } from 'next/server'
import { CmsService } from '@/lib/services/cms-service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId') || undefined
    const type = searchParams.get('type') || undefined
    const featuredOnly = searchParams.get('featured') === 'true'

    await CmsService.ensureDefaultCmsContent()

    const items = await CmsService.getFacilities({
      propertyId,
      type,
      status: 'ACTIVE',
      featuredOnly
    })

    return NextResponse.json({ items }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    })
  } catch (error: any) {
    console.error('Error in public facilities API:', error)
    return NextResponse.json({ error: 'Failed to fetch facilities' }, { status: 500 })
  }
}
