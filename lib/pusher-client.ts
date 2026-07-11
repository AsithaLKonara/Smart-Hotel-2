import Pusher from 'pusher-js'

/**
 * Shared Pusher Client Instance
 * Ensures only one connection is maintained across multiple hooks.
 *
 * CFG-003: Pusher is an OPTIONAL integration. When NEXT_PUBLIC_PUSHER_KEY
 * is absent, this function returns null instead of instantiating an invalid
 * Pusher connection that would crash on first use.
 * Callers must guard against null: `getPusherClient()?.subscribe(...)`
 */

let pusherClient: Pusher | null = null

export function getPusherClient(): Pusher | null {
  // Guard: Do not attempt to connect if the key is absent or empty.
  if (!process.env.NEXT_PUBLIC_PUSHER_KEY) {
    return null
  }

  if (!pusherClient) {
    pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1',
    })
  }
  return pusherClient
}
