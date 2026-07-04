import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { getEffectivePropertyId } from '@/lib/server-rbac'
import { authOptions } from '@/lib/auth'

const ADMIN_ROLES = ['SUPER_ADMIN', 'MANAGER']

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const roleName = (session.user as any).roleName
    if (!ADMIN_ROLES.includes(roleName)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Pass the request to getEffectivePropertyId
    // @ts-ignore
    const propertyId = await getEffectivePropertyId()
    
    const whereClause: any = { deletedAt: null }
    if (propertyId) {
      whereClause.propertyId = propertyId
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: { id: true, email: true, name: true, roleName: true, createdAt: true, propertyId: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ users })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const roleName = (session.user as any).roleName
    if (!ADMIN_ROLES.includes(roleName)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const data = await req.json()
    const { email, name } = data
    if (!email || !name) {
      return NextResponse.json({ error: 'email and name are required' }, { status: 400 })
    }

    const propertyId = await getEffectivePropertyId(req)

    const user = await prisma.user.create({
      data: { email, name, password: crypto.randomUUID(), propertyId },
    })
    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
