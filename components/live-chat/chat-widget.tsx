"use client"

import { useState, useEffect, useRef } from 'react'

import { X, Send, Bot } from 'lucide-react'

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
      text: 'Salama! How can I help you today?',
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

    setTimeout(() => {
      const supportMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Misaotra! We received your message — how may we assist you?",
        sender: 'support',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, supportMessage])
      setIsTyping(false)
    }, 1000)
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-primary-600 hover:bg-primary-700 transition-all duration-300 animate-pulse hover:animate-none flex items-center justify-center"
          type="button"
        >
          <Bot className="h-7 w-7 text-white" />
        </button>
      )}

      {/* BACKDROP */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[45]"
          onClick={() => setIsOpen(false)}
          style={{
            backgroundColor: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(14px)"
          }}
        />
      )}

      {/* CHAT WINDOW */}
      {isOpen && (
        <div
          className="fixed bottom-6 right-6 w-96 h-[600px] flex flex-col z-50 rounded-xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.75)",
            backdropFilter: "blur(40px) saturate(200%) brightness(1.2)",
            boxShadow:
              "0 8px 32px rgba(31,38,135,0.4), inset 0 1px 0 rgba(255,255,255,0.6)",
            border: "1px solid rgba(255,255,255,0.45)"
          }}
        >
          {/* HEADER */}
          <div
            className="flex items-center justify-between p-4 border-b"
            style={{
              background: "rgba(250,245,240,0.7)",
              backdropFilter: "blur(12px)",
              borderColor: "rgba(255,255,255,0.3)"
            }}
          >
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary-600" />
              <div>
                <h3 className="font-semibold text-sm">SmartHotel Support</h3>
                <p className="text-xs text-gray-500">We reply instantly</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* -------------- GASY STYLE INNER BACKGROUND -------------- */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-4"
            style={{
              backgroundImage:
                `linear-gradient(
                  rgba(255, 244, 233, 0.85),
                  rgba(245, 230, 214, 0.9)
                ),
                url("https://i.imgur.com/JKW9S4Y.png")`, // woven raffia texture
              backgroundSize: "cover",
              backgroundBlendMode: "overlay",
              backgroundPosition: "center",
              backdropFilter: "blur(3px)",
            }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === 'user'
                    ? 'justify-end'
                    : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.sender === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-[rgba(255,255,255,0.7)] text-gray-900 backdrop-blur-sm'
                  }`}
                  style={{
                    boxShadow:
                      message.sender === 'support'
                        ? "0 1px 3px rgba(0,0,0,0.15)"
                        : "0 1px 3px rgba(2,132,199,0.35)"
                  }}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-[rgba(255,255,255,0.7)] rounded-lg p-3 backdrop-blur-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.4s" }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT */}
          <div className="border-t p-4 bg-white/60 backdrop-blur-md">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Soraty eto..." // Malagasy placeholder
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/80 backdrop-blur"
              />
              <Button onClick={sendMessage} disabled={!inputText.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              {session?.user?.name
                ? `Chatting as ${session.user.name}`
                : "Chatting as guest"}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
