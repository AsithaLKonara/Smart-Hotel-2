import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { isDatabaseConfigured } from '@/lib/db-helpers'
import { z } from 'zod'

const settingSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  value: z.string(),
})

const settingsUpdateSchema = z.record(z.string(), z.string())

// GET all settings or specific settings by keys
export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const keys = searchParams.get('keys')?.split(',') || []

    let where: any = {}
    if (keys.length > 0) {
      where.key = { in: keys }
    }

    const settings = await prisma.setting.findMany({
      where,
      orderBy: { key: 'asc' }
    })

    // Convert to object format for easier consumption
    const settingsObject = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, string>)

    return NextResponse.json({
      settings: settingsObject,
      count: settings.length
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// POST - Create or update a single setting
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || !['SUPER_ADMIN', 'MANAGER'].includes(session.user.role)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const validatedData = settingSchema.parse(body)

    // Check if setting exists
    const existing = await prisma.setting.findFirst({
      where: { key: validatedData.key }
    })

    if (existing) {
      // Update existing
      const updated = await prisma.setting.update({
        where: { id: existing.id },
        data: { value: validatedData.value }
      })
      return NextResponse.json({ setting: updated }, { status: 200 })
    } else {
      // Create new
      const created = await prisma.setting.create({
        data: {
          key: validatedData.key,
          value: validatedData.value
        }
      })
      return NextResponse.json({ setting: created }, { status: 201 })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error saving setting:', error)
    return NextResponse.json(
      { error: 'Failed to save setting' },
      { status: 500 }
    )
  }
}

// PUT - Bulk update settings
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || !['SUPER_ADMIN', 'MANAGER'].includes(session.user.role)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const validatedData = settingsUpdateSchema.parse(body)

    // Update all settings in the object
    const updates = Object.entries(validatedData).map(async ([key, value]) => {
      const existing = await prisma.setting.findFirst({
        where: { key }
      })

      if (existing) {
        return prisma.setting.update({
          where: { id: existing.id },
          data: { value: String(value) }
        })
      } else {
        return prisma.setting.create({
          data: { key, value: String(value) }
        })
      }
    })

    const results = await Promise.all(updates)

    return NextResponse.json({
      message: 'Settings updated successfully',
      count: results.length
    }, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}

