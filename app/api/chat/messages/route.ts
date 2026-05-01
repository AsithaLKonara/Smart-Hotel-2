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
          text: 'Welcome to the Sanctuary. I am your personal concierge, dedicated to making your stay extraordinary. How may I assist you this evening?',
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
    
    // Sophisticated AI Persona Response Logic
    let supportResponse = null
    if (data.sender === 'user') {
      const input = data.text.toLowerCase()
      let responseText = "Thank you for reaching out. A member of our concierge team will be with you momentarily to assist with your request."

      // Simple intent detection
      if (input.includes('booking') || input.includes('reserve') || input.includes('room')) {
        responseText = "I would be delighted to assist with your reservation. You may explore our Signature Suites directly on our booking page, or I can check availability for specific dates for you."
      } else if (input.includes('dining') || input.includes('restaurant') || input.includes('food')) {
        responseText = "Our Michelin-starred culinary team is ready to serve you. Would you like me to secure a table at the Grand Salon for this evening?"
      } else if (input.includes('spa') || input.includes('massage') || input.includes('wellness')) {
        responseText = "The Royal Spa offers a sanctuary for the senses. I can arrange a bespoke holistic treatment for you at your earliest convenience."
      } else if (input.includes('location') || input.includes('where') || input.includes('address')) {
        responseText = "We are located in the prestigious heart of the city at 123 Grand Boulevard. I can arrange a private chauffeur to bring you to our doors if you wish."
      }

      supportResponse = {
        id: `msg-${Date.now() + 1}-${Math.random().toString(36).substr(2, 9)}`,
        text: responseText,
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
      supportResponse 
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

