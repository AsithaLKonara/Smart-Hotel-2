import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import prisma from '@/lib/db'
import { isDatabaseConfigured } from '@/lib/db-helpers'

const messageSchema = z.object({
  text: z.string().min(1, 'Message cannot be empty'),
  sender: z.enum(['user', 'support']),
})

// Simple in-memory store for chat messages (can be upgraded to database later)
// In production, this should use a database model like ChatMessage
const chatMessagesStore = new Map<string, Array<{
  id: string
  text: string
  sender: 'user' | 'support'
  timestamp: Date
  userId?: string
}>>()

// Get or create chat session for user
function getChatSession(userId?: string): string {
  return userId || 'guest'
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const sessionId = getChatSession(session?.user?.id)
    
    // Get messages for this session
    const messages = chatMessagesStore.get(sessionId) || []
    
    // If no messages, return default welcome message
    if (messages.length === 0) {
      return NextResponse.json({
        messages: [{
          id: 'welcome-1',
          text: 'Salama! How can I help you today?',
          sender: 'support',
          timestamp: new Date()
        }]
      })
    }
    
    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Failed to fetch chat messages:', error)
    return NextResponse.json(
      { error: 'Failed to load messages' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const data = messageSchema.parse(body)
    
    const sessionId = getChatSession(session?.user?.id)
    
    // Create new message
    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: data.text,
      sender: data.sender,
      timestamp: new Date(),
      userId: session?.user?.id
    }
    
    // Store message
    if (!chatMessagesStore.has(sessionId)) {
      chatMessagesStore.set(sessionId, [])
    }
    chatMessagesStore.get(sessionId)!.push(message)
    
    // Auto-respond for support messages (in production, this would be handled by a support agent or AI)
    let supportResponse = null
    if (data.sender === 'user') {
      // Create support response immediately (in production, this would be handled by a support agent or AI)
      supportResponse = {
        id: `msg-${Date.now() + 1}-${Math.random().toString(36).substr(2, 9)}`,
        text: "Misaotra! We received your message — how may we assist you?",
        sender: 'support' as const,
        timestamp: new Date(),
      }
      
      // Store support response
      if (chatMessagesStore.has(sessionId)) {
        chatMessagesStore.get(sessionId)!.push(supportResponse)
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message,
      supportResponse // Include support response if available
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.flatten() },
        { status: 400 }
      )
    }
    
    console.error('Failed to send chat message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}

