import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { parse } from 'csv-parse/sync'
import { getRequestSession } from '@/lib/session'

const prisma = new PrismaClient()

// Validation schema for a single row in the CSV
const RoomingListRowSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  checkIn: z.string().refine(val => !isNaN(Date.parse(val)), 'Invalid check-in date'),
  checkOut: z.string().refine(val => !isNaN(Date.parse(val)), 'Invalid check-out date'),
  roomType: z.string().min(1, 'Room type code is required'),
  specialRequests: z.string().optional()
})

export async function POST(req: NextRequest) {
  try {
    const session = await getRequestSession(req)
    if (!session || !['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const groupBlockId = formData.get('groupBlockId') as string | null

    if (!file || !groupBlockId) {
      return NextResponse.json(
        { error: 'File and groupBlockId are required' },
        { status: 400 }
      )
    }

    // 1. Verify Group Block exists
    const groupBlock = await prisma.groupBlock.findUnique({
      where: { id: groupBlockId },
      include: {
        roomType: true,
        bookings: true
      }
    })

    if (!groupBlock) {
      return NextResponse.json({ error: 'Group block not found' }, { status: 404 })
    }

    // 2. Parse CSV
    const fileBuffer = await file.arrayBuffer()
    const fileContent = Buffer.from(fileBuffer).toString('utf-8')

    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    })

    if (records.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 })
    }

    // 3. Validate rows
    const validRows: z.infer<typeof RoomingListRowSchema>[] = []
    const errors = []

    for (let i = 0; i < records.length; i++) {
      const row = records[i]
      const validation = RoomingListRowSchema.safeParse(row)
      if (validation.success) {
        validRows.push(validation.data)
      } else {
        errors.push({ row: i + 2, issues: validation.error.errors }) // +2 because index 0 is line 2 (header is line 1)
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({
        error: 'CSV Validation failed',
        details: errors
      }, { status: 400 })
    }

    // 4. Ensure we don't exceed the block capacity
    if (groupBlock.bookings.length + validRows.length > groupBlock.blockedCount) {
      return NextResponse.json({
        error: `Cannot add ${validRows.length} bookings. Group block only has ${groupBlock.blockedCount - groupBlock.bookings.length} remaining slots.`
      }, { status: 400 })
    }

    // 5. Create Bookings and Guests inside a Transaction
    let createdCount = 0
    await prisma.$transaction(async (tx) => {
      for (const row of validRows) {
        // Find or create primary guest (mocking simplified logic here)
        // In real app, we would search by email or name+phone robustly
        let guest = null
        if (row.email) {
          guest = await tx.user.findUnique({ where: { email: row.email } })
        }
        
        if (!guest) {
          guest = await tx.user.create({
            data: {
              name: `${row.firstName} ${row.lastName}`,
              email: row.email || `${row.firstName.toLowerCase()}.${row.lastName.toLowerCase()}.${Math.random().toString(36).substring(7)}@guest.smarthotel.local`,
              phone: row.phone,
              password: 'CHANGE_ME_123',
              roleId: 'GUEST_ROLE_MOCK' // In real app, look up the GUEST role ID
            }
          })
        }

        await tx.booking.create({
          data: {
            checkIn: new Date(row.checkIn),
            checkOut: new Date(row.checkOut),
            status: 'CONFIRMED',
            source: 'WALK_IN',
            primaryGuestId: guest.id,
            groupBlockId: groupBlock.id,
            totalAmount: groupBlock.contractedRate,
            paymentStatus: 'pending',
            confirmationCode: `GRP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
          }
        })
        createdCount++
      }
    })

    return NextResponse.json({
      success: true,
      message: `Successfully processed rooming list and created ${createdCount} bookings.`,
      importedCount: createdCount
    })

  } catch (error) {
    console.error('Group rooming list import error:', error)
    return NextResponse.json({ error: 'Internal server error processing rooming list' }, { status: 500 })
  }
}
