import { eventBus } from '../event-bus';

export interface TwinSimulationReport {
  simulatedOccupancy: number;
  guestCheckInFlowVelocity: number; // guests per hour
  housekeepingWorkloadLagMinutes: number;
  elevatorTransitCongestionRatio: number; // 0 to 1 scale
  kitchenDeliveryBacklogMinutes: number;
  detectedLogisticsBottleneck: boolean;
  bottleneckReason: string;
}

export class PropertyDigitalTwin {
  /**
   * Evaluates logistical bottlenecks across various operational metrics under customizable simulation stress-tests
   */
  static runLogisticsStressTest(
    activeRoomsCount: number,
    totalRoomsInventory = 120,
    activeHousekeepingStaffCount = 4,
    activeKitchenChefsCount = 2,
    elevatorMaintenanceOverride = false
  ): TwinSimulationReport {
    const timestamp = new Date().toISOString();
    const simulatedOccupancy = totalRoomsInventory > 0 ? (activeRoomsCount / totalRoomsInventory) * 100 : 0;

    // 1. Calculate check-in flow velocity (velocity doubles when occupancy is over 80%)
    const guestCheckInFlowVelocity = simulatedOccupancy > 80 ? 45 : 15;

    // 2. Housekeeping Workload Lag:
    // Assume standard cleaning is 30 mins. If staff is low, lag is magnified.
    const expectedCleaningHours = activeRoomsCount * 0.5;
    const staffShiftHours = activeHousekeepingStaffCount * 8;
    const housekeepingWorkloadLagMinutes = Math.max(0, Math.round(((expectedCleaningHours - staffShiftHours) / activeHousekeepingStaffCount) * 60));

    // 3. Elevator Transit Congestion Ratio (elevators have limited capacity)
    let elevatorTransitCongestionRatio = simulatedOccupancy > 85 ? 0.82 : 0.35;
    if (elevatorMaintenanceOverride) {
      elevatorTransitCongestionRatio = Math.min(1.0, elevatorTransitCongestionRatio + 0.35);
    }

    // 4. Kitchen Delivery Backlog:
    const activeOrders = Math.round(activeRoomsCount * 0.15); // Assume 15% order room dining
    const expectedPrepMinutes = activeOrders * 12;
    const kitchenDeliveryBacklogMinutes = Math.max(5, Math.round(expectedPrepMinutes / activeKitchenChefsCount));

    // 5. Bottleneck Analysis:
    let detectedLogisticsBottleneck = false;
    let bottleneckReason = "Portfolio is performing within standard SLA boundaries.";

    if (housekeepingWorkloadLagMinutes > 90) {
      detectedLogisticsBottleneck = true;
      bottleneckReason = `CRITICAL: Severe housekeeping lag detected (${housekeepingWorkloadLagMinutes}m delay). Occupancy is too high for current cleaning staff. Roster secondary shift immediate to avoid delay.`;
    } else if (elevatorTransitCongestionRatio > 0.85) {
      detectedLogisticsBottleneck = true;
      bottleneckReason = `WARNING: Peak elevator wait time. Single elevator operation under high occupancy (${Math.round(simulatedOccupancy)}%) causes passenger queues. Re-verify dispatch algorithm.`;
    } else if (kitchenDeliveryBacklogMinutes > 45) {
      detectedLogisticsBottleneck = true;
      bottleneckReason = `WARNING: Dining backlog detected (${kitchenDeliveryBacklogMinutes}m wait). Chef count insufficient for dinner orders. Adjust kitchen rosters.`;
    }

    const report: TwinSimulationReport = {
      simulatedOccupancy: parseFloat(simulatedOccupancy.toFixed(1)),
      guestCheckInFlowVelocity,
      housekeepingWorkloadLagMinutes,
      elevatorTransitCongestionRatio: parseFloat(elevatorTransitCongestionRatio.toFixed(2)),
      kitchenDeliveryBacklogMinutes,
      detectedLogisticsBottleneck,
      bottleneckReason
    };

    // Emit simulation completed event to pipeline
    eventBus.emit({
      id: `twin-sim-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      type: 'simulation.twin_cycle_completed',
      severity: detectedLogisticsBottleneck ? 'HIGH' : 'INFO',
      title: 'Digital Twin Simulation Concluded',
      message: `Simulation results parsed. Bottleneck detected: ${detectedLogisticsBottleneck}. ${bottleneckReason}`,
      metadata: { ...report, timestamp },
      timestamp
    });

    return report;
  }
}

export default PropertyDigitalTwin;
