import { prisma } from "@/lib/db";

// Retrieve a cached embedding from the EmbeddingCache collection
export async function getCachedEmbedding(text: string): Promise<number[] | null> {
    try {
        const data = await prisma.embeddingCache.findUnique({
            where: { text },
        });
        return data ? (data.embedding as number[]) : null;
    } catch (error) {
        console.error("Embedding cache retrieval error:", error);
        return null;
    }
}

// Store an embedding in the cache
export async function setCachedEmbedding(text: string, embedding: number[]): Promise<void> {
    try {
        await prisma.embeddingCache.upsert({
            where: { text },
            update: { embedding },
            create: { text, embedding },
        });
    } catch (error) {
        console.error("Embedding cache storage error:", error);
    }
}
