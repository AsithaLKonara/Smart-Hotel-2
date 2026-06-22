import { Redis } from '@upstash/redis'

export interface PublishMessage {
  topic: string
  key: string
  value: string
  headers?: Record<string, string>
}

// Circuit Breaker States
enum CircuitState {
  CLOSED,
  OPEN,
  HALF_OPEN
}

export class MessageBroker {
  private static get redis(): Redis | null {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        return Redis.fromEnv()
      } catch {
        return null
      }
    }
    return null
  }
  
  // Circuit Breaker configuration
  private static state: CircuitState = CircuitState.CLOSED
  private static failures: number = 0
  private static readonly MAX_FAILURES = 3
  private static readonly COOLDOWN_MS = 30000
  private static nextAttemptTime: number = 0

  // Fallback in-memory broker
  private static memoryQueue: PublishMessage[] = []

  static async publish(message: PublishMessage): Promise<void> {
    const now = Date.now();

    // Check circuit breaker state
    if (this.state === CircuitState.OPEN) {
      if (now > this.nextAttemptTime) {
        this.state = CircuitState.HALF_OPEN;
      } else {
        return this.publishToMemory(message, 'CIRCUIT_OPEN');
      }
    }

    try {
      const r = this.redis;
      if (!r) {
        throw new Error("Redis not configured");
      }
      
      // Attempt Redis publish
      await r.publish(message.topic, {
        key: message.key,
        value: message.value,
        headers: message.headers
      });

      // If successful, reset circuit breaker
      if (this.state === CircuitState.HALF_OPEN) {
        this.state = CircuitState.CLOSED;
        this.failures = 0;
        console.log('[MessageBroker] Circuit Breaker CLOSED (Redis restored)');
      }
    } catch (error) {
      this.failures++;
      console.error(`[MessageBroker] Redis publish failed (${this.failures}/${this.MAX_FAILURES}):`, error);

      if (this.state === CircuitState.CLOSED && this.failures >= this.MAX_FAILURES) {
        this.state = CircuitState.OPEN;
        this.nextAttemptTime = now + this.COOLDOWN_MS;
        console.warn(`[MessageBroker] Circuit Breaker OPEN. Falling back to MemoryBroker for ${this.COOLDOWN_MS}ms`);
      } else if (this.state === CircuitState.HALF_OPEN) {
        this.state = CircuitState.OPEN;
        this.nextAttemptTime = now + this.COOLDOWN_MS;
      }

      // Fallback
      return this.publishToMemory(message, 'REDIS_ERROR');
    }
  }

  private static publishToMemory(message: PublishMessage, reason: string): void {
    this.memoryQueue.push(message);
    // Log gracefully instead of failing
    console.log(`[MessageBroker:MemoryFallback] Topic: ${message.topic} (Reason: ${reason})`);
  }

  // Helper for test assertions if needed
  static getMockPublished(): PublishMessage[] {
    return this.memoryQueue
  }

  static clearMockPublished(): void {
    this.memoryQueue = []
  }
}

export default MessageBroker
