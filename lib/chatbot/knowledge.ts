import { prisma } from "@/lib/db";
import { groq } from "./groq";
import { getCachedEmbedding, setCachedEmbedding } from "./embedding-cache";

// Generate a real embedding vector using Groq's nomic-embed-text model
export async function generateEmbedding(text: string): Promise<number[]> {
    // Check cache first
    const cached = await getCachedEmbedding(text);
    if (cached) return cached;

    // CFG-004: groq is null when GROQ_API_KEY is absent — return zero vector fallback.
    if (!groq) {
        return Array(768).fill(0);
    }

    try {
        const response = await groq.embeddings.create({
            model: "nomic-embed-text-v1_5",
            input: text,
        });

        const embedding = response.data[0].embedding as number[];
        await setCachedEmbedding(text, embedding, "nomic-embed-text-v1_5");
        return embedding;
    } catch (error) {
        console.error("Groq embedding generation error:", error);
        return Array(768).fill(0); // Return empty vector as fallback
    }
}

// Helper for cosine similarity (Manual implementation for MongoDB/Prisma)
function cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    return isNaN(similarity) ? 0 : similarity;
}

// Semantic search (Local similarity matching for small-to-medium datasets)
export async function searchKnowledge(query: string): Promise<string[]> {
    try {
        const queryEmbedding = await generateEmbedding(query);
        const knowledgeEntries = await prisma.knowledge.findMany({
            take: 100 // Reasonable limit for in-memory similarity matching
        });

        const matches = knowledgeEntries
            .map((item: any) => ({
                content: item.content,
                similarity: cosineSimilarity(queryEmbedding, item.embedding as number[]),
            }))
            .filter((match: any) => match.similarity > 0.6) // Higher threshold for quality
            .sort((a: any, b: any) => b.similarity - a.similarity)
            .slice(0, 5);

        return matches.map((m: any) => m.content);
    } catch (err) {
        console.error("searchKnowledge failed:", err);
        return [];
    }
}

// Add a new knowledge entry (for admin ingestion)
export async function addKnowledgeEntry(
    content: string,
    metadata?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
    try {
        const embedding = await generateEmbedding(content);

        await prisma.knowledge.create({
            data: {
                content,
                embedding,
                metadata: metadata ?? {},
            },
        });

        return { success: true };
    } catch (err) {
        return { success: false, error: String(err) };
    }
}
