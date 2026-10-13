import { NextRequest, NextResponse } from 'next/server'
import { CmsService } from '@/lib/services/cms-service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') !== 'false'

    await CmsService.ensureDefaultCmsContent()

    const properties = await CmsService.getProperties({ activeOnly })

    // Map public-safe data
    const publicData = properties.map((p: any) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      address: p.address,
      city: p.city,
      country: p.country,
      phone: p.phone,
      email: p.email,
      description: p.description,
      mainImage: p.mainImage,
      latitude: p.latitude,
      longitude: p.longitude,
      googleMapsUrl: p.googleMapsUrl,
      stats: {
        galleriesCount: p._count.galleries,
        experiencesCount: p._count.experiences,
        facilitiesCount: p._count.resortFacilities,
      }
    }))

    return NextResponse.json({ properties: publicData }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    })
  } catch (error: any) {
    console.error('Error in public properties API:', error)
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 })
  }
}
