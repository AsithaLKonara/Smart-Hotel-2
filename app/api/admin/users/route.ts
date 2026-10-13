import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { getEffectivePropertyId } from '@/lib/server-rbac'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'

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

    const dbUsers = await prisma.user.findMany({
      where: whereClause,
      select: { 
        id: true, 
        email: true, 
        name: true, 
        phone: true,
        roleId: true,
        role: { select: { id: true, name: true } }, 
        createdAt: true, 
        propertyId: true 
      },
      orderBy: { createdAt: 'desc' },
    })

    const users = dbUsers.map((u: any) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      phone: u.phone,
      roleId: u.roleId,
      roleName: u.role?.name || 'STAFF',
      role: u.role,
      createdAt: u.createdAt,
      propertyId: u.propertyId
    }))

    return NextResponse.json({ users })
  } catch (error: any) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch users' }, { status: 500 })
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
    const { email, name, password, roleId, phone } = data
    if (!email || !name) {
      return NextResponse.json({ error: 'email and name are required' }, { status: 400 })
    }

    const propertyId = (await getEffectivePropertyId(req)) || 'default-property'
    const hashedPassword = await bcrypt.hash(password || 'Staff123!', 10)

    const user = await prisma.user.create({
      data: { 
        email: email.toLowerCase().trim(), 
        name, 
        password: hashedPassword, 
        roleId: roleId || undefined,
        phone: phone || undefined,
        propertyId 
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        roleId: true,
        role: { select: { id: true, name: true } },
        createdAt: true,
        propertyId: true
      }
    })

    return NextResponse.json({ 
      user: {
        ...user,
        roleName: user.role?.name || 'STAFF'
      } 
    }, { status: 201 })
  } catch (error: any) {
    console.error('Failed to create user:', error)
    return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500 })
  }
}
