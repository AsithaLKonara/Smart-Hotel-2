import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CmsService } from '@/lib/services/cms-service'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') === 'true'

    // Guarantee default content if database is empty
    await CmsService.ensureDefaultCmsContent()

    const properties = await CmsService.getProperties({ activeOnly })
    return NextResponse.json({ properties })
  } catch (error: any) {
    console.error('Error fetching CMS properties:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch properties' }, { status: 500 })
  }
}
