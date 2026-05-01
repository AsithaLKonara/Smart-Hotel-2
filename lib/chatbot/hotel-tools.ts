import { prisma } from "@/lib/db";

// ─── Room & Reservation Tools ──────────────────────────────────────────────────

export async function searchRooms(type?: string) {
    try {
        const rooms = await prisma.room.findMany({
            where: {
                status: "available",
                ...(type ? { type: { contains: type, mode: 'insensitive' as any } } : {}),
            },
            take: 3,
        });
        return rooms;
    } catch (error) {
        console.error("searchRooms error:", error);
        return [];
    }
}

export async function checkBooking(confirmationCode: string) {
    try {
        const booking = await prisma.booking.findUnique({
            where: { confirmationCode },
            include: { 
                // room: true // In MongoDB, relations must be handled carefully if not defined
            },
        });
        
        // Manual lookup if relation isn't explicit in schema
        if (booking && booking.roomId) {
            const room = await prisma.room.findUnique({ where: { id: booking.roomId } });
            return { ...booking, room };
        }
        
        return booking;
    } catch (error) {
        console.error("checkBooking error:", error);
        return null;
    }
}

// ─── Dining & Menu Tools ───────────────────────────────────────────────────────

export async function searchMenu(query: string) {
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
