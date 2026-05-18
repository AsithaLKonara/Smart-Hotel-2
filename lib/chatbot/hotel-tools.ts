import { prisma } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db-helpers";
import { MOCK_ROOMS } from "@/lib/mock-rooms";

// ─── Room & Reservation Tools ──────────────────────────────────────────────────

export async function searchRooms(type?: string) {
    if (!isDatabaseConfigured()) {
        const filtered = MOCK_ROOMS.filter(r => 
            !type || r.type.toLowerCase().includes(type.toLowerCase())
        ).slice(0, 3);
        return filtered;
    }

    try {
        const rooms = await prisma.room.findMany({
            where: {
                status: "AVAILABLE",
                ...(type ? { 
                    roomType: { 
                        name: { contains: type, mode: 'insensitive' as any } 
                    } 
                } : {}),
            },
            include: { roomType: true },
            take: 3,
        });
        return rooms;
    } catch (error) {
        console.error("searchRooms error:", error);
        return [];
    }
}

export async function checkBooking(confirmationCode: string) {
    if (!isDatabaseConfigured()) return null;

    try {
        const booking = await prisma.booking.findUnique({
            where: { confirmationCode },
            include: { 
                room: { include: { roomType: true } }
            },
        });
        
        return booking;
    } catch (error) {
        console.error("checkBooking error:", error);
        return null;
    }
}

// ─── Dining & Menu Tools ───────────────────────────────────────────────────────

export async function searchMenu(query: string) {
    if (!isDatabaseConfigured()) return [];

    try {
        const items = await prisma.foodMenu.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' as any } },
                    { description: { contains: query, mode: 'insensitive' as any } },
                    { category: { contains: query, mode: 'insensitive' as any } }
                ],
                available: true,
            },
            take: 5,
        });
        return items;
    } catch (error) {
        console.error("searchMenu error:", error);
        return [];
    }
}

// ─── Amenities & Facilities ────────────────────────────────────────────────────

export async function getAmenities() {
    if (!isDatabaseConfigured()) return [];

    try {
        const amenities = await prisma.amenity.findMany({
            where: { active: true },
            orderBy: { displayOrder: 'asc' },
        });
        return amenities;
    } catch (error) {
        console.error("getAmenities error:", error);
        return [];
    }
}

// ─── Formatters ───────────────────────────────────────────────────────────────

export function formatRoomSummary(room: any): string {
    return `🏨 **${room.type} (Room ${room.number})**
- Price: $${room.price}/night
- Capacity: ${room.capacity} Guests
- Amenities: ${room.amenities.join(", ")}
- [View Details](/rooms/${room.id})`;
}

export function formatBookingSummary(booking: any): string {
    return `✅ **Reservation Found**
- Confirmation: \`${booking.confirmationCode}\`
- Room: ${booking.room?.type || 'Standard Suite'}
- Check-in: ${new Date(booking.checkIn).toLocaleDateString()}
- Status: ${booking.status.toUpperCase()}
- Total: $${booking.totalAmount}`;
}

export function formatMenuItem(item: any): string {
    return `🍽️ **${item.name}** — $${item.price}
${item.description}
(Prep time: ${item.preparationTime} mins)`;
}
