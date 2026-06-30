import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
  try {
    const roles = await prisma.role.findMany({
      where: {
        name: { not: 'GUEST' }
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    })

    const allPermissions = await prisma.permission.findMany()

    return NextResponse.json({ roles, allPermissions })
  } catch (error: any) {
    console.error('Fetch Roles Error:', error)
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 })
  }
}
