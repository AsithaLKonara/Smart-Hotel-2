import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { handleZodError } from '@/lib/api-utils'

const leaveRequestSchema = z.object({
  employeeId: z.string().min(1),
  type: z.enum(['ANNUAL', 'SICK', 'UNPAID', 'MATERNITY', 'PATERNITY', 'OTHER']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reason: z.string().optional(),
}).refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
  message: "endDate cannot be before startDate",
  path: ["endDate"],
});

export async function GET() {
  try {
    const leaves = await prisma.leaveRequest.findMany({
      include: {
        employee: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(leaves)
  } catch (error) {
    console.error('Failed to fetch leaves:', error)
    return NextResponse.json({ error: 'Failed to fetch leaves' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validated = leaveRequestSchema.parse(body)

    const leave = await prisma.leaveRequest.create({
      data: {
        employeeId: validated.employeeId,
        type: validated.type,
        startDate: new Date(validated.startDate),
        endDate: new Date(validated.endDate),
        reason: validated.reason,
      },
      include: {
        employee: true
      }
    })
    return NextResponse.json(leave, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return handleZodError(error)
    }
    console.error('Failed to create leave:', error)
    return NextResponse.json({ error: 'Failed to create leave' }, { status: 500 })
  }
}
