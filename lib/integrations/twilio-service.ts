export interface SmsPayload {
  messageId: string
  toPhone: string
  body: string
  retryCount: number
}

export class TwilioService {
  private static deliveryOutbox: SmsPayload[] = []
  private static bounceRegistry = new Set<string>()

  // Sends operational alert SMS to staff
  static async sendSms(payload: SmsPayload): Promise<boolean> {
    if (this.bounceRegistry.has(payload.toPhone)) {
      throw new Error(`SMS_DELIVERY_BLOCKED: Phone number [${payload.toPhone}] has previously bounced.`)
    }

    // Capture in outgoing logs
    this.deliveryOutbox.push(payload)
    return true
  }

  // Register bounce numbers to prevent spam costs
  static registerBounceNumber(phone: string): void {
    this.bounceRegistry.add(phone)
  }

  static getSmsLogs(): SmsPayload[] {
    return this.deliveryOutbox
  }

  static clearAll(): void {
    this.deliveryOutbox = []
    this.bounceRegistry.clear()
  }
}

export default TwilioService
