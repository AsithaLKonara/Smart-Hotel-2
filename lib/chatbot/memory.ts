import { prisma } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db-helpers";

// ─── Conversation Memory ────────────────────────────────────────────────────────

export async function saveMessage(
    sessionId: string,
    userId: string,
    message: string,
    response: string
): Promise<void> {
    if (!isDatabaseConfigured()) return;
    
    await prisma.conversation.create({
        data: {
            sessionId,
            userId,
            message,
            response,
        },
    });
}

export async function getHistory(
    sessionId: string,
    userId: string
): Promise<{ message: string; response: string }[]> {
    if (!isDatabaseConfigured()) return [];

    const data = await prisma.conversation.findMany({
        where: {
            sessionId,
            userId,
        },
        select: {
            message: true,
            response: true,
        },
        orderBy: {
            timestamp: "desc",
        },
        take: 8,
    });

    return data.reverse();
}

// ─── Customer Profile (Smart Memory) ───────────────────────────────────────────

export interface CustomerProfile {
    phone: string;
    name?: string;
    lastOrderId?: string;
    preferences?: any;
    createdAt?: Date;
}

// Retrieve a customer profile by WhatsApp phone number or internal identifier
export async function getCustomerProfile(phone: string): Promise<CustomerProfile | null> {
    if (!isDatabaseConfigured()) return null;

    const data = await prisma.chatCustomer.findUnique({
        where: { phone },
    });

    if (!data) return null;
    return {
        phone: data.phone,
        name: data.name || undefined,
        lastOrderId: data.lastOrderId || undefined,
        preferences: data.preferences,
        createdAt: data.createdAt,
    };
}

// Create or update a customer record
export async function upsertCustomerProfile(
    phone: string,
    updates: Partial<Omit<CustomerProfile, "phone" | "createdAt">>
): Promise<void> {
    if (!isDatabaseConfigured()) return;

    await prisma.chatCustomer.upsert({
        where: { phone },
        update: updates,
        create: { phone, ...updates },
    });
}

// Build a personalized greeting from profile data
export function buildCustomerContext(profile: CustomerProfile | null): string {
    if (!profile) return "";

    const parts: string[] = [];
    if (profile.name) parts.push(`Customer name: ${profile.name}`);
    if (profile.lastOrderId) parts.push(`Last order ID: #${profile.lastOrderId}`);
    if (profile.preferences && Object.keys(profile.preferences).length > 0) {
        parts.push(`Known preferences: ${JSON.stringify(profile.preferences)}`);
    }
    return parts.length > 0 ? `\nCustomer profile:\n${parts.join("\n")}` : "";
}
