import Groq from "groq-sdk";

/**
 * Groq AI Client
 *
 * CFG-004: No fallback. If GROQ_API_KEY is absent, the Groq SDK is NOT
 * instantiated. Callers (e.g. app/api/chat/messages/route.ts) already
 * guard against missing keys and return a graceful static response.
 * Do NOT re-introduce a 'BUILD_PLACEHOLDER' or any hardcoded default.
 */

if (!process.env.GROQ_API_KEY) {
  console.warn("[GROQ] GROQ_API_KEY is not set. AI chat features will be unavailable.");
}

export const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;
