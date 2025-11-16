"use client"

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Bot, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSession } from 'next-auth/react'

interface Message {
  id: string
  text: string
  sender: 'user' | 'support'
  timestamp: Date
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! How can I help you today?',
      sender: 'support',
      timestamp: new Date()
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { data: session } = useSession()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!inputText.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsTyping(true)

    // Simulate support response (in production, connect to real chat API)
    setTimeout(() => {
      const supportMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: getResponse(inputText),
        sender: 'support',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, supportMessage])
      setIsTyping(false)
    }, 1000)
  }

  const getResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase()
    if (lowerMessage.includes('booking') || lowerMessage.includes('reserve')) {
      return 'I can help you with bookings! You can browse available rooms and make a reservation. Would you like me to guide you through the process?'
    }
    if (lowerMessage.includes('cancel') || lowerMessage.includes('refund')) {
      return 'For cancellations or refunds, please contact our front desk at +1 (555) 123-4567 or email us at info@smarthotel.com. We\'ll be happy to assist you.'
    }
    if (lowerMessage.includes('check-in') || lowerMessage.includes('checkout')) {
      return 'Check-in time is 3:00 PM and check-out time is 11:00 AM. Early check-in or late check-out may be available upon request, subject to availability.'
    }
    if (lowerMessage.includes('amenities') || lowerMessage.includes('facilities')) {
      return 'We offer free WiFi, fitness center, swimming pool, spa services, restaurant, room service, and valet parking. Is there something specific you\'d like to know about?'
    }
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('help')) {
      return 'Hello! I\'m here to help with bookings, questions about our hotel, amenities, or anything else you need. What can I assist you with?'
    }
    return 'Thank you for your message! Our team will get back to you shortly. In the meantime, you can call us at +1 (555) 123-4567 for immediate assistance.'
  }

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-primary-600 hover:bg-primary-700 transition-all duration-300 animate-pulse hover:animate-none flex items-center justify-center"
          type="button"
          aria-label="Open live chat"
          style={{
            boxShadow: '0 10px 25px rgba(2, 132, 199, 0.4)',
            color: '#ffffff',
          }}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="text-white"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
      )}

      {/* Blur Background Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[45] transition-all duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(12px) saturate(180%)',
            WebkitBackdropFilter: 'blur(12px) saturate(180%)',
            // @ts-ignore - MozBackdropFilter for Firefox support
            MozBackdropFilter: 'blur(12px) saturate(180%)',
          } as React.CSSProperties}
        />
      )}

      {/* Chat Window - Glass Morphism Style */}
      {isOpen && (
        <div 
          className="fixed bottom-6 right-6 w-96 h-[600px] flex flex-col z-50 rounded-lg overflow-hidden"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(30px) saturate(180%) brightness(1.1)',
            WebkitBackdropFilter: 'blur(30px) saturate(180%) brightness(1.1)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
          } as React.CSSProperties}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b" style={{
            backgroundColor: 'rgba(240, 249, 255, 0.6)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderColor: 'rgba(255, 255, 255, 0.2)',
          } as React.CSSProperties}>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary-600" />
              <div>
                <h3 className="font-semibold text-sm">SmartHotel Support</h3>
                <p className="text-xs text-gray-500">We typically reply instantly</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              type="button"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.sender === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender === 'user' ? 'text-primary-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Button onClick={sendMessage} disabled={!inputText.trim()} type="button">
                <span className="sr-only">Send message</span>
                <Send className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {session?.user?.name ? `Chatting as ${session.user.name}` : 'Chatting as guest'}
            </p>
          </div>
        </div>
      )}
    </>
  )
}

