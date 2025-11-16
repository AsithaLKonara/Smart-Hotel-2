import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getRequestSession } from '@/lib/session'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRequestSession(request)
  
  if (!session || !['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()

    // If setting as main, unset other main images for this room
    if (body.isMain === true) {
      const currentImage = await prisma.roomImage.findUnique({
        where: { id },
        select: { roomId: true },
      })

      if (currentImage) {
        await prisma.roomImage.updateMany({
          where: {
            roomId: currentImage.roomId,
            isMain: true,
            id: { not: id },
          },
          data: {
            isMain: false,
          },
        })
      }
    }

    const image = await prisma.roomImage.update({
      where: { id },
      data: body,
    })

    return NextResponse.json(image)
  } catch (error: any) {
    console.error('Error updating room image:', error)
    return NextResponse.json(
      { error: 'Failed to update room image', message: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRequestSession(request)
  
  if (!session || !['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params

    await prisma.roomImage.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Room image deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting room image:', error)
    return NextResponse.json(
      { error: 'Failed to delete room image', message: error.message },
      { status: 500 }
    )
  }
}

