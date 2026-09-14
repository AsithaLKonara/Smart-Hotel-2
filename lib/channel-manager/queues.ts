import { Queue, Worker, QueueEvents } from 'bullmq'
import IORedis from 'ioredis'

// Shared Redis connection for BullMQ
let redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379'
if (redisUrl.includes('${{')) {
  console.warn('[REDIS] Unresolved template variable in REDIS_URL. Falling back to localhost for BullMQ build.');
  redisUrl = 'redis://127.0.0.1:6379';
}
const redisConnection = new IORedis(redisUrl, { maxRetriesPerRequest: null })

// Queue for processing incoming webhook/reservations from OTAs
export const inboundOtaQueue = new Queue('inbound-ota', { connection: redisConnection })

// Queue for pushing inventory/rate updates to OTAs
export const outboundSyncQueue = new Queue('outbound-sync', { connection: redisConnection })

// Queue Events for monitoring
export const inboundEvents = new QueueEvents('inbound-ota', { connection: redisConnection })
export const outboundEvents = new QueueEvents('outbound-sync', { connection: redisConnection })
