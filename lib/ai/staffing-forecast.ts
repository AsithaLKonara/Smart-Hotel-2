import { prisma } from '../db';

export interface StaffingForecastResult {
  businessDate: string;
  projectedOccupancy: number;
  housekeepingStaffNeeded: number;
  frontDeskCongestionPeaks: { hour: number; risk: 'low' | 'medium' | 'high'; expectedGuests: number }[];
  kitchenRushWindows: { time: string; factor: number; recommendedStaff: number }[];
}

export class StaffingForecastEngine {
  /**
   * Generates predictive staffing schedules for a specific calendar date
   */
  static async predictStaffingNeeds(targetDateStr: string): Promise<StaffingForecastResult> {
    const targetDate = new Date(targetDateStr);
    
    // 1. Resolve room inventory & active bookings to calculate projected occupancy ratio
    const totalRooms = await prisma.room.count();
    const activeBookings = await prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'CHECKED_IN'] },
        checkIn: { lte: targetDate },
        checkOut: { gte: targetDate },
      }
    });

    const activeBookingsCount = activeBookings.length;
    const projectedOccupancy = totalRooms > 0 ? (activeBookingsCount / totalRooms) * 100 : 0;

    // 2. Housekeeping staffing formula:
    // Standard cleaning requires 0.5 hours per occupied room. Deep cleans on check-outs require 1.0 hours.
    // Assume a standard shift is 8 hours per staff member.
    const checkOutsCount = activeBookings.filter((b: any) => b.checkOut.toDateString() === targetDate.toDateString()).length;
    const stayOversCount = Math.max(0, activeBookingsCount - checkOutsCount);

    const totalCleaningHoursNeeded = (stayOversCount * 0.5) + (checkOutsCount * 1.0);
    const housekeepingStaffNeeded = Math.max(2, Math.ceil(totalCleaningHoursNeeded / 8));

    // 3. Front Desk Congestion Peak intervals: Standard check-ins occur between 14:00 and 17:00
    // Check-outs peaks occur between 09:00 and 11:00.
    const checkInsCount = activeBookings.filter((b: any) => b.checkIn.toDateString() === targetDate.toDateString()).length;
    
    const frontDeskCongestionPeaks = [
      {
        hour: 10, // 10:00 AM Check-out Peak
        risk: checkOutsCount > 15 ? 'high' : checkOutsCount > 5 ? 'medium' : 'low' as any,
        expectedGuests: checkOutsCount
      },
      {
        hour: 15, // 3:00 PM Check-in Peak
        risk: checkInsCount > 15 ? 'high' : checkInsCount > 5 ? 'medium' : 'low' as any,
        expectedGuests: checkInsCount
      }
    ];

    // 4. Kitchen Rush Windows based on dining profiles
    const kitchenRushWindows = [
      {
        time: "08:00 - 10:00 (Breakfast)",
        factor: projectedOccupancy > 80 ? 1.5 : projectedOccupancy > 50 ? 1.0 : 0.6,
        recommendedStaff: projectedOccupancy > 80 ? 5 : projectedOccupancy > 50 ? 3 : 2
      },
      {
        time: "19:00 - 21:00 (Dinner)",
        factor: projectedOccupancy > 80 ? 1.8 : projectedOccupancy > 50 ? 1.2 : 0.8,
        recommendedStaff: projectedOccupancy > 80 ? 6 : projectedOccupancy > 50 ? 4 : 2
      }
    ];

    return {
      businessDate: targetDateStr,
      projectedOccupancy,
      housekeepingStaffNeeded,
      frontDeskCongestionPeaks,
      kitchenRushWindows
    };
  }
}

export default StaffingForecastEngine;
