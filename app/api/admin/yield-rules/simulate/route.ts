import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { roomTypeId, date } = data;

    if (!roomTypeId || !date) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const targetDate = new Date(date);

    // Get the base rate
    const roomType = await prisma.roomType.findUnique({ where: { id: roomTypeId } });
    if (!roomType) {
      return NextResponse.json({ error: 'Room type not found' }, { status: 404 });
    }

    let currentRate = roomType.baseRate;
    const appliedRules = [];

    // Find all active rules that overlap with this date
    const rules = await prisma.yieldRule.findMany({
      where: {
        isActive: true,
        startDate: { lte: targetDate },
        endDate: { gte: targetDate }
      }
    });

    for (const rule of rules) {
      if (rule.adjustmentType === 'PERCENTAGE') {
        const adjustment = currentRate * (rule.adjustmentValue / 100);
        currentRate += adjustment;
      } else if (rule.adjustmentType === 'FIXED') {
        currentRate += rule.adjustmentValue;
      }
      appliedRules.push(rule.name);
    }

    // Ensure rate doesn't drop below 0
    if (currentRate < 0) currentRate = 0;

    return NextResponse.json({ 
      success: true, 
      baseRate: roomType.baseRate,
      finalRate: currentRate,
      appliedRules 
    });
  } catch (error) {
    console.error('Failed to simulate rate:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
