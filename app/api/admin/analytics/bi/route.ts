import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    // 1. Revenue Aggregation
    const totalBookings = await prisma.booking.count()
    
    // We'll use mock data mixed with real counts for the BI visualization 
    // to simulate a massive data warehouse.
    
    const revenueData = {
        totalRoomsRevenue: 1245000,
        totalPOSRevenue: 342000,
        totalEventsRevenue: 850000,
        yoyGrowth: 14.2
    }

    // 2. Operational Efficiency
    const cmmsTickets = await prisma.maintenanceRequest.count()
    const activeStaff = await prisma.employee.count({ where: { status: 'ACTIVE' } })
    
    const opsData = {
        activeEmployees: activeStaff,
        openMaintenanceTickets: cmmsTickets,
        avgHousekeepingTurnaroundMins: 24,
        laborCostYTD: 420000
    }

    // 3. Loyalty & CRM
    const loyaltyMembers = await prisma.loyaltyPoint.count()
    const platinumMembers = await prisma.loyaltyPoint.count({ where: { tier: 'PLATINUM' } })
    
    const loyaltyData = {
        totalMembers: loyaltyMembers,
        platinumCount: platinumMembers,
        pointsLiabilityValue: 45000,
        guestSatisfactionScore: 94.5
    }

    // 4. Trend Data for Charts (Simulated trailing 6 months)
    const trends = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        revenue: [320, 310, 380, 420, 480, 520], // in thousands
        occupancy: [65, 68, 72, 85, 92, 95] // percentages
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
