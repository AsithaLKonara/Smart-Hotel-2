import { Redis } from '@upstash/redis'
import dotenv from 'dotenv'

dotenv.config()

/**
 * Disaster Recovery Tool: Redis Flush
 * 
 * WARNING: This script will execute a FLUSHDB command against your Upstash Redis instance.
 * It is intended for emergency use only when the cache is poisoned, stuck in a redirect loop,
 * or rate limits are erroneously blocking all traffic.
 */

const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
  console.error('❌ Missing Upstash Redis credentials in environment.')
  console.error('Please ensure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set.')
  process.exit(1)
}

async function flushRedisCache() {
  console.log('==================================================')
  console.log('🚨 DISASTER RECOVERY: FLUSHING UPSTASH REDIS CACHE')
  console.log('==================================================')
  
  try {
    console.log('\n📡 Connecting to Upstash via REST API...')
    const redis = new Redis({
      url: UPSTASH_REDIS_REST_URL!,
      token: UPSTASH_REDIS_REST_TOKEN!,
    })

    console.log('🧹 Executing FLUSHDB...')
    const result = await redis.flushdb()
    
    if (result === 'OK') {
      console.log('✅ FLUSHDB executed successfully. All keys have been wiped.')
      console.log('ℹ️ Application will gracefully rebuild the cache on next request.')
      process.exit(0)
    } else {
      console.error('⚠️ Unexpected response from Upstash:', result)
      process.exit(1)
    }
  } catch (error: any) {
    console.error('\n❌ CRITICAL: Failed to flush Redis cache.')
    console.error(error.message)
    process.exit(1)
  }
}

flushRedisCache()
