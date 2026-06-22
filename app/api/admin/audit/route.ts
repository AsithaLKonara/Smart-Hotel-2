import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getRequestSession } from '@/lib/session'

/**
 * Scalable Audit Log API
 * Implements Cursor-based pagination for O(1) retrieval performance.
 */
export async function GET(request: NextRequest) {
  const session = await getRequestSession(request)
  if (!session || !['SUPER_ADMIN', 'MANAGER'].includes((session.user as any).roleName as string)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get('cursor')
  const limit = parseInt(searchParams.get('limit') || '20')
  const action = searchParams.get('action')
  const resource = searchParams.get('resource')

  try {
    const logs = await prisma.auditLog.findMany({
      take: limit + 1, // Fetch one extra to determine next cursor
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0, // Skip the cursor itself
      where: {
        ...(action && { action }),
        ...(resource && { resource })
      },
      orderBy: { createdAt: 'desc' }
    })

    let nextCursor: string | undefined = undefined
    if (logs.length > limit) {
      const nextItem = logs.pop()
      nextCursor = nextItem!.id
    }

    return NextResponse.json({
      logs,
      nextCursor,
      hasMore: !!nextCursor
    })
  } catch (error) {
    console.error('[AUDIT_API_ERROR]', error)
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}
