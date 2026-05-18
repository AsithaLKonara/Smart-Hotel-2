"use client";
import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, X, Minus, Sparkles, Shield, Bot, Command, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import remarkGfm from "remark-gfm";

const ReactMarkdown = dynamic(() => import("react-markdown"), { 
    ssr: false,
    loading: () => <div className="animate-pulse bg-white/5 h-20 w-full" />
});

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
    const [isTyping, setIsTyping] = useState(false);
    const [sessionId, setSessionId] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    const suggestions = [
        "Book a Luxury Suite",
        "View Dining Options",
        "Spa & Wellness",
        "Concierge Services"
    ];

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

    const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

    const getDelay = (word: string) => {
        if (/[.,!?]/.test(word)) return 120;
        if (word.length > 8) return 35;
        return 18 + Math.random() * 20;
    };

    const sendMessage = async (overrideInput?: string) => {
        const textToSend = (overrideInput || input).trim();
        if (!textToSend || loading) return;
        
        const newUserMsg = { id: Date.now().toString(), sender: 'user' as const, text: textToSend, timestamp: new Date() };
        setMessages(prev => [...prev, newUserMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/chat/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    message: textToSend, 
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
                    text: errorData.error || "I apologize, but our sanctuary network is experiencing a momentary interruption.", 
                    timestamp: new Date() 
                }]);
                return;
            }

            if (!res.body) return;
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            
            let buffer = "";
            let displayedText = "";
            const assistantMsgId = (Date.now() + 1).toString();
            
            setMessages(prev => [...prev, { id: assistantMsgId, sender: 'support', text: "", timestamp: new Date() }]);
            setLoading(false);
            setIsTyping(true);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                const words = buffer.split(" ");
                buffer = words.pop() || "";

                for (const word of words) {
                    displayedText += (displayedText ? " " : "") + word;
                    await sleep(getDelay(word));
                    setMessages(prev => {
                        const updated = [...prev];
                        const last = updated[updated.length - 1];
                        if (last && last.id === assistantMsgId) {
                            updated[updated.length - 1] = { ...last, text: displayedText };
                        }
                        return updated;
                    });
                }
            }

            if (buffer) {
                displayedText += (displayedText ? " " : "") + buffer;
                setMessages(prev => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last && last.id === assistantMsgId) {
                        updated[updated.length - 1] = { ...last, text: displayedText };
                    }
                    return updated;
                });
            }
        } catch (e) {
            console.error("Chat error:", e);
            setMessages(prev => [...prev, { 
                id: Date.now().toString(), 
                sender: 'support', 
                text: "I am having difficulty reaching our servers.", 
                timestamp: new Date() 
            }]);
        } finally {
            setLoading(false);
            setIsTyping(false);
        }
    };

    if (!isMounted) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[9999] font-sans selection:bg-white/20">
            <AnimatePresence>
                {isOpen ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 24, filter: "blur(10px)" }}
                        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, scale: 0.9, y: 24, filter: "blur(10px)" }}
                        className="chatbot-window w-[380px] md:w-[420px] h-[650px] flex flex-col overflow-hidden relative shadow-[0_32px_128px_-16px_rgba(0,0,0,0.8)]"
                        style={{
                            background: "rgba(6, 15, 28, 0.75)",
                            backdropFilter: "blur(12px) saturate(180%)",
                            borderRadius: "32px",
                        }}
                    >
                        {/* Status bar */}
                        <div className="px-5 py-3 bg-primary/10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/60">Sanctuary Sync Active</span>
                            </div>
                            <span className="text-[9px] font-mono text-primary/30 uppercase tracking-widest">v5.0-Neural</span>
                        </div>

                        {/* Header */}
                        <div className="p-6 flex justify-between items-center bg-gradient-to-b from-primary/10 to-transparent">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-gold-gradient flex items-center justify-center text-white shadow-luxury">
                                    <Sparkles size={24} className="relative z-10" />
                                </div>
                                <div>
                                    <h3 className="font-black text-white text-base leading-tight uppercase tracking-tighter">Sanctuary Concierge</h3>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="w-1 h-1 rounded-full bg-primary" />
                                        <span className="text-[10px] text-primary/50 font-black uppercase tracking-widest">Neural Cluster #A1</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button aria-label="Minimize chat" onClick={() => setIsOpen(false)} className="p-2.5 hover:bg-white/10 rounded-2xl transition-all text-white/40 hover:text-white">
                                    <Minus size={20} />
                                </button>
                                <button aria-label="Close chat" onClick={() => setIsOpen(false)} className="p-2.5 hover:bg-white/10 rounded-2xl transition-all text-white/40 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide scroll-smooth">
                            {messages.map((m, i) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    key={i}
                                    className={cn("flex", m.sender === "user" ? "justify-end" : "justify-start")}
                                >
                                    <div
                                        className={cn(
                                            "max-w-[90%] px-5 py-4 text-[13px] leading-[1.6]",
                                            m.sender === "user"
                                                ? "bg-gradient-to-br from-blue-500/30 to-blue-600/50 text-blue-50 font-semibold rounded-[24px] rounded-tr-sm shadow-xl backdrop-blur-md"
                                                : "bg-gradient-to-br from-yellow-500/10 to-yellow-600/20 text-yellow-50 rounded-[24px] rounded-tl-sm backdrop-blur-md prose-invert border-l border-yellow-500/30"
                                        )}
                                    >
                                        <ReactMarkdown 
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                p: (props: any) => <p className="mb-2 last:mb-0" {...props} />,
                                                ul: (props: any) => <ul className="list-disc ml-4 mb-2" {...props} />,
                                                ol: (props: any) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                                                li: (props: any) => <li className="mb-1" {...props} />,
                                                h1: (props: any) => <h1 className="text-lg font-black uppercase tracking-tight mb-2 text-blue-400" {...props} />,
                                                h2: (props: any) => <h2 className="text-base font-black uppercase tracking-tight mb-2 text-blue-400" {...props} />,
                                                code: (props: any) => <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono text-blue-200" {...props} />,
                                                pre: (props: any) => <pre className="bg-white/5 p-3 rounded-xl overflow-x-auto text-[13px] font-mono mb-2 border border-white/5" {...props} />,
                                            }}
                                        >
                                            {m.text}
                                        </ReactMarkdown>
                                        {isTyping && i === messages.length - 1 && m.sender === "support" && (
                                            <span className="inline-block ml-1 w-1 h-3.5 bg-blue-500 animate-pulse align-middle" />
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                            
                            {/* Suggestions */}
                            {messages.length === 1 && !loading && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-wrap gap-2 px-1"
                                >
                                    {suggestions.map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => sendMessage(s)}
                                            className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all active:scale-95"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </motion.div>
                            )}

                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-primary/10 px-5 py-3 rounded-2xl flex gap-1.5 items-center">
                                        <motion.span animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                                        <motion.span animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                                        <motion.span animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-6 bg-gradient-to-t from-blue-900/40 to-transparent backdrop-blur-xl">
                            <div className="relative flex items-center gap-3 bg-white/[0.05] rounded-[28px] p-2 pr-2.5 shadow-2xl focus-within:bg-white/[0.1] transition-all group">
                                <input
                                    className="flex-1 bg-transparent px-5 py-3 text-sm text-blue-50 placeholder-blue-200/30 outline-none font-medium"
                                    placeholder="Speak with the concierge..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                                />
                                <button
                                    aria-label="Send message"
                                    onClick={() => sendMessage()}
                                    disabled={!input.trim() || loading}
                                    className="w-12 h-12 bg-gold-gradient text-white rounded-[22px] hover:scale-105 active:scale-95 transition-all disabled:opacity-20 disabled:scale-100 flex items-center justify-center shadow-luxury"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                            <div className="mt-4 flex justify-between items-center opacity-30 text-[8px] font-black uppercase tracking-[0.4em] text-blue-200">
                                <div className="flex items-center gap-2">
                                    <Shield size={10} /> <span>Encrypted</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Zap size={10} /> <span>Neural Engine</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.button
                        aria-label="Open chat concierge"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsOpen(true)}
                        className="w-16 h-16 bg-gold-gradient text-white rounded-[24px] shadow-luxury flex items-center justify-center group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                        <MessageCircle size={28} className="relative z-10" />
                        <div className="absolute top-3 right-3 w-3 h-3 bg-white border-2 border-primary/40 rounded-full z-20 shadow-lg animate-pulse" />
                    </motion.button>
                )}
            </AnimatePresence>
            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
