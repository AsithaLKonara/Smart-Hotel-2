import { prisma } from '../db';
import { eventBus } from '../event-bus';

export interface UnifiedMessage {
  messageId: string;
  channel: 'WHATSAPP' | 'SMS' | 'EMAIL' | 'CONCIERGE_CHAT' | 'VOICE_TRANSCRIPT';
  direction: 'INBOUND' | 'OUTBOUND';
  sender: string;
  recipient: string;
  text: string;
  timestamp: string;
  correlationId: string;
}

export class UnifiedMessageTimeline {
  /**
   * Records and registers an inbound or outbound message transaction, emitting SRE trace logs
   */
  static async recordMessage(message: Omit<UnifiedMessage, 'messageId' | 'timestamp'>): Promise<UnifiedMessage> {
    const messageId = `msg-c-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const timestamp = new Date().toISOString();

    const loggedMessage: UnifiedMessage = {
      messageId,
      ...message,
      timestamp
    };

    // Store message as a compliance entry inside AuditLogs to keep database footprint standardized
    await prisma.auditLog.create({
      data: {
        userId: message.correlationId, // Correlate user ID
        actor: 'MESSAGE_ROUTER',
        action: `COMMUNICATION_${message.channel}`,
        details: `[${message.direction}] Channel: ${message.channel}. Text: "${message.text.substring(0, 50)}..."`,
        createdAt: new Date()
      }
    });

    eventBus.emit({
      id: `comm-${messageId.slice(-4)}`,
      type: 'communications.message_logged',
      severity: 'INFO',
      title: `Message Logged: ${message.channel}`,
      message: `[${message.channel}] ${message.direction} message for correlation: ${message.correlationId}`,
      metadata: { ...loggedMessage },
      timestamp
    });

    return loggedMessage;
  }

  /**
   * Gathers and compiles a clean, sorted chronology of communications for a specific guest
   */
  static async fetchTimelineForGuest(guestUserId: string): Promise<UnifiedMessage[]> {
    const audits = await prisma.auditLog.findMany({
      where: {
        userId: guestUserId,
        action: { startsWith: 'COMMUNICATION_' }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Parse details strings back into structured models
    return audits.map((a: any) => {
      const channel = a.action.replace('COMMUNICATION_', '') as any;
      const isInbound = a.details.includes('[INBOUND]');
      const startText = a.details.indexOf('Text: "') + 7;
      const text = a.details.substring(startText, a.details.length - 3);

      return {
        messageId: a.id,
        channel,
        direction: isInbound ? 'INBOUND' : 'OUTBOUND',
        sender: isInbound ? 'GUEST' : 'SYSTEM_RECEPTION',
        recipient: isInbound ? 'SYSTEM' : 'GUEST',
        text,
        timestamp: a.createdAt.toISOString(),
        correlationId: guestUserId
      };
    });
  }
}

export default UnifiedMessageTimeline;
