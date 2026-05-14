import { prisma } from '../db';
import { eventBus } from '../event-bus';

export interface ThreatProfile {
  userId: string;
  anomalyScore: number; // 0 to 100
  impossibleTravelDetected: boolean;
  actionTaken: 'MONITOR' | 'ISOLATE_TOKEN' | 'REVOKE_ACCESS';
  reason: string;
}

export class ThreatDetectionEngine {
  /**
   * Assesses a user session check for possible intrusions, impossible travel events, and token hygiene
   */
  static async evaluateSessionSecurity(
    userId: string,
    currentIp: string,
    currentLocation: string,
    lastLocation?: string,
    hoursSinceLastAccess?: number
  ): Promise<ThreatProfile> {
    const timestamp = new Date().toISOString();
    let anomalyScore = 10; // Baseline low risk
    let impossibleTravelDetected = false;
    let actionTaken: 'MONITOR' | 'ISOLATE_TOKEN' | 'REVOKE_ACCESS' = 'MONITOR';
    let reason = "Access behaviors align with corporate profile parameters.";

    // 1. Evaluate Impossible Travel heuristics:
    // If locations differ drastically (e.g., London vs Singapore) and hours elapsed is low, trigger alert.
    if (lastLocation && lastLocation !== currentLocation && hoursSinceLastAccess !== undefined) {
      if (hoursSinceLastAccess < 4) {
        impossibleTravelDetected = true;
        anomalyScore += 75; // Drastic risk jump
        actionTaken = 'REVOKE_ACCESS';
        reason = `CRITICAL: Impossible Travel detected. User was at [${lastLocation}] and accessed from [${currentLocation}] in ${hoursSinceLastAccess} hours. Spatial delta physically unfeasible.`;
      } else if (hoursSinceLastAccess < 12) {
        anomalyScore += 40;
        actionTaken = 'ISOLATE_TOKEN';
        reason = `WARNING: Suspicious velocity travel. Session moved from [${lastLocation}] to [${currentLocation}] in ${hoursSinceLastAccess} hours. Token isolation active.`;
      }
    }

    // 2. Commit audit log to secure ledger database
    await prisma.auditLog.create({
      data: {
        userId,
        actor: 'SECURITY_GUARD_AI',
        action: impossibleTravelDetected ? 'THREAT_BLOCKED' : 'SESSION_CHECKED',
        resource: 'User',
        resourceId: userId,
        details: {
          anomalyScore,
          currentLocation,
          currentIp,
          actionTaken,
          reason
        },
        createdAt: new Date()
      }
    });

    const profile: ThreatProfile = {
      userId,
      anomalyScore,
      impossibleTravelDetected,
      actionTaken,
      reason
    };

    // Emit event to SRE logs
    eventBus.emit({
      id: `threat-check-${userId.slice(-4)}`,
      type: 'security.threat_profiled',
      severity: actionTaken === 'REVOKE_ACCESS' ? 'CRITICAL' : actionTaken === 'ISOLATE_TOKEN' ? 'HIGH' : 'INFO',
      title: impossibleTravelDetected ? 'Intrusion Intrusion Detected!' : 'Session Audited Successfully',
      message: `User ${userId} checked. Status: ${actionTaken}. Detail: ${reason}`,
      metadata: { ...profile, currentIp, timestamp },
      timestamp
    });

    return profile;
  }
}

export default ThreatDetectionEngine;
