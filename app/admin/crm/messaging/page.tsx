"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Send, Bot, User, UserCheck } from 'lucide-react'
import toast from 'react-hot-toast'

export default function MessagingCenter() {
  const [conversations, setConversations] = useState<any[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/crm/messaging')
      if (res.ok) {
          const data = await res.json()
          setConversations(data)
          if (data.length > 0 && !activeConvId) {
              setActiveConvId(data[0].id)
          }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeConvId) return

    try {
      const res = await fetch('/api/admin/crm/messaging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            conversationId: activeConvId,
            senderType: 'STAFF',
            content: newMessage
        })
      })
      if (res.ok) {
        setNewMessage('')
        fetchData()
      }
    } catch (e) {
      toast.error("Error sending message")
    }
  }

  const toggleAI = async (convId: string, currentState: boolean) => {
      try {
          const res = await fetch('/api/admin/crm/messaging', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ conversationId: convId, aiEnabled: !currentState })
          })
          if (res.ok) {
              toast.success(`AI Auto-Reply ${!currentState ? 'Enabled' : 'Disabled'}`)
              fetchData()
          }
      } catch (e) {
          console.error(e)
      }
  }

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8" /></div>

  const activeConv = conversations.find(c => c.id === activeConvId)

  return (
    <div className="p-6 text-foreground dark:text-white max-w-6xl mx-auto h-[90vh] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold font-serif text-foreground dark:text-white">Guest Messaging Center</h1>
          <p className="text-muted-foreground dark:text-slate-400">Communicate with guests and configure AI Concierge</p>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
          
          {/* LEFT PANE: INBOX LIST */}
          <div className="w-1/3 flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
              {conversations.map(conv => (
                  <div 
                    key={conv.id} 
                    onClick={() => setActiveConvId(conv.id)}
                    className={`p-4 rounded-xl cursor-pointer border transition-all ${activeConvId === conv.id ? 'bg-primary/10 border-primary/30 dark:bg-[#2a2a2a] dark:border-white/20' : 'bg-card border-border dark:bg-[#1a1a1a] dark:border-transparent hover:bg-muted dark:hover:bg-white/5'}`}
                  >
                      <div className="flex justify-between items-center mb-2">
                          <h3 className="font-bold flex items-center gap-2 text-foreground dark:text-white">
                              {conv.guest?.name || 'Unknown Guest'}
                          </h3>
                          {conv.aiEnabled && <Bot className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />}
                      </div>
                      <p className="text-xs text-muted-foreground dark:text-slate-400 line-clamp-1">
                          {conv.messages?.[conv.messages.length - 1]?.content || 'No messages yet'}
                      </p>
                      <div className="text-[10px] text-muted-foreground/60 dark:text-slate-500 mt-2 text-right">
                          {new Date(conv.lastMessageAt).toLocaleString()}
                      </div>
                  </div>
              ))}
              {conversations.length === 0 && (
                  <div className="text-center p-8 text-muted-foreground dark:text-slate-500">No active conversations.</div>
              )}
          </div>

          {/* RIGHT PANE: CHAT WINDOW */}
          <Card className="flex-1 bg-card dark:bg-[#1a1a1a] border-border dark:border-white/10 text-card-foreground dark:text-white flex flex-col overflow-hidden shadow-sm">
              {activeConv ? (
                  <>
                      {/* Chat Header */}
                      <div className="p-4 border-b border-border dark:border-white/10 flex justify-between items-center bg-muted/40 dark:bg-black/20">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-muted dark:bg-slate-800 flex items-center justify-center">
                                  <UserCheck className="w-5 h-5 text-muted-foreground dark:text-slate-400" />
                              </div>
                              <div>
                                  <div className="font-bold text-foreground dark:text-white">{activeConv.guest?.name}</div>
                                  <div className="text-xs text-muted-foreground dark:text-slate-400">{activeConv.guest?.email}</div>
                              </div>
                          </div>
                          <div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => toggleAI(activeConv.id, activeConv.aiEnabled)}
                                className={activeConv.aiEnabled ? 'border-emerald-500/50 text-emerald-600 dark:text-emerald-400' : 'border-border dark:border-slate-500/50 text-muted-foreground dark:text-slate-400'}
                              >
                                  <Bot className="w-4 h-4 mr-2" />
                                  AI Auto-Reply {activeConv.aiEnabled ? 'ON' : 'OFF'}
                              </Button>
                          </div>
                      </div>

                      {/* Chat History */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                          {activeConv.messages?.map((msg: any) => {
                              const isGuest = msg.senderType === 'GUEST'
                              return (
                                  <div key={msg.id} className={`flex ${isGuest ? 'justify-start' : 'justify-end'}`}>
                                      <div className={`max-w-[70%] p-3 rounded-2xl ${
                                          isGuest 
                                            ? 'bg-muted dark:bg-slate-800 text-foreground dark:text-slate-200 rounded-tl-none' 
                                            : msg.senderType === 'AI'
                                                ? 'bg-indigo-100 dark:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-500/30 rounded-tr-none text-indigo-950 dark:text-indigo-100'
                                                : 'bg-emerald-600 text-white rounded-tr-none'
                                      }`}>
                                          <div className="text-sm">{msg.content}</div>
                                          <div className={`text-[10px] mt-1 text-right flex items-center justify-end gap-1 ${isGuest ? 'text-muted-foreground dark:text-slate-400' : 'text-emerald-100'}`}>
                                              {msg.senderType === 'AI' && <Bot className="w-3 h-3" />}
                                              {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                          </div>
                                      </div>
                                  </div>
                              )
                          })}
                      </div>

                      {/* Chat Input */}
                      <div className="p-4 border-t border-border dark:border-white/10 bg-muted/40 dark:bg-black/20">
                          <form onSubmit={handleSendMessage} className="flex gap-2">
                              <input 
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                placeholder="Type a message to the guest..." 
                                className="flex-1 p-3 rounded-xl bg-background dark:bg-black/50 border border-input dark:border-white/10 text-foreground dark:text-white placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                              <Button type="submit" size="icon" className="h-12 w-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                                  <Send className="w-5 h-5" />
                              </Button>
                          </form>
                      </div>
                  </>
              ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground dark:text-slate-500">
                      Select a conversation to start messaging
                  </div>
              )}
          </Card>

      </div>
    </div>
  )
}
