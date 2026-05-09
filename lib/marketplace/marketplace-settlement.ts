import { prisma } from '../db';
import { eventBus } from '../event-bus';

export interface SplitTransaction {
  id: string;
  vendorId: string;
  totalCharged: number;
  platformSplit: number; // calculated platform commission
  vendorSplit: number;   // calculated vendor share
  taxDeducted: number;   // localized tax deduction
  status: 'SETTLED' | 'PENDING' | 'REJECTED';
}

export class MarketplaceSettlementEngine {
  /**
   * Posts and divides a transaction split between platform commission structures and third-party vendors
   */
  static async settleSplitCharge(
    vendorId: string,
    totalCharged: number,
    commissionRate = 0.15, // Default 15% commission
    taxRate = 0.08         // Localized 8% sales tax
  ): Promise<SplitTransaction> {
    const id = `split-tx-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const timestamp = new Date().toISOString();

    // 1. Calculations:
    const taxDeducted = parseFloat((totalCharged * taxRate).toFixed(2));
    const netAmount = totalCharged - taxDeducted;
    const platformSplit = parseFloat((netAmount * commissionRate).toFixed(2));
    const vendorSplit = parseFloat((netAmount - platformSplit).toFixed(2));

    // 2. Post record inside double-entry audit logs to ensure compliance trails
    await prisma.auditLog.create({
      data: {
        userId: vendorId,
        actor: 'MARKETPLACE_SETTLEMENT_CORE',
        action: 'MARKETPLACE_REVENUE_SPLIT',
        details: `Split Transaction ${id}: Total=$${totalCharged}. Platform Commission=$${platformSplit}. Vendor share=$${vendorSplit}. Tax=$${taxDeducted}.`,
        createdAt: new Date()
      }
    });

    const splitResult: SplitTransaction = {
      id,
      vendorId,
      totalCharged,
      platformSplit,
      vendorSplit,
      taxDeducted,
      status: 'SETTLED'
    };

    // Emit event to SRE pipeline
    eventBus.emit({
      id: `split-evt-${id.slice(-4)}`,
      type: 'financial.marketplace_split_posted',
      severity: 'INFO',
      title: 'Marketplace Split Ledger Settled',
      message: `Transaction ${id} split successfully. Platform=$${platformSplit}, Vendor=$${vendorSplit}`,
      metadata: { ...splitResult, timestamp },
      timestamp
    });

    return splitResult;
  }
}

export default MarketplaceSettlementEngine;
