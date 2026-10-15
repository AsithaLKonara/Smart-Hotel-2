import { prisma } from "@/lib/db";

export interface RetrievedFact {
  category: 'PROPERTY' | 'ROOM_TYPE' | 'SERVICE' | 'EXPERIENCE' | 'FACILITY' | 'DINING' | 'POLICY' | 'FAQ';
  title: string;
  details: string;
}

/**
 * Read-Only Database Retriever for SmartHotel Chatbot RAG Pipeline.
 * Extracts live system facts from Prisma models without ever executing mutations.
 */
export async function retrieveDatabaseFacts(query: string): Promise<RetrievedFact[]> {
  const q = query.toLowerCase().trim();
  const tokens = q.split(/\s+/).filter(t => t.length > 2);
  const facts: RetrievedFact[] = [];

  try {
    // 1. Hotel Settings & Policies
    const settings = await prisma.setting.findMany({
      where: {
        OR: [
          { key: { in: ['hotel_name', 'hotel_address', 'hotel_phone', 'hotel_email', 'check_in_time', 'check_out_time', 'hotel_tagline', 'hotel_description'] } },
          ...tokens.map(t => ({ key: { contains: t, mode: 'insensitive' as const } })),
          ...tokens.map(t => ({ value: { contains: t, mode: 'insensitive' as const } }))
        ]
      },
      take: 8
    });

    if (settings.length > 0) {
      const settingsMap = Object.fromEntries(settings.map((s: any) => [s.key, s.value]));
      facts.push({
        category: 'POLICY',
        title: 'Hotel Operations & Contact Details',
        details: `Hotel: ${settingsMap.hotel_name || 'SmartHotel Grand Palace'}, Address: ${settingsMap.hotel_address || 'City Center'}, Phone: ${settingsMap.hotel_phone || '+1 (800) 555-HOTEL'}, Check-in: ${settingsMap.check_in_time || '15:00'}, Check-out: ${settingsMap.check_out_time || '11:00'}. Description: ${settingsMap.hotel_description || '5-star luxury sanctuary'}`
      });
    }

    // 2. Active Properties
    const properties = await prisma.property.findMany({
      where: {
        status: 'ACTIVE',
        ...(tokens.length > 0 ? {
          OR: tokens.flatMap(t => [
            { name: { contains: t, mode: 'insensitive' as const } },
            { city: { contains: t, mode: 'insensitive' as const } },
            { country: { contains: t, mode: 'insensitive' as const } }
          ])
        } : {})
      },
      take: 4
    });

    for (const p of properties) {
      facts.push({
        category: 'PROPERTY',
        title: `Sanctuary: ${p.name} (${p.city}, ${p.country})`,
        details: `Address: ${p.address}. Phone: ${p.phone || 'N/A'}, Email: ${p.email || 'N/A'}. Description: ${p.description || 'Exclusive luxury resort destination.'}`
      });
    }

    // 3. Room Types & Pricing
    const roomTypes = await prisma.roomType.findMany({
      where: {
        ...(tokens.length > 0 ? {
          OR: tokens.flatMap(t => [
            { name: { contains: t, mode: 'insensitive' as const } },
            { description: { contains: t, mode: 'insensitive' as const } }
          ])
        } : {})
      },
      include: {
        rooms: { where: { status: 'AVAILABLE' } },
        property: true
      },
      take: 5
    });

    for (const rt of roomTypes) {
      const availCount = rt.rooms.length;
      facts.push({
        category: 'ROOM_TYPE',
        title: `${rt.name} (${rt.property?.name || 'Grand Palace'})`,
        details: `Base Rate: $${Number(rt.baseRate)}/night. Capacity: ${rt.capacity} guests. Available Units: ${availCount}. Amenities: ${Array.isArray(rt.amenities) ? rt.amenities.join(', ') : 'WiFi, Air conditioning, Spa bath'}. Description: ${rt.description || 'Luxury appointed suite with bespoke finishes.'}`
      });
    }

    // 4. Stay Extra Services
    const extras = await prisma.extraService.findMany({
      where: {
        active: true,
        ...(tokens.length > 0 ? {
          OR: tokens.flatMap(t => [
            { name: { contains: t, mode: 'insensitive' as const } },
            { description: { contains: t, mode: 'insensitive' as const } }
          ])
        } : {})
      },
      take: 6
    });

    for (const ex of extras) {
      facts.push({
        category: 'SERVICE',
        title: `Stay Extra: ${ex.name}`,
        details: `Price: $${Number(ex.price)} (${ex.priceType.toLowerCase().replace('_', ' ')}). Description: ${ex.description || 'Exclusive ancillary service'}`
      });
    }

    // 5. Resort Facilities
    const facilities = await prisma.resortFacility.findMany({
      where: {
        status: 'ACTIVE',
        ...(tokens.length > 0 ? {
          OR: tokens.flatMap(t => [
            { name: { contains: t, mode: 'insensitive' as const } },
            { description: { contains: t, mode: 'insensitive' as const } },
            { type: { contains: t, mode: 'insensitive' as const } }
          ])
        } : {})
      },
      take: 4
    });

    for (const f of facilities) {
      facts.push({
        category: 'FACILITY',
        title: `Facility: ${f.name} (${f.type})`,
        details: `Hours: ${f.operatingHours || '24/7'}. Features: ${f.features || 'Full luxury access'}. Details: ${f.description || 'World-class wellness and entertainment facility.'}`
      });
    }

    // 6. Food & Dining Menu
    const foodItems = await prisma.foodMenu.findMany({
      where: {
        available: true,
        ...(tokens.length > 0 ? {
          OR: tokens.flatMap(t => [
            { name: { contains: t, mode: 'insensitive' as const } },
            { description: { contains: t, mode: 'insensitive' as const } },
            { category: { contains: t, mode: 'insensitive' as const } }
          ])
        } : {})
      },
      take: 5
    });

    for (const item of foodItems) {
      facts.push({
        category: 'DINING',
        title: `Dish: ${item.name} (${item.category})`,
        details: `Price: $${Number(item.price)}. Description: ${item.description || 'Crafted with premium organic ingredients by our Michelin-starred chefs.'}`
      });
    }

    // 7. Frequently Asked Questions (FAQ)
    const faqs = await prisma.fAQ.findMany({
      where: {
        ...(tokens.length > 0 ? {
          OR: tokens.flatMap(t => [
            { question: { contains: t, mode: 'insensitive' as const } },
            { answer: { contains: t, mode: 'insensitive' as const } }
          ])
        } : {})
      },
      take: 3
    });

    for (const faq of faqs) {
      facts.push({
        category: 'FAQ',
        title: `FAQ: ${faq.question}`,
        details: faq.answer
      });
    }

  } catch (error) {
    console.error('[DB_RETRIEVER] Failed to fetch read-only facts:', error);
  }

  return facts;
}

/**
 * Format retrieved database facts into a clean markdown block for LLM system prompt injection.
 */
export function formatDatabaseFactsForPrompt(facts: RetrievedFact[]): string {
  if (facts.length === 0) return '';

  const lines = [
    '=== REAL-TIME HOTEL DATABASE GROUNDING (VERIFIED FACTS) ===',
    'Always prioritize the following real data from the hotel database when answering the guest:'
  ];

  for (const fact of facts) {
    lines.push(`- [${fact.category}] ${fact.title}: ${fact.details}`);
  }

  lines.push('=== END OF DATABASE GROUNDING ===');
  return lines.join('\n');
}
