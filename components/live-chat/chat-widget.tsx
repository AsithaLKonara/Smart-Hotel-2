"use client"

import { useState, useEffect, useRef } from 'react'
import { X, Send, Sparkles, User, Headset, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'

interface Message {
  id: string
  text: string
  sender: 'user' | 'support'
  timestamp: Date
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { data: session } = useSession()

  useEffect(() => {
    if (!isOpen) return
    
    async function loadMessages() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/chat/messages')
        if (response.ok) {
          const data = await response.json()
          if (data.messages && Array.isArray(data.messages)) {
            setMessages(data.messages.map((msg: any) => ({
              id: msg.id,
              text: msg.text,
              sender: msg.sender,
              timestamp: new Date(msg.timestamp)
            })))
          }
        }
      } catch (error) {
        console.error('Failed to load chat messages:', error)
        setMessages([{
          id: 'welcome-1',
          text: 'Welcome to the Sanctuary. I am your personal concierge. How may I elevate your experience today?',
          sender: 'support',
          timestamp: new Date()
        }])
      } finally {
        setIsLoading(false)
      }
    }
    
    loadMessages()
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!inputText.trim()) return

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const messageText = inputText
    setInputText('')
    setIsTyping(true)

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: messageText, sender: 'user' })
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(prev => {
          const updated = prev.map(msg => 
            msg.id === userMessage.id ? {
              id: data.message.id,
              text: data.message.text,
              sender: data.message.sender,
              timestamp: new Date(data.message.timestamp)
            } : msg
          )
          
          if (data.supportResponse) {
            updated.push({
              id: data.supportResponse.id,
              text: data.supportResponse.text,
              sender: data.supportResponse.sender,
              timestamp: new Date(data.supportResponse.timestamp)
            })
          }
          
          return updated
        })
        setIsTyping(false)
      } else {
        setMessages(prev => prev.filter(msg => msg.id !== userMessage.id))
        setIsTyping(false)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id))
      setIsTyping(false)
    }
  }

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-luxury z-50 bg-gold-gradient flex items-center justify-center group"
            type="button"
          >
            <MessageSquare className="h-7 w-7 text-white group-hover:scale-110 transition-transform" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[45] bg-midnight/20 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.9 }}
              className="fixed bottom-8 right-8 w-[400px] h-[650px] flex flex-col z-50 rounded-2xl overflow-hidden bg-midnight border border-white/10 shadow-glass"
            >
              {/* Header */}
              <div className="p-6 bg-gradient-to-b from-white/10 to-transparent border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gold-gradient flex items-center justify-center border border-luxury/30">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-white leading-tight">Sanctuary Concierge</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-luxury rounded-full animate-pulse" />
                      <p className="text-[10px] uppercase tracking-widest text-luxury font-bold">Always Available</p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/50 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-fixed opacity-90">
                {messages.map((message) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex flex-col max-w-[85%] ${message.sender === 'user' ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`rounded-2xl px-5 py-3 text-sm leading-relaxed ${
                          message.sender === 'user'
                            ? 'bg-gold-gradient text-white rounded-tr-none shadow-luxury'
                            : 'bg-white/5 text-white/90 border border-white/10 backdrop-blur-md rounded-tl-none'
                        }`}
                      >
                        {message.text}
                      </div>
                      <span className="text-[10px] uppercase tracking-tighter text-white/30 mt-2 font-medium">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </motion.div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 rounded-2xl px-5 py-3 border border-white/10 backdrop-blur-md">
                      <div className="flex gap-1.5">
                        <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 h-1.5 bg-luxury rounded-full" />
                        <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-luxury rounded-full" />
                        <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-luxury rounded-full" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-6 bg-gradient-to-t from-white/10 to-transparent border-t border-white/5">
                <div className="relative group">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="How may I assist you?"
                    className="w-full bg-white/5 border border-white/10 text-white pl-5 pr-14 py-4 rounded-xl text-sm focus:outline-none focus:border-luxury transition-all placeholder:text-white/20"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!inputText.trim()}
                    className="absolute right-2 top-2 bottom-2 px-4 bg-luxury hover:bg-luxury/90 disabled:opacity-30 disabled:hover:bg-luxury text-white rounded-lg transition-all"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Headset className="h-3 w-3 text-luxury" />
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">
                    Premium Support Active
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
