import { EventEmitter } from 'events'

export interface PubSubMessage {
  channel: string
  payload: any
  senderNodeId: string
  timestamp: string
}

const localEmitter = new EventEmitter()
const activeSubscriptions = new Map<string, Set<(msg: PubSubMessage) => void>>()

export class PubSubEngine {
  public static nodeId = `node-${Math.random().toString(36).substr(2, 9)}`

  // Propagates events to Redis channels or fanned-out local emitters
  static async publish(channel: string, payload: any): Promise<void> {
    const message: PubSubMessage = {
      channel,
      payload,
      senderNodeId: this.nodeId,
      timestamp: new Date().toISOString()
    }

    const isRedisConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)

    if (isRedisConfigured) {
      try {
        // Publish to Redis REST API
        const { Redis } = require('@upstash/redis')
        const redis = Redis.fromEnv()
        await redis.publish(channel, JSON.stringify(message))
        return
      } catch (err) {
        console.warn('SRE PubSub: Failed publishing via Upstash Redis. Falling back to local emitter.', err)
      }
    }

    // Local cluster simulation fanout
    localEmitter.emit(channel, message)
  }

  // Registers callback triggers for target channels
  static subscribe(channel: string, callback: (msg: PubSubMessage) => void): () => void {
    if (!activeSubscriptions.has(channel)) {
      activeSubscriptions.set(channel, new Set())
    }
    
    activeSubscriptions.get(channel)!.add(callback)

    const localHandler = (msg: PubSubMessage) => {
      // Ignore self-published node events to prevent cyclic loops
      if (msg.senderNodeId !== this.nodeId) {
        callback(msg)
      }
    }

    localEmitter.on(channel, localHandler)

    // Return release subscription function
    return () => {
      activeSubscriptions.get(channel)!.delete(callback)
      localEmitter.off(channel, localHandler)
    }
  }

  // Simulates external node message broadcasts during tests
  static simulateExternalPublish(channel: string, payload: any): void {
    const msg: PubSubMessage = {
      channel,
      payload,
      senderNodeId: 'external-mock-node',
      timestamp: new Date().toISOString()
    }
    localEmitter.emit(channel, msg)
  }
}

export default PubSubEngine
