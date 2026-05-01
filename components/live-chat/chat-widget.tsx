"use client";
import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, X, Minus, Sparkles, Bot, Command } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";
import { getSystemContext } from "@/lib/chatbot/context";
import ReactMarkdown from "react-markdown";

export function ChatWidget({
    defaultOpen = false,
}: {
    defaultOpen?: boolean,
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [messages, setMessages] = useState<{ id?: string; sender: 'user' | 'support'; text: string; timestamp: Date }[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const key = "smarthotel_chat_session";
        const existing = localStorage.getItem(key);
        if (existing) {
            setSessionId(existing);
            fetchHistory(existing);
        } else {
            const created = crypto.randomUUID();
            localStorage.setItem(key, created);
            setSessionId(created);
            fetchHistory(created);
        }
    }, []);

    const fetchHistory = async (sid: string) => {
        try {
            const res = await fetch(`/api/chat/messages?sessionId=${sid}`);
            const data = await res.json();
            if (data.messages) {
                setMessages(data.messages);
            }
        } catch (e) {
            console.error("Failed to fetch history:", e);
        }
    };

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
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] font-sans">
            <AnimatePresence>
                {isOpen ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 24, filter: "blur(10px)" }}
                        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, scale: 0.9, y: 24, filter: "blur(10px)" }}
                        className="w-[380px] md:w-[420px] h-[600px] flex flex-col overflow-hidden relative shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]"
                        style={{
                            background: "rgba(10, 25, 47, 0.85)", // Deep Navy
                            backdropFilter: "blur(32px) saturate(200%)",
                            borderRadius: "32px",
                            border: "1px solid rgba(193, 155, 84, 0.2)", // Subtle Gold Border
                        }}
                    >
                        {/* Status Bar */}
                        <div className="px-5 py-2 bg-black/20 border-b border-gold/10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gold/40">Sanctuary Network Active</span>
                            </div>
                            <span className="text-[9px] font-mono text-gold/20 uppercase tracking-widest">Concierge v5.0</span>
                        </div>

                        {/* Header */}
                        <div className="p-6 flex justify-between items-center border-b border-gold/10 bg-gradient-to-b from-gold/5 to-transparent">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center text-gold border border-gold/20 shadow-2xl">
                                    <Sparkles size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-white text-base leading-tight uppercase tracking-tighter">Sanctuary Concierge</h3>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="w-1 h-1 rounded-full bg-gold" />
                                        <span className="text-[10px] text-gold/60 font-black uppercase tracking-widest">Elite AI Assistant</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setIsOpen(false)} className="p-2.5 hover:bg-gold/10 rounded-2xl transition-all text-gold/40 hover:text-gold">
                                    <Minus size={20} />
                                </button>
                                <button onClick={() => setIsOpen(false)} className="p-2.5 hover:bg-gold/10 rounded-2xl transition-all text-gold/40 hover:text-gold">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide scroll-smooth">
                            {messages.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-30 space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-gold/5 flex items-center justify-center mb-2 animate-pulse">
                                        <Command size={32} className="text-gold" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] leading-loose text-gold">Initializing Sanctuary Link...<br/>Awaiting Guest Request...</p>
                                </div>
                            )}
                            {messages.map((m, i) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    key={i}
                                    className={cn("flex", m.sender === "user" ? "justify-end" : "justify-start")}
                                >
                                    <div
                                        className={cn(
                                            "max-w-[90%] px-5 py-4 text-sm leading-[1.6]",
                                            m.sender === "user"
                                                ? "bg-gradient-to-br from-gold to-[#c19b54] text-navy font-bold rounded-[24px] rounded-tr-sm shadow-xl"
                                                : "bg-white/5 border border-gold/20 text-white/90 rounded-[24px] rounded-tl-sm backdrop-blur-sm prose-invert prose-gold"
                                        )}
                                    >
                                        <ReactMarkdown 
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                p: (props) => <p className="mb-2 last:mb-0" {...props} />,
                                                ul: (props) => <ul className="list-disc ml-4 mb-2" {...props} />,
                                                li: (props) => <li className="mb-1" {...props} />,
                                                strong: (props) => <strong className="text-gold font-bold" {...props} />,
                                                code: (props) => <code className="bg-gold/10 text-gold px-1.5 py-0.5 rounded text-xs font-mono" {...props} />,
                                            }}
                                        >
                                            {m.text}
                                        </ReactMarkdown>
                                    </div>
                                </motion.div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-gold/5 border border-gold/20 px-5 py-3 rounded-2xl flex gap-1.5 items-center">
                                        <span className="w-1.5 h-1.5 bg-gold/40 rounded-full animate-bounce" />
                                        <span className="w-1.5 h-1.5 bg-gold/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                                        <span className="w-1.5 h-1.5 bg-gold/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-6 bg-gradient-to-t from-gold/5 to-transparent border-t border-gold/10">
                            <div className="relative flex items-center gap-3 bg-white/[0.03] border border-gold/20 rounded-[28px] p-2 pr-2.5 shadow-2xl focus-within:border-gold/40 focus-within:bg-white/[0.05] transition-all group">
                                <input
                                    className="flex-1 bg-transparent px-5 py-3 text-sm text-white placeholder-gold/30 outline-none font-medium"
                                    placeholder="Speak with the concierge..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!input.trim() || loading}
                                    className="w-12 h-12 bg-gradient-to-br from-gold to-[#c19b54] text-navy rounded-[22px] hover:scale-105 active:scale-95 transition-all disabled:opacity-20 disabled:scale-100 flex items-center justify-center shadow-lg"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                            <div className="mt-4 flex justify-center items-center gap-2 opacity-20 cursor-default hover:opacity-40 transition-opacity">
                                <Sparkles size={10} className="text-gold" />
                                <span className="text-[8px] font-black uppercase tracking-[0.4em] text-gold">Sanctuary Digital Experience</span>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.button
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsOpen(true)}
                        className="w-16 h-16 bg-gradient-to-br from-gold to-[#c19b54] text-navy rounded-[24px] shadow-[0_20px_40px_-10px_rgba(193,155,84,0.4)] flex items-center justify-center group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                        <MessageCircle size={28} className="relative z-10" />
                        <div className="absolute top-3 right-3 w-3 h-3 bg-navy border-2 border-gold rounded-full z-20 shadow-lg" />
                    </motion.button>
                )}
            </AnimatePresence>
            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                .prose-gold strong { color: #c19b54 !important; }
            `}</style>
        </div>
    );
}
