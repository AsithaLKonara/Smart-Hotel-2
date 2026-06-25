import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'

const ADMIN_ROLES = ['SUPER_ADMIN', 'MANAGER']

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const roleName = (session.user as any).roleName
    if (!ADMIN_ROLES.includes(roleName)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      select: { id: true, email: true, name: true, roleName: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ users })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession()
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

    const user = await prisma.user.create({
      data: { email, name, password: crypto.randomUUID() },
    })
    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
