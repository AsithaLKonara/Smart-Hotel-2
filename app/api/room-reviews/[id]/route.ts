import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getRequestSession } from '@/lib/session'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRequestSession(request)
  
  if (!session || !['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'].includes((session.user as any).roleName as string)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()

    const review = await prisma.roomReview.update({
      where: { id },
      data: body,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(review)
  } catch (error: any) {
    console.error('Error updating review:', error)
    return NextResponse.json(
      { error: 'Failed to update review', message: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRequestSession(request)
  
  if (!session || !['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'].includes((session.user as any).roleName as string)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params

    await prisma.roomReview.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Review deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting review:', error)
    return NextResponse.json(
      { error: 'Failed to delete review', message: error.message },
      { status: 500 }
    )
  }
}

