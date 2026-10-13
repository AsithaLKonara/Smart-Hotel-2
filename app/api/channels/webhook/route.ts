import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { inboundOtaQueue } from '@/lib/channel-manager/queues'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  // 1. AUTHENTICATION VALIDATION (HMAC Signature)
  const signature = req.headers.get('x-ota-signature')
  const expectedSecret = process.env.OTA_WEBHOOK_SECRET
  
  if (!expectedSecret) {
    console.error('[OTA_WEBHOOK] OTA_WEBHOOK_SECRET is missing. Failing closed.');
    return NextResponse.json({ error: 'Internal server error: Webhook not configured securely' }, { status: 500 })
  }

  if (!signature) {
    return NextResponse.json({ error: 'Unauthorized: Missing x-ota-signature header' }, { status: 401 })
  }

  const rawBody = await req.text()
  
  const hmac = crypto.createHmac('sha256', expectedSecret).update(rawBody).digest('hex')
  if (hmac !== signature) {
    return NextResponse.json({ error: 'Unauthorized: Invalid signature digest' }, { status: 401 })
  }

  const configId = req.nextUrl.searchParams.get('configId')
  if (!configId) {
    return NextResponse.json({ error: 'Missing configId query parameter' }, { status: 400 })
  }

  try {
    const connection = await prisma.channelConnection.findUnique({
      where: { id: configId },
      include: { provider: true }
    })

    if (!connection) {
      return NextResponse.json({ error: 'Invalid configId' }, { status: 400 })
    }

    // Push the raw message to the inbound queue immediately
    await inboundOtaQueue.add('process-webhook', {
      operation: 'WEBHOOK_PUSH',
      connectionId: connection.id,
      providerCode: connection.provider.code,
      payload: rawBody
    })

    return NextResponse.json({ success: true, message: 'Webhook queued' }, { status: 202 })

  } catch (error) {
    console.error('Channel Webhook Error:', error)
    return NextResponse.json({ error: 'Failed to process OTA webhook' }, { status: 500 })
  }
}

