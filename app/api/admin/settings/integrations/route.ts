import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const integrations = await prisma.integration.findMany()
    return NextResponse.json(integrations)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json()
    const integration = await prisma.integration.create({
      data: {
        appName: data.appName,
        provider: data.provider,
        status: data.status || 'INACTIVE',
        apiKey: data.apiKey,
      }
    })
    return NextResponse.json(integration, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'An integration with this name already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create integration' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['SUPER_ADMIN'].includes((session.user as any).roleName as string)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await req.json()
        const integration = await prisma.integration.update({
            where: { id: data.id },
            data: { status: data.status, apiKey: data.apiKey }
        })
        return NextResponse.json(integration)
    } catch (e) {
        return NextResponse.json({ error: 'Failed to update integration' }, { status: 500 })
    }
}
