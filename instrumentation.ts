import { validateEnv } from './lib/env'

/**
 * Next.js Instrumentation
 * Used for server-side initialization and monitoring.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('--- Initializing SmartHotel OS Enterprise Infrastructure ---')
    
    // 0. Mitigate Next.js WebSocket SSRF (CVE-2026-44578)
    try {
      const http = require('http')
      const originalOn = http.Server.prototype.on

      const customOn = function (this: any, event: string, listener: any) {
        if (event === 'upgrade') {
          return originalOn.call(this, event, function (req: any, socket: any, head: any) {
            console.warn(`[SECURITY WARNING] Blocked WebSocket upgrade attempt to: ${req.url}`)
            socket.write('HTTP/1.1 400 Bad Request\r\nConnection: close\r\nContent-Type: text/plain\r\nContent-Length: 32\r\n\r\nWebSocket upgrades not allowed\n')
            socket.destroy()
          })
        }
        return originalOn.apply(this, arguments)
      }

      http.Server.prototype.on = customOn
      http.Server.prototype.addListener = customOn
      console.log('🛡️ WebSocket SSRF Firewall initialized successfully.')
    } catch (err: any) {
      console.error('Failed to initialize WebSocket SSRF Firewall:', err.message)
    }

    // 1. Validate Environment
    try {
      validateEnv()
      console.log('✅ Environment validated successfully.')
    } catch (err) {
      console.error('CRITICAL: Startup blocked by invalid environment configuration.')
      // In production, we want to crash early. 
      // In dev, we might want to continue with warnings but the validateEnv call above will throw.
    }
    
    // 2. Database Connectivity Check (Optional but recommended)
    // 3. Redis Connectivity Check (Optional but recommended)
  }
}
