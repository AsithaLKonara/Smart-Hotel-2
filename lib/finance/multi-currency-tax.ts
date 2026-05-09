import { prisma } from '../db';
import { eventBus } from '../event-bus';

export interface FXLedgerEntry {
  transactionId: string;
  sourceCurrency: string;
  targetCurrency: string;
  exchangeRate: number;
  sourceAmount: number;
  convertedAmount: number;
  fxVarianceGainLoss: number;
}

export class MultiCurrencyTaxEngine {
  // Mock live FX currency exchange index
  private static currencyRates: { [key: string]: number } = {
    USD: 1.0,
    SGD: 1.35,
    EUR: 0.92,
    GBP: 0.79
  };

  /**
   * Evaluates regional sales taxes, hospitality VAT/GST, and occupancy levies based on property jurisdiction
   */
  static calculateRegionalTaxes(
    roomRate: number,
    jurisdiction: 'SG' | 'UK' | 'MV' | 'US'
  ): { vatAmount: number; touristLevy: number; totalTax: number; finalCharged: number } {
    let vatRate = 0.0;
    let touristLevy = 0.0;

    switch (jurisdiction) {
      case 'SG':
        vatRate = 0.09; // 9% Singapore GST
        touristLevy = 5.0; // Flat flat tourist charge
        break;
      case 'UK':
        vatRate = 0.20; // 20% United Kingdom VAT
        touristLevy = 8.0;
        break;
      case 'MV':
        vatRate = 0.16; // 16% Maldives TGST (Tourism Goods & Services Tax)
        touristLevy = 12.0; // Flat green tax
        break;
      case 'US':
        vatRate = 0.1475; // 14.75% New York Hotel Occupancy Tax
        touristLevy = 3.5;
        break;
    }

    const vatAmount = parseFloat((roomRate * vatRate).toFixed(2));
    const totalTax = parseFloat((vatAmount + touristLevy).toFixed(2));
    const finalCharged = parseFloat((roomRate + totalTax).toFixed(2));

    return {
      vatAmount,
      touristLevy,
      totalTax,
      finalCharged
    };
  }

  /**
   * Standardizes transaction balance conversion values and records currency variance adjustments
   */
  static async executeFXConversion(
    userId: string,
    sourceAmount: number,
    sourceCurrency: string,
    targetCurrency = 'USD'
  ): Promise<FXLedgerEntry> {
    const transactionId = `fx-tx-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const timestamp = new Date().toISOString();

    const rateToUSD = 1 / (this.currencyRates[sourceCurrency] || 1.0);
    const rateToTarget = this.currencyRates[targetCurrency] || 1.0;
    const finalRate = rateToUSD * rateToTarget;

    const convertedAmount = parseFloat((sourceAmount * finalRate).toFixed(2));
    
    // Simulate minor fractional currency fluctuations as currency variance gains/losses
    const fxVarianceGainLoss = parseFloat((convertedAmount * 0.0005).toFixed(4));

    const ledgerEntry: FXLedgerEntry = {
      transactionId,
      sourceCurrency,
      targetCurrency,
      exchangeRate: parseFloat(finalRate.toFixed(4)),
      sourceAmount,
      convertedAmount,
      fxVarianceGainLoss
    };

    // Store log to double entry database audit trail
    await prisma.auditLog.create({
      data: {
        userId,
        actor: 'GLOBAL_FX_LEDGER_ENGINE',
        action: 'FX_CURRENCY_BALANCED',
        details: `FX Conversion ${transactionId}: In=${sourceAmount} ${sourceCurrency}. Out=${convertedAmount} ${targetCurrency}. Rate=${finalRate.toFixed(4)}. Variance=${fxVarianceGainLoss}`,
        createdAt: new Date()
      }
    });

    eventBus.emit({
      id: `fx-evt-${transactionId.slice(-4)}`,
      type: 'financial.fx_variance_adjusted',
      severity: 'INFO',
      title: 'FX Conversion Balanced',
      message: `Successfully ledgered FX transaction ${transactionId}. Adjusted Variance Gain/Loss: $${fxVarianceGainLoss} USD`,
      metadata: { ...ledgerEntry, timestamp },
      timestamp
    });

    return ledgerEntry;
  }
}

export default MultiCurrencyTaxEngine;
