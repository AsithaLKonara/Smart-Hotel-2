import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireRoles } from '@/lib/auth-utils'

export async function GET() {
  try {
    const { errorResponse, session } = await requireRoles(['SUPER_ADMIN', 'MANAGER']);
    if (errorResponse) return errorResponse;

    const channels = await prisma.channelConfig.findMany({
      ...(session.user.roleName !== 'SUPER_ADMIN' ? { where: { propertyId: session.user.propertyId } } : {})
    })
    const mappings = await prisma.roomMapping.findMany()
    
    // Quick and dirty manual join for the dashboard
    // We fetch RoomTypes to display the local name
    const roomTypes = await prisma.roomType.findMany({ select: { id: true, name: true } })
    
    const enrichedMappings = mappings.map((m: any) => {
      const localRoom = roomTypes.find((rt: any) => rt.id === m.localRoomTypeId)
      return {
        ...m,
        localRoomName: localRoom?.name || 'Unknown Room'
      }
    })

    const safeChannels = channels.map((c: any) => ({
      id: c.id,
      provider: c.provider,
      propertyId: c.propertyId,
      isEnabled: c.isEnabled,
      configured: !!c.apiKey
    }))

    return NextResponse.json({ channels: safeChannels, mappings: enrichedMappings })
  } catch (error: any) {
    console.error('Fetch Channel Config Error:', error)
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 })
  }
}
