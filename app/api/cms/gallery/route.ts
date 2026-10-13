import { NextRequest, NextResponse } from 'next/server'
import { CmsService } from '@/lib/services/cms-service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId') || undefined
    const category = searchParams.get('category') || undefined
    const featuredParam = searchParams.get('featured')
    const featured = featuredParam !== null ? featuredParam === 'true' : undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined

    await CmsService.ensureDefaultCmsContent()

    const items = await CmsService.getGalleries({
      propertyId,
      category,
      featured,
      limit
    })

    return NextResponse.json({ items }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    })
  } catch (error: any) {
    console.error('Error in public gallery API:', error)
    return NextResponse.json({ error: 'Failed to fetch gallery items' }, { status: 500 })
  }
}
