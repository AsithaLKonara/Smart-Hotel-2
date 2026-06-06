import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const conversations = await prisma.guestConversation.findMany({
      include: {
        guest: {
            select: { name: true, email: true }
        },
        messages: {
            orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { lastMessageAt: 'desc' },
    })
    return NextResponse.json(conversations)
  } catch (error) {
    console.error('Failed to fetch conversations:', error)
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    
    // 1. Create or Find Conversation
    let conversationId = data.conversationId

    if (!conversationId) {
        // Find existing open
        const existing = await prisma.guestConversation.findFirst({
            where: { guestId: data.guestId, status: "OPEN" }
        })
        
        if (existing) {
            conversationId = existing.id
        } else {
            const newConv = await prisma.guestConversation.create({
                data: {
                    guestId: data.guestId,
                    aiEnabled: true
                }
            })
            conversationId = newConv.id
        }
    }

    // 2. Add message
    const message = await prisma.guestMessage.create({
        data: {
            conversationId: conversationId,
            senderType: data.senderType || "STAFF",
            content: data.content
        }
    })

    // 3. Update conversation last message timestamp
    await prisma.guestConversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() }
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Failed to send message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
    try {
        const data = await req.json()
        const update = await prisma.guestConversation.update({
            where: { id: data.conversationId },
            data: { aiEnabled: data.aiEnabled }
        })
        return NextResponse.json(update)
    } catch (e) {
        return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 })
    }
}
