import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

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

    const employees = await prisma.employee.findMany({
      include: {
        user: true,
      },
      orderBy: { firstName: 'asc' },
    });
    return NextResponse.json(employees);
  } catch (error) {
    console.error('Failed to fetch employees:', error)
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const employee = await prisma.employee.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        department: data.department,
        position: data.position,
        baseSalary: parseFloat(data.baseSalary),
        hireDate: new Date(data.hireDate),
      },
    })
    return NextResponse.json(employee, { status: 201 })
  } catch (error) {
    console.error('Failed to create employee:', error)
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 })
  }
}
