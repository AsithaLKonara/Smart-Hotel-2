import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const employeeSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional().nullable(),
  department: z.string().min(1, 'Department is required'),
  position: z.string().min(1, 'Position is required'),
  baseSalary: z.preprocess((val) => parseFloat(String(val)), z.number().min(0)),
  hireDate: z.preprocess((val) => new Date(String(val)), z.date()),
})

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const compact = searchParams.get('compact') === 'true';

    if (compact) {
      const employees = await prisma.employee.findMany({
        select: { id: true, firstName: true, lastName: true, department: true, baseSalary: true },
        orderBy: { firstName: 'asc' },
      });
      return NextResponse.json(employees);
    }

    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const skip = (page - 1) * limit;

    const employees = await prisma.employee.findMany({
      orderBy: { firstName: 'asc' },
      take: limit,
      skip,
    });
    return NextResponse.json(employees);
  } catch (error) {
    console.error('Failed to fetch employees:', error)
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json()
    const result = employeeSchema.safeParse(json)
    
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input', details: result.error.errors }, { status: 400 })
    }
    
    const data = result.data
    const employee = await prisma.employee.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || null,
        department: data.department,
        position: data.position,
        baseSalary: data.baseSalary,
        hireDate: data.hireDate,
      },
    })
    return NextResponse.json(employee, { status: 201 })
  } catch (error) {
    console.error('Failed to create employee:', error)
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 })
  }
}
