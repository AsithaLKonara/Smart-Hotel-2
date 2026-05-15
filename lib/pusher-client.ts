import Pusher from 'pusher-js'

/**
 * Shared Pusher Client Instance
 * Ensures only one connection is maintained across multiple hooks.
 */

let pusherClient: Pusher | null = null

export function getPusherClient() {
  if (!pusherClient) {
    pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || '', {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1',
    })
  }
  return pusherClient
}
