import { groq } from "./groq";

export type Intent =
    | "room_search"
    | "booking_status"
    | "restaurant_menu"
    | "amenities"
    | "support"
    | "general";

export interface IntentResult {
    intent: Intent;
    entities: {
        room_type?: string;
        dates?: string;
        booking_id?: string;
        food_query?: string;
        guest_name?: string;
        room_number?: string;
    };
    confidence: "high" | "medium" | "low";
}

const INTENT_SYSTEM_PROMPT = `You are an intent classifier for a luxury hotel concierge (Sanctuary Concierge).
Analyze the user message and return ONLY a valid JSON object with this exact shape:
{
  "intent": "<one of: room_search|booking_status|restaurant_menu|amenities|support|general>",
  "entities": {
    "room_type": "<suite/room type mentioned or null>",
    "dates": "<dates or duration mentioned or null>",
    "booking_id": "<reservation/booking code if mentioned or null>",
    "food_query": "<dish or drink query or null>",
    "guest_name": "<guest name if mentioned or null>",
    "room_number": "<room number if mentioned or null>"
  },
  "confidence": "<high|medium|low>"
}
Return ONLY the JSON. No explanation. No markdown.`;

export async function detectIntent(message: string): Promise<IntentResult> {
    // CFG-004: groq is null when GROQ_API_KEY is absent — fall back to generic intent.
    if (!groq) {
        return { intent: "general", entities: {}, confidence: "low" };
    }
    try {
        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            stream: false,
            temperature: 0.1,
            max_completion_tokens: 300,
            messages: [
                { role: "system", content: INTENT_SYSTEM_PROMPT },
                { role: "user", content: message },
            ],
        });

        const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";

        // Strip markdown code fences if present
        const clean = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
        const parsed = JSON.parse(clean) as IntentResult;
        return parsed;
    } catch {
        return {
            intent: "general",
            entities: {},
            confidence: "low",
        };
    }
}
