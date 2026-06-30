import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
  try {
    const channels = await prisma.channelConfig.findMany()
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

    return NextResponse.json({ channels, mappings: enrichedMappings })
  } catch (error: any) {
    console.error('Fetch Channel Config Error:', error)
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 })
  }
}
