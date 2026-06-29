import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const webhooks = await prisma.webhookEndpoint.findMany()
    return NextResponse.json(webhooks)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch webhooks' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const webhook = await prisma.webhookEndpoint.create({
      data: {
        url: data.url,
        event: data.event,
        isActive: data.isActive ?? true,
        secret: data.secret
      }
    })
    return NextResponse.json(webhook, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 })
  }
}
