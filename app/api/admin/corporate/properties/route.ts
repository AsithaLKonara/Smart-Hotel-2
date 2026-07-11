import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { handleZodError } from '@/lib/api-utils';

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

export async function GET() {
  try {
    const properties = await prisma.property.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(properties)
  } catch (error) {
    console.error('Failed to fetch properties:', error)
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json()
    const result = propertySchema.safeParse(json)
    
    if (!result.success) {
      return handleZodError(result.error);
    }
    
    const data = result.data
    const property = await prisma.property.create({
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
    return NextResponse.json(property, { status: 201 })
  } catch (error) {
    console.error('Failed to create property:', error)
    return NextResponse.json({ error: 'Failed to create property' }, { status: 500 })
  }
}
