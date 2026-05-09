import { prisma } from '../db';

export interface MaintenanceRiskProfile {
  roomId: string;
  roomNumber: string;
  hvacRiskScore: number;       // 0 to 100 scale
  plumbingRiskScore: number;   // 0 to 100 scale
  overallFailureRisk: 'low' | 'medium' | 'high';
  lastServiceDate: string;
  recommendedAction: string;
}

export class PredictiveMaintenanceEngine {
  /**
   * Assesses and compiles predictive failure indices for all rooms in the hotel system
   */
  static async evaluatePropertyRisks(): Promise<MaintenanceRiskProfile[]> {
    const rooms = await prisma.room.findMany();
    const profiles: MaintenanceRiskProfile[] = [];

    for (const room of rooms) {
      // 1. Ingest historical maintenance events to calculate frequency factors
      const pastIssues = await prisma.auditLog.findMany({
        where: {
          details: { contains: `room:${room.id}` },
          action: { contains: 'MAINTENANCE' }
        }
      });

      const incidentCount = pastIssues.length;

      // 2. Mock asset coefficients (HVAC run hours, appliance lifespans) based on room variables
      // Rooms with odd indices simulate older plumbing / HVAC configurations to simulate diagnostic variance
      const isLegacyUnit = parseInt(room.roomNumber) % 2 !== 0;
      
      let hvacRiskScore = 15; // Baseline low risk
      let plumbingRiskScore = 10;

      // Scale factors based on historical failures
      hvacRiskScore += incidentCount * 12;
      plumbingRiskScore += incidentCount * 8;

      if (isLegacyUnit) {
        hvacRiskScore += 30; // Aging compression system
        plumbingRiskScore += 25; // Outmoded pipe architecture
      }

      // Bound risks to max 100
      hvacRiskScore = Math.min(100, hvacRiskScore);
      plumbingRiskScore = Math.min(100, plumbingRiskScore);

      const maxRisk = Math.max(hvacRiskScore, plumbingRiskScore);
      let overallFailureRisk: 'low' | 'medium' | 'high' = 'low';
      let recommendedAction = 'Routine inspection schedule.';

      if (maxRisk > 75) {
        overallFailureRisk = 'high';
        recommendedAction = 'EMERGENCY: Immediate compressor service or hardware swap required.';
      } else if (maxRisk > 45) {
        overallFailureRisk = 'medium';
        recommendedAction = 'Schedule priority HVAC filter clean and pressure gauge audit within 7 days.';
      }

      profiles.push({
        roomId: room.id,
        roomNumber: room.roomNumber,
        hvacRiskScore,
        plumbingRiskScore,
        overallFailureRisk,
        lastServiceDate: room.updatedAt ? room.updatedAt.toISOString() : new Date().toISOString(),
        recommendedAction
      });
    }

    return profiles;
  }
}

export default PredictiveMaintenanceEngine;
