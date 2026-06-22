import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const integrations = await prisma.integration.findMany()
    return NextResponse.json(integrations)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
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
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create integration' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
    try {
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
