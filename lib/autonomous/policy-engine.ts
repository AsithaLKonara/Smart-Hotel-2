import { prisma } from '../db';
import { eventBus } from '../event-bus';

export interface AutomationTrigger {
  ruleId: string;
  name: string;
  condition: (context: any) => boolean;
  action: (context: any) => Promise<any>;
}

export class PolicyEngine {
  private static rules: AutomationTrigger[] = [
    // Rule 1: Automated checkout-driven housekeeping dispatches
    {
      ruleId: "rule-auto-clean",
      name: "Checkout Housekeeping Dispatcher",
      condition: (ctx) => ctx.event === 'booking.checked_out',
      action: async (ctx) => {
        const roomId = ctx.roomId;
        await prisma.room.update({
          where: { id: roomId },
          data: { status: 'DIRTY', updatedAt: new Date() }
        });

        eventBus.emit({
          id: `clean-${roomId.slice(-4)}-${Date.now().toString().slice(-4)}`,
          type: 'autonomous.housekeeping_dispatched',
          severity: 'INFO',
          title: 'Housekeeping Scheduled Autonomously',
          message: `Room [${roomId}] checked out. Housekeeping status updated to DIRTY.`,
          metadata: { roomId, triggerEvent: ctx.event },
          timestamp: new Date().toISOString()
        });
      }
    },

    // Rule 2: Dynamic SLA Breach Mitigation & Automated Guest Compensations
    {
      ruleId: "rule-sla-compensate",
      name: "SLA Anomaly Recovery Sweeper",
      condition: (ctx) => ctx.event === 'sla.breach_detected' && ctx.severity === 'HIGH',
      action: async (ctx) => {
        const { userId, bookingId, delayMinutes } = ctx;
        const refundAmount = delayMinutes > 60 ? 100 : 50;

        await prisma.user.update({
          where: { id: userId },
          data: {
            payments: {
              create: {
                amount: refundAmount,
                status: 'refunded',
                paymentProvider: 'INTERNAL_LOYALTY_WALLET',
                createdAt: new Date(),
              }
            }
          }
        });

        // Write administrative notarization audit log
        await prisma.auditLog.create({
          data: {
            userId,
            actor: 'AUTONOMOUS_POLICY_SYSTEM',
            action: 'AUTOMATED_SLA_COMPENSATION',
            resource: 'Booking',
            resourceId: bookingId,
            details: {
              message: `Issued autonomous loyalty wallet compensation of $${refundAmount}.00 for booking ${bookingId} due to ${delayMinutes}m delay.`
            },
            createdAt: new Date()
          }
        });

        eventBus.emit({
          id: `sla-comp-${bookingId.slice(-4)}`,
          type: 'autonomous.compensation_issued',
          severity: 'HIGH',
          title: 'Guest Recovery Compensated',
          message: `SLA breach trigger: Guest ${userId} compensated $${refundAmount}.00 for ${delayMinutes}m wait.`,
          metadata: { userId, bookingId, refundAmount, delayMinutes },
          timestamp: new Date().toISOString()
        });
      }
    },

    // Rule 3: High-Risk Maintenance Dispatch
    {
      ruleId: "rule-predictive-repair",
      name: "Predictive Repair Allocator",
      condition: (ctx) => ctx.event === 'maintenance.risk_escalated' && ctx.riskScore > 80,
      action: async (ctx) => {
        const { roomId, riskScore, systemType } = ctx;

        await prisma.auditLog.create({
          data: {
            userId: 'SYSTEM',
            actor: 'PREDICTIVE_MAINTENANCE_AI',
            action: 'DISPATCH_PREVENTATIVE_TICKET',
            resource: 'Room',
            resourceId: roomId,
            details: {
              message: `Dispatched urgent preventatitve team to room:${roomId} due to ${systemType} failure risk score of ${riskScore}%.`
            },
            createdAt: new Date()
          }
        });

        eventBus.emit({
          id: `maint-disp-${roomId.slice(-4)}`,
          type: 'autonomous.maintenance_alert_raised',
          severity: 'CRITICAL',
          title: 'Preventative Repair Dispatch Scheduled',
          message: `Predictive maintenance warning: Room ${roomId} ${systemType} score is ${riskScore}%. Priority dispatch generated.`,
          metadata: { roomId, riskScore, systemType },
          timestamp: new Date().toISOString()
        });
      }
    }
  ];

  /**
   * Evaluates operational context against all active automated business rule policies
   */
  static async evaluateEventContext(context: { event: string; [key: string]: any }): Promise<void> {
    for (const rule of this.rules) {
      if (rule.condition(context)) {
        try {
          await rule.action(context);
        } catch (err) {
          console.error(`Autonomous Policy Engine: Failed executing rule [${rule.ruleId}]`, err);
        }
      }
    }
  }

  /**
   * Dynamic revenue and price rate adjustments (Occupancy elasticity calculations)
   * Base rate adjusts proportionally based on occupancy ratio:
   * Occupancy < 40% -> Discount rate (elasticity price reduction)
   * Occupancy > 80% -> Surge pricing multiplier
   */
  static computeDynamicRevenueAdjustment(baseRate: number, occupancyRatio: number, isCompetitorParityBelow = false): number {
    let multiplier = 1.0;

    if (occupancyRatio > 85) {
      multiplier = 1.45; // Dynamic 45% surge for high demand
    } else if (occupancyRatio > 65) {
      multiplier = 1.15; // Moderate 15% optimization
    } else if (occupancyRatio < 35) {
      multiplier = 0.85; // 15% promotional discount to capture market share
    }

    // Force parity matched price if competitors are lowering rates aggressively
    if (isCompetitorParityBelow && multiplier > 1.0) {
      multiplier = 1.05; // Drop surge down to prevent reservation abandonment
    }

    return parseFloat((baseRate * multiplier).toFixed(2));
  }
}

export default PolicyEngine;
