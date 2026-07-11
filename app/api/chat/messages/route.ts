import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { groq } from "@/lib/chatbot/groq";
import { getHistory, saveMessage } from "@/lib/chatbot/memory";
import { searchKnowledge } from "@/lib/chatbot/knowledge";
import { detectIntent } from "@/lib/chatbot/intent";
import { 
    searchRooms, 
    checkBooking, 
    searchMenu, 
    getAmenities,
    formatRoomSummary,
    formatBookingSummary,
    formatMenuItem
} from "@/lib/chatbot/hotel-tools";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const dynamic = "force-dynamic";

// ─── Rate limiter ─────────────────────────────────────────────────────────────
let ratelimit: Ratelimit | null = null;
export let redisClient: Redis | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redisClient = Redis.fromEnv();
    ratelimit = new Ratelimit({
        redis: redisClient,
        limiter: Ratelimit.slidingWindow(20, "1 m"),
        analytics: true,
    });
}

const SYSTEM_PROMPT = `You are the Sanctuary Concierge, the elite AI guardian of the SmartHotel experience.
Voice & Tone: Elegant, sophisticated, warm, and hyper-professional. You represent a six-star luxury establishment.
Midnight & Gold Theme: Your responses should feel like they are coming from a high-end concierge desk.

Rules:
1. Help guests with room bookings, reservation statuses, restaurant menus, and hotel amenities.
2. Use the provided tools and knowledge snippets to give accurate information.
3. If tool results are available, integrate them naturally into your conversation.
4. If you cannot fulfill a request, politely explain why and offer the assistance of our human staff.
5. Keep responses concise but impactful.
6. Never break character.`;

async function runTool(intent: any, userMessage: string): Promise<string> {
    const { entities } = intent;

    try {
        switch (intent.intent) {
            case "room_search": {
                const rooms = await searchRooms(entities.room_type);
                if (!rooms.length) return "I apologize, but I couldn't find any suites matching that specific request at the moment. Would you like me to show our Signature Collection instead?";
                return "Here are our current availabilities:\n\n" + rooms.map(formatRoomSummary).join("\n\n");
            }
            case "booking_status": {
                const id = entities.booking_id;
                if (!id) return "I would be happy to check that for you. Could you please provide your reservation confirmation code?";
                const booking = await checkBooking(id);
                if (!booking) return `I couldn't find a reservation under the code ${id}. Please verify the code or I can connect you with our front desk.`;
                return formatBookingSummary(booking);
            }
            case "restaurant_menu": {
                const query = entities.food_query ?? userMessage;
                const items = await searchMenu(query);
                if (!items.length) return "Our culinary team offers a wide variety of delicacies. While I couldn't find that specific item, I can recommend our Chef's Special for this evening.";
                return "Our current menu highlights:\n\n" + items.map(formatMenuItem).join("\n\n");
            }
            case "amenities": {
                const facilities = await getAmenities();
                return "Our sanctuary features world-class facilities designed for your comfort:\n\n" + 
                    facilities.map((a: any) => `✨ **${a.name}**: ${a.description}`).join("\n");
            }
            default:
                return "";
        }
    } catch (err) {
        console.error("Tool execution error:", err);
        return "I am experiencing a slight delay in accessing our live registry. One moment please.";
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id || "guest";
        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get('sessionId') || "default";

        const history = await getHistory(sessionId, userId);
        
        return NextResponse.json({
            messages: history.length > 0 ? history.flatMap(h => [
                { id: `h1-${Math.random()}`, text: h.message, sender: 'user', timestamp: new Date() },
                { id: `h2-${Math.random()}`, text: h.response, sender: 'support', timestamp: new Date() }
            ]) : [{
                id: 'welcome-1',
                text: 'Welcome back to the Sanctuary. I am your personal concierge, dedicated to making your stay extraordinary. How may I assist you this evening?',
                sender: 'support',
                timestamp: new Date()
            }]
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to load history' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id || "guest";
        
        if (ratelimit) {
            const ip = req.headers.get("x-forwarded-for") ?? userId;
            const { success } = await ratelimit.limit(ip);
            if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
        }

        const { message, messages = [], sessionId: clientSessionId, context } = await req.json();
        const userMessage = message || messages[messages.length - 1]?.content;
        const sessionId = clientSessionId || "default_session";

        if (!userMessage) return NextResponse.json({ error: "Message is required" }, { status: 400 });

        // Parallel processing for intelligence
        const [history, knowledge, intent] = await Promise.all([
            getHistory(sessionId, userId),
            searchKnowledge(userMessage),
            detectIntent(userMessage),
        ]);

        const toolResult = await runTool(intent, userMessage);

        const historyText = history.map(e => `Guest: ${e.message}\nConcierge: ${e.response}`).join("\n");
        const knowledgeText = knowledge.join("\n");
        const contextText = context ? JSON.stringify(context) : "";

        const systemContent = [
            SYSTEM_PROMPT,
            contextText ? `Current Page Context:\n${contextText}` : "",
            historyText ? `Previous interactions:\n${historyText}` : "",
            knowledgeText ? `Concierge Handbook Snippets:\n${knowledgeText}` : "",
            toolResult ? `Real-time System Data (${intent.intent}):\n${toolResult}` : "",
            "Compose a luxury response in the persona of the Sanctuary Concierge. Keep it professional and helpful.",
        ].filter(Boolean).join("\n\n");

        // CFG-004: groq is null when GROQ_API_KEY is absent (no BUILD_PLACEHOLDER fallback).
        if (!groq) {
            const fallbackMessage = "I apologize, but my connection to the Sanctuary central intelligence is currently offline for routine maintenance. Our human concierge team is available at the front desk to assist you immediately.";
            const stream = new ReadableStream({
                async start(controller) {
                    controller.enqueue(new TextEncoder().encode(fallbackMessage));
                    await saveMessage(sessionId, userId, userMessage, fallbackMessage);
                    controller.close();
                }
            });
            return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "X-Session-Id": sessionId } });
        }

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            stream: true,
            messages: [
                { role: "system", content: systemContent },
                ...messages.slice(-6).map((m: any) => ({
                    role: m.sender === 'user' ? 'user' : 'assistant',
                    content: m.text
                })),
                { role: "user", content: userMessage },
            ],
            temperature: 0.6,
            max_completion_tokens: 800,
        });

        const encoder = new TextEncoder();
        let fullContent = "";

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of completion) {
                        const delta = chunk.choices[0]?.delta?.content || "";
                        if (!delta) continue;
                        fullContent += delta;
                        controller.enqueue(encoder.encode(delta));
                    }
                    if (fullContent) {
                        if (redisClient) {
                            redisClient.rpush('chat:history:queue', JSON.stringify({ sessionId, userId, userMessage, response: fullContent }))
                                .catch(err => console.error("Redis rpush error:", err));
                        } else {
                            saveMessage(sessionId, userId, userMessage, fullContent)
                                .catch(err => console.error("saveMessage error:", err));
                        }
                    }
                    controller.close();
                } catch (e) {
                    console.error("Stream error:", e);
                    controller.error(e);
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "X-Session-Id": sessionId,
            },
        });

    } catch (error) {
        console.error("Chat API error:", error);
        return NextResponse.json({ error: "The Sanctuary Concierge is currently attending to another guest." }, { status: 500 });
    }
}
