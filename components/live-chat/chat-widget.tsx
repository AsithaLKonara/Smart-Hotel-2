"use client";
import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, X, Minus, Sparkles, Shield, Headphones } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";
import { getSystemContext } from "@/lib/chatbot/context";

export function ChatWidget({
    defaultOpen = false,
}: {
    defaultOpen?: boolean,
}) {
    const [isMounted, setIsMounted] = useState(false);
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [messages, setMessages] = useState<{ id?: string; sender: 'user' | 'support'; text: string; timestamp: Date }[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsMounted(true);

        const welcomeMessage = {
            id: "welcome",
            sender: 'support' as const,
            text: "Welcome to the Sanctuary. I am your personal concierge, dedicated to making your stay extraordinary. How may I assist you today?",
            timestamp: new Date()
        };

        const fetchHistory = async (sid: string) => {
            try {
                const res = await fetch(`/api/chat/messages?sessionId=${sid}`);
                const data = await res.json();
                if (data.messages && data.messages.length > 0) {
                    setMessages(data.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
                } else {
                    setMessages([welcomeMessage]);
                }
            } catch (e) {
                console.error("Failed to fetch history:", e);
                setMessages([welcomeMessage]);
            }
        };

        const key = "smarthotel_chat_session";
        let existing = localStorage.getItem(key);
        if (!existing) {
            existing = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
            localStorage.setItem(key, existing);
        }
        setSessionId(existing);
        fetchHistory(existing);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;
        const userMsg = input.trim();
        const newUserMsg = { id: Date.now().toString(), sender: 'user' as const, text: userMsg, timestamp: new Date() };
        setMessages(prev => [...prev, newUserMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/chat/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    message: userMsg, 
                    messages: messages.slice(-5).map(m => ({ 
                        sender: m.sender, 
                        text: m.text 
                    })),
                    sessionId: sessionId,
                    context: getSystemContext()
                }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                setMessages(prev => [...prev, { 
                    id: Date.now().toString(), 
                    sender: 'support', 
                    text: errorData.error || "I apologize, but our sanctuary network is experiencing a momentary interruption. Please allow me a moment to re-establish the connection.", 
                    timestamp: new Date() 
                }]);
                return;
            }

            if (!res.body) return;
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let assistantContent = "";
            
            const assistantMsgId = (Date.now() + 1).toString();
            setMessages(prev => [...prev, { id: assistantMsgId, sender: 'support', text: "", timestamp: new Date() }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                assistantContent += decoder.decode(value, { stream: true });
                setMessages((prev) => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last && last.id === assistantMsgId) {
                        updated[updated.length - 1] = { ...last, text: assistantContent };
                    }
                    return updated;
                });
            }
        } catch (e) {
            console.error("Chat error:", e);
            setMessages(prev => [...prev, { 
                id: Date.now().toString(), 
                sender: 'support', 
                text: "I am having difficulty reaching our servers. One of our human staff members will be alerted if the issue persists.", 
                timestamp: new Date() 
            }]);
        } finally {
            setLoading(false);
        }
    };

    if (!isMounted) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[9999] font-sans">
            <AnimatePresence mode="wait">
                {isOpen ? (
                    <motion.div
                        key="chat-window"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="w-[380px] md:w-[450px] h-[650px] flex flex-col overflow-hidden relative shadow-[0_32px_128px_-16px_rgba(0,0,0,0.8)] border border-white/5"
                        style={{
                            background: "rgba(6, 15, 28, 0.85)", 
                            backdropFilter: "blur(12px) saturate(180%)",
                            borderRadius: "0px",
                        }}
                    >
                        {/* Status Bar */}
                        <div className="px-5 py-2 bg-blue-500/10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-300/60">Sanctuary Network Active</span>
                            </div>
                            <span className="text-[9px] font-mono text-blue-300/30 uppercase tracking-widest">Concierge v5.0</span>
                        </div>

                        {/* Header */}
                        <div className="p-6 flex justify-between items-center bg-gradient-to-b from-blue-500/10 to-transparent">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-400/30 shadow-2xl">
                                    <Sparkles size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-white text-base leading-tight uppercase tracking-tighter">Sanctuary Concierge</h3>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="w-1 h-1 rounded-full bg-blue-400" />
                                        <span className="text-[10px] text-blue-300/60 font-black uppercase tracking-widest">Elite AI Assistant</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setIsOpen(false)} className="p-2.5 hover:bg-white/10 transition-all text-white/70 hover:text-white">
                                    <Minus size={20} />
                                </button>
                                <button onClick={() => setIsOpen(false)} className="p-2.5 hover:bg-white/10 transition-all text-white/70 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide scroll-smooth">
                            {messages.map((m, i) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={m.id || i}
                                    className={cn("flex", m.sender === "user" ? "justify-end" : "justify-start")}
                                >
                                    <div
                                        className={cn(
                                            "max-w-[85%] px-6 py-4 text-[13px] leading-[1.7] transition-all",
                                            m.sender === "user"
                                                ? "bg-blue-600 text-white font-semibold rounded-none shadow-blue-500/20 shadow-xl"
                                                : "bg-white/[0.05] text-white/95 rounded-none backdrop-blur-md prose-invert border-l-2 border-blue-500"
                                        )}
                                    >
                                        <ReactMarkdown 
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                p: (props) => <p className="mb-2 last:mb-0" {...props} />,
                                                ul: (props) => <ul className="list-disc ml-4 mb-2" {...props} />,
                                                li: (props) => <li className="mb-1" {...props} />,
                                                strong: (props) => <strong className="text-blue-300 font-bold" {...props} />,
                                                code: (props) => <code className="bg-blue-500/20 text-blue-200 px-1.5 py-0.5 rounded-none text-xs font-mono" {...props} />,
                                            }}
                                        >
                                            {m.text}
                                        </ReactMarkdown>
                                    </div>
                                </motion.div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-blue-500/10 border-l-2 border-blue-500 px-5 py-3 rounded-none flex gap-1.5 items-center">
                                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
                                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-6 bg-gradient-to-t from-blue-500/5 to-transparent">
                            <div className="relative flex items-center gap-3 bg-white/[0.03] border border-blue-500/20 rounded-none p-2 shadow-2xl focus-within:border-blue-500/50 focus-within:bg-white/[0.05] transition-all group">
                                <input
                                    className="flex-1 bg-transparent px-5 py-3 text-sm text-white placeholder-blue-300/30 outline-none font-medium"
                                    placeholder="Speak with the concierge..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!input.trim() || loading}
                                    className="w-12 h-12 bg-blue-600 text-white rounded-none hover:bg-blue-500 transition-all disabled:opacity-20 flex items-center justify-center shadow-lg"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                            <div className="mt-4 flex justify-between items-center opacity-30 text-[9px] font-black uppercase tracking-[0.2em] text-blue-300">
                                <div className="flex items-center gap-1.5">
                                    <Shield size={10} /> <span>Encrypted</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Headphones size={10} /> <span>Live Support</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.button
                        key="chat-trigger"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsOpen(true)}
                        className="w-16 h-16 bg-transparent text-white rounded-none flex items-center justify-center group relative overflow-hidden border border-white/10 hover:bg-white/5 transition-all"
                    >
                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                        <MessageCircle size={28} className="relative z-10" />
                        <div className="absolute top-0 right-0 w-3 h-3 bg-blue-400 z-20" />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}
