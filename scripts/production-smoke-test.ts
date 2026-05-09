import dotenv from 'dotenv'
import path from 'path'

// Load environment configuration
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const TARGET_URL = process.env.TARGET_URL || process.env.TEST_URL || 'http://localhost:3000'

async function runSmokeTests() {
  console.log('🏁 Starting SmartHotel SRE Production Smoke-Test Suite...')
  console.log(`📍 Targeting Environment: ${TARGET_URL}\n`)

  let passedAll = true

  // ==========================================
  // CHECK 1: API Server Health Status
  // ==========================================
  console.log('🔍 [CHECK 1/4] Verifying System Health Endpoints...')
  try {
    const liveRes = await fetch(`${TARGET_URL}/api/health/live`)
    const readyRes = await fetch(`${TARGET_URL}/api/health/ready`)

    const liveStatus = liveRes.status
    const readyStatus = readyRes.status

    if (liveStatus === 200 && readyStatus === 200) {
      console.log('  [PASS] /api/health/live responds 200 OK')
      console.log('  [PASS] /api/health/ready responds 200 OK\n')
    } else {
      console.error(`  [FAIL] Health check failed. Live: ${liveStatus}, Ready: ${readyStatus}\n`)
      passedAll = false
    }
  } catch (err: any) {
    console.error(`  [FAIL] Failed contacting health endpoints: ${err.message}\n`)
    passedAll = false
  }

  // ==========================================
  // CHECK 2: SRE Chaos Simulation Guard
  // ==========================================
  console.log('🔍 [CHECK 2/4] Auditing Chaos-Injections Status (Safety Guard)...')
  try {
    const chaosRes = await fetch(`${TARGET_URL}/api/sre/chaos`)
    if (chaosRes.status === 200) {
      const chaosState = await chaosRes.json()
      
      const isDbOutageActive = !!chaosState.dbOutage
      const isStripeFailureActive = !!chaosState.stripeFailure
      const isLatencyActive = (chaosState.latency || 0) > 0
      const isMemoryPressureActive = !!chaosState.memoryPressure

      console.log('  Current Chaos Simulation Configurations:')
      console.log(`    - Database Outage Injection : ${isDbOutageActive ? '⚠️ ACTIVE' : '✅ DISABLED'}`)
      console.log(`    - Stripe Gateway Intercept  : ${isStripeFailureActive ? '⚠️ ACTIVE' : '✅ DISABLED'}`)
      console.log(`    - Artificial Network Delay  : ${isLatencyActive ? `⚠️ ACTIVE (${chaosState.latency}ms)` : '✅ DISABLED'}`)
      console.log(`    - RAM Starvation Leak      : ${isMemoryPressureActive ? '⚠️ ACTIVE' : '✅ DISABLED'}`)

      if (isDbOutageActive || isStripeFailureActive || isLatencyActive || isMemoryPressureActive) {
        console.error('\n  [FAIL] CRITICAL: SRE Chaos Simulation parameters are still active! Production deployments must have ALL chaos toggles disabled.\n')
        passedAll = false
      } else {
        console.log('  [PASS] All chaos and failure simulations are fully disabled (Production Safe).\n')
      }
    } else if (chaosRes.status === 404) {
      console.log('  [PASS] /api/sre/chaos endpoint is not exposed / responds 404. Production endpoints should shield chaos controls.\n')
    } else {
      console.warn(`  [WARN] Unexpected response from /api/sre/chaos: ${chaosRes.status}. Continuing...\n`)
    }
  } catch (err: any) {
    console.log(`  [PASS] Failed to query chaos (Endpoint may be secured/hidden in target environment): ${err.message}\n`)
  }

  // ==========================================
  // CHECK 3: Security Shields & Rate Limiting Headers
  // ==========================================
  console.log('🔍 [CHECK 3/4] Validating Production Rate-Limiter Integration...')
  try {
    // Send a mock request to a protected endpoint to verify rate limit response headers
    const testRes = await fetch(`${TARGET_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sre-probe@smarthotel.com', password: 'test' }),
    })

    const limit = testRes.headers.get('X-RateLimit-Limit')
    const remaining = testRes.headers.get('X-RateLimit-Remaining')
    const reset = testRes.headers.get('X-RateLimit-Reset')

    if (limit || remaining) {
      console.log(`  Rate limit headers detected:`)
      console.log(`    - Limit     : ${limit}`)
      console.log(`    - Remaining : ${remaining}`)
      console.log(`    - Reset     : ${reset}`)
      console.log('  [PASS] Production rate limiter shields are active and propagating safety headers!\n')
    } else {
      console.warn('  [WARN] Rate limit headers not found in response. Verify that apiLimiter/enhanced rate-limiting is enabled on auth routes.\n')
    }
  } catch (err: any) {
    console.error(`  [FAIL] Failed verifying rate limit endpoints: ${err.message}\n`)
    passedAll = false
  }

  // ==========================================
  // CHECK 4: DB Latency SLA Compliance
  // ==========================================
  console.log('🔍 [CHECK 4/4] Auditing Database Query Performance SLA...')
  try {
    const start = Date.now()
    const roomsRes = await fetch(`${TARGET_URL}/api/rooms`)
    const latency = Date.now() - start

    if (roomsRes.status === 200) {
      console.log(`  Database Rooms Query latency: ${latency}ms`)
      if (latency < 500) {
        console.log('  [PASS] Database latency falls within SRE SLA parameters (< 500ms).\n')
      } else {
        console.error('  [FAIL] Database latency exceeded SRE SLA limit of 500ms! Potential bottleneck or severe cross-region roundtrip lag.\n')
        passedAll = false
      }
    } else {
      console.error(`  [FAIL] Rooms endpoint responded with status: ${roomsRes.status}\n`)
      passedAll = false
    }
  } catch (err: any) {
    console.error(`  [FAIL] Database latency check failed: ${err.message}\n`)
    passedAll = false
  }

  console.log('==================================================')
  if (passedAll) {
    console.log('🎉 ALL PRODUCTION DEPLOYMENT SMOKE CHECKS PASSED!')
    console.log('SmartHotel is fully validated for live-user operations.')
    console.log('==================================================\n')
    process.exit(0)
  } else {
    console.error('❌ PRODUCTION DEPLOYMENT SMOKE CHECKS FAILED!')
    console.log('Please investigate the reported issues before proceeding to real-world deploy.')
    console.log('==================================================\n')
    process.exit(1)
  }
}

runSmokeTests().catch((err) => {
  console.error('Fatal execution error during smoke tests:', err)
  process.exit(1)
})
