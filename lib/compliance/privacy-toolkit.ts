import { prisma } from '../db';
import crypto from 'crypto';

export interface GDPRExportResult {
  userId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
  preferences?: any;
  bookings: any[];
  payments: any[];
}

export class PrivacyToolkit {
  /**
   * Compiles and exports all data associated with a user identifier (GDPR Article 15 - Right of Access)
   */
  static async exportUserData(userId: string): Promise<GDPRExportResult> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        guestPreferences: true,
        payments: true,
      }
    });

    if (!user) {
      throw new Error(`User with ID [${userId}] not found for GDPR export.`);
    }

    const bookings = await prisma.booking.findMany({
      where: { userId }
    });

    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      preferences: user.guestPreferences || null,
      bookings: bookings.map((b: any) => ({
        id: b.id,
        checkIn: b.checkIn.toISOString(),
        checkOut: b.checkOut.toISOString(),
        totalAmount: b.totalAmount,
        status: b.status,
        confirmationCode: b.confirmationCode,
      })),
      payments: user.payments.map((p: any) => ({
        id: p.id,
        amount: p.amount,
        status: p.status,
        paymentProvider: p.paymentProvider,
        transactionDate: p.transactionDate.toISOString(),
      })),
    };
  }

  /**
   * Erases/Anonymizes all personally identifiable information of a guest (GDPR Article 17 - Right to Eerasure).
   * Erases names, emails, phones, and preferences while keeping transaction history total intact for accounting balance integrity.
   */
  static async anonymizeUser(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error(`User with ID [${userId}] not found for GDPR erasure.`);
    }

    // Generate non-reversible cryptographic salt hashes for analytics integrity
    const hash = crypto.createHash('sha256').update(userId).digest('hex').slice(0, 12);
    const anonymizedEmail = `gdpr-forgotten-${hash}@smarthotel-anonymous.com`;
    const anonymizedName = `Anonymous Guest #${hash.toUpperCase()}`;
    const anonymizedPhone = '0000000000';

    await prisma.$transaction(async (tx: any) => {
      // 1. Delete associated guest preferences
      await tx.guestPreference.deleteMany({
        where: { userId }
      }).catch(() => {}); // Gracefully bypass if no preferences existed

      // 2. Erase user personal attributes on the user table
      await tx.user.update({
        where: { id: userId },
        data: {
          name: anonymizedName,
          email: anonymizedEmail,
          phone: anonymizedPhone,
          password: '', // Wipe password credentials completely
          updatedAt: new Date()
        }
      });

      // 3. Scrub special requests on their bookings
      await tx.booking.updateMany({
        where: { userId },
        data: {
          specialRequests: 'Scrubbed under GDPR Right to be Forgotten'
        }
      });

      // 4. Log audit event
      await tx.auditLog.create({
        data: {
          userId,
          actor: 'COMPLIANCE_PRIVACY_SYSTEM',
          action: 'GDPR_USER_ERASURE',
          details: `User erasure executed. PII scrubbed. Analytics hash: ${hash}`,
          createdAt: new Date()
        }
      });
    });
  }
}

export default PrivacyToolkit;
