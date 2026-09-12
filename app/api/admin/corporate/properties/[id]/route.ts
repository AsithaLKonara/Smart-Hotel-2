import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { handleZodError } from '@/lib/api-utils'

const propertySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  timezone: z.string().default('UTC'),
  totalRooms: z.preprocess((val) => parseInt(String(val), 10), z.number().int().min(0).default(0)),
  status: z.string().default('ACTIVE'),
})

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const json = await req.json()
    const result = propertySchema.safeParse(json)
    
    if (!result.success) {
      return handleZodError(result.error)
    }
    
    const data = result.data
    const property = await prisma.property.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        address: data.address,
        city: data.city,
        country: data.country,
        timezone: data.timezone,
        totalRooms: data.totalRooms,
        status: data.status,
      },
    })
    
    return NextResponse.json(property, { status: 200 })
  } catch (error) {
    console.error('Failed to update property:', error)
    return NextResponse.json({ error: 'Failed to update property' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    // Attempt to hard delete
    await prisma.property.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('Failed to delete property:', error)
    
    // Check if this is a Prisma Foreign Key Constraint error (P2003)
    if (error?.code === 'P2003') {
      return NextResponse.json(
        { error: 'Cannot delete a property that has associated users, rooms, or bookings. Please edit and mark it as INACTIVE instead.' },
        { status: 400 }
      )
    }
    
    return NextResponse.json({ error: 'Failed to delete property' }, { status: 500 })
  }
}
