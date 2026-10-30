import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  createPropertyCluster,
  assignUserToCluster,
  getUserClusterScope,
  validateClusterAccess,
  listPropertyClusters
} from '@/lib/governance/cluster-rbac'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.roleName || (session?.user as any)?.role

    const allowedRoles = ['SUPER_ADMIN', 'MANAGER', 'REGIONAL_DIRECTOR', 'CLUSTER_REVENUE_MANAGER']
    if (session && !allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden', message: `Role [${userRole}] cannot access cluster governance` },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')
    const userId = searchParams.get('userId') || session?.user?.id
    const propertyId = searchParams.get('propertyId')

    if (type === 'verify') {
      if (!propertyId) {
        return NextResponse.json({ error: 'propertyId is required to verify access' }, { status: 400 })
      }
      try {
        await validateClusterAccess(userId!, propertyId)
        return NextResponse.json({ success: true, authorized: true, propertyId })
      } catch (err: any) {
        return NextResponse.json(
          { success: false, authorized: false, error: err.message },
          { status: 403 }
        )
      }
    }

    if (type === 'user-scope') {
      if (!userId) {
        return NextResponse.json({ error: 'userId is required' }, { status: 400 })
      }
      const scope = await getUserClusterScope(userId)
      return NextResponse.json({ success: true, scope })
    }

    const clusters = await listPropertyClusters()
    return NextResponse.json({
      success: true,
      count: clusters.length,
      clusters
    })
  } catch (error: any) {
    console.error('Error fetching cluster data:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve cluster data', details: error?.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.roleName || (session?.user as any)?.role

    const allowedRoles = ['SUPER_ADMIN', 'MANAGER']
    if (session && !allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden', message: `Role [${userRole}] cannot modify clusters` },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action = 'CREATE_CLUSTER' } = body

    if (action === 'CREATE_CLUSTER') {
      const { name, code, region, propertyIds, description } = body

      if (!name || !code || !propertyIds || !Array.isArray(propertyIds)) {
        return NextResponse.json(
          { error: 'name, code, and propertyIds array are required' },
          { status: 400 }
        )
      }

      const cluster = await createPropertyCluster({
        name,
        code,
        region: region || 'General',
        propertyIds,
        description,
        actorUserId: session?.user?.id
      })
      return NextResponse.json({ success: true, cluster })
    }

    if (action === 'ASSIGN_USER') {
      const { userId, clusterId, clusterRole } = body

      if (!userId || !clusterId || !clusterRole) {
        return NextResponse.json(
          { error: 'userId, clusterId, and clusterRole are required' },
          { status: 400 }
        )
      }

      const assignment = await assignUserToCluster({
        userId,
        clusterId,
        clusterRole,
        actorUserId: session?.user?.id
      })
      return NextResponse.json({ success: true, assignment })
    }

    return NextResponse.json({ error: `Unsupported action [${action}]` }, { status: 400 })
  } catch (error: any) {
    console.error('Error processing cluster action:', error)
    return NextResponse.json(
      { error: 'Failed to process cluster action', details: error?.message },
      { status: 400 }
    )
  }
}
