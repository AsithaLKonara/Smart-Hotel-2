import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())

    // 1. Revenue Aggregation
    const bookingsSum = await prisma.booking.aggregate({
        _sum: { totalAmount: true },
        where: { status: { notIn: ['CANCELLED', 'NO_SHOW'] } }
    })
    const lastMonthBookingsSum = await prisma.booking.aggregate({
        _sum: { totalAmount: true },
        where: { status: { notIn: ['CANCELLED', 'NO_SHOW'] }, createdAt: { lte: lastMonth } }
    })

    const internalOrdersSum = await prisma.internalOrder.aggregate({
        _sum: { totalAmount: true },
        where: { status: 'COMPLETED' }
    })

    const posSum = await prisma.internalOrder.aggregate({
        _sum: { totalAmount: true },
        where: { status: 'COMPLETED' }
    })

    const totalRooms = await prisma.room.count()
    const occupiedRooms = await prisma.room.count({ where: { status: 'OCCUPIED' } })
    const currentOccupancy = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0

    const totalBookings = await prisma.booking.count({ where: { status: { notIn: ['CANCELLED', 'NO_SHOW'] } } })
    const adr = totalBookings > 0 ? (bookingsSum._sum.totalAmount || 0) / totalBookings : 0
    const revpar = adr * (currentOccupancy / 100)

    const currentRevenue = (bookingsSum._sum.totalAmount || 0) + (internalOrdersSum._sum.totalAmount || 0) + (posSum._sum.totalAmount || 0)
    const prevRevenue = (lastMonthBookingsSum._sum.totalAmount || 0)
    const yoyGrowth = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0

    const revenueData = {
        totalRoomsRevenue: bookingsSum._sum.totalAmount || 0,
        totalPOSRevenue: (internalOrdersSum._sum.totalAmount || 0) + (posSum._sum.totalAmount || 0),
        totalEventsRevenue: 0,
        yoyGrowth: Number(yoyGrowth.toFixed(2)),
        adr: Number(adr.toFixed(2)),
        revpar: Number(revpar.toFixed(2)),
        occupancy: Number(currentOccupancy.toFixed(1)),
        departmentPerformance: {
            rooms: bookingsSum._sum.totalAmount || 0,
            pos: posSum._sum.totalAmount || 0,
            food: internalOrdersSum._sum.totalAmount || 0
        }
    }

    // 2. Operational Efficiency
    const cmmsTickets = await prisma.task.count({ where: { type: 'MAINTENANCE', status: { not: 'COMPLETED' } } })
    const activeStaff = await prisma.employee.count({ where: { status: 'ACTIVE' } })
    
    const hkStats = await prisma.task.aggregate({
        _avg: { elapsedMinutes: true },
        where: { type: 'HOUSEKEEPING', status: 'COMPLETED' }
    });
    
    const laborCosts = await prisma.journalEntry.aggregate({
        _sum: { debit: true },
        where: { description: { contains: 'Payroll', mode: 'insensitive' } }
    });

    const opsData = {
        activeEmployees: activeStaff,
        openMaintenanceTickets: cmmsTickets,
        avgHousekeepingTurnaroundMins: hkStats._avg.elapsedMinutes || 0,
        laborCostYTD: laborCosts._sum.debit || 0
    }

    // 3. Loyalty & CRM
    const loyaltyMembers = await prisma.loyaltyPoint.count()
    const platinumMembers = await prisma.loyaltyPoint.count({ where: { tier: 'PLATINUM' } })
    
    const loyaltyData = {
        totalMembers: loyaltyMembers,
        platinumCount: platinumMembers,
        pointsLiabilityValue: loyaltyMembers * 15,
        guestSatisfactionScore: 0
    }

    const reviews = await prisma.feedback.aggregate({
      _avg: { rating: true }
    });
    if (reviews._avg.rating) {
      loyaltyData.guestSatisfactionScore = Number(((reviews._avg.rating / 5) * 100).toFixed(1));
    }

    // 4. Trend Data for Charts
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const labels = [];
    const revenueTrends = [];
    const occupancyTrends = [];

    for (let i = 5; i >= 0; i--) {
      let m = currentMonth - i;
      if (m < 0) m += 12;
      labels.push(months[m]);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const rev = await prisma.booking.aggregate({
        _sum: { totalAmount: true },
        where: {
          createdAt: { gte: startOfMonth, lte: endOfMonth },
          status: { notIn: ['CANCELLED', 'NO_SHOW'] }
        }
      });
      revenueTrends.push((rev._sum.totalAmount || 0) / 1000);

      const monthlyBookings = await prisma.booking.count({
        where: {
          createdAt: { gte: startOfMonth, lte: endOfMonth },
          status: { notIn: ['CANCELLED', 'NO_SHOW'] }
        }
      });
      const daysInMonth = endOfMonth.getDate();
      let occ = 0;
      if (totalRooms > 0) {
        occ = (monthlyBookings * 2) / (totalRooms * daysInMonth) * 100;
      }
      occupancyTrends.push(Number(Math.min(occ, 100).toFixed(1)));
    }

    const trends = {
        labels: labels,
        revenue: revenueTrends,
        occupancy: occupancyTrends
    }

    return NextResponse.json({
        revenue: revenueData,
        operations: opsData,
        loyalty: loyaltyData,
        trends: trends,
        lastSync: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to aggregate BI data:', error)
    return NextResponse.json({ error: 'Failed to aggregate BI data' }, { status: 500 })
  }
}
