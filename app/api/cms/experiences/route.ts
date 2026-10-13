import { NextRequest, NextResponse } from 'next/server'
import { CmsService } from '@/lib/services/cms-service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId') || undefined
    const category = searchParams.get('category') || undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined

    await CmsService.ensureDefaultCmsContent()

    const items = await CmsService.getExperiences({
      propertyId,
      category,
      activeOnly: true,
      limit
    })

    return NextResponse.json({ items }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    })
  } catch (error: any) {
    console.error('Error in public experiences API:', error)
    return NextResponse.json({ error: 'Failed to fetch experiences' }, { status: 500 })
  }
}
