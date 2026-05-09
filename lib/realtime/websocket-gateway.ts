import { PubSubEngine } from './pubsub-engine'

export interface ClientConnection {
  socketId: string
  userId: string
  role: string
  propertyId: string
  lastSeen: number
  send: (payload: string) => void
}

export class WebSocketGateway {
  private static connections = new Map<string, ClientConnection>()
  private static pingInterval: NodeJS.Timeout | null = null

  // Registers client connection with terminal parameters
  static registerConnection(
    socketId: string,
    userId: string,
    role: string,
    propertyId: string,
    sendFn: (payload: string) => void
  ): ClientConnection {
    const conn: ClientConnection = {
      socketId,
      userId,
      role,
      propertyId,
      lastSeen: Date.now(),
      send: sendFn
    }

    this.connections.set(socketId, conn)

    // Broadcast operator presence arrival to PubSub cluster
    PubSubEngine.publish('presence:updates', {
      event: 'operator_online',
      userId,
      role,
      propertyId,
      socketId
    })

    return conn
  }

  // Handle client incoming ping frame
  static registerHeartbeat(socketId: string): void {
    const conn = this.connections.get(socketId)
    if (conn) {
      conn.lastSeen = Date.now()
    }
  }

  // Deregister client session
  static removeConnection(socketId: string): void {
    const conn = this.connections.get(socketId)
    if (conn) {
      this.connections.delete(socketId)
      
      // Broadcast operator presence departure to PubSub cluster
      PubSubEngine.publish('presence:updates', {
        event: 'operator_offline',
        userId: conn.userId,
        propertyId: conn.propertyId,
        socketId
      })
    }
  }

  // Iterates connection pools, evicting stale dead client sockets (Heartbeat monitoring)
  static pruneStaleSockets(thresholdMs: number = 30000): string[] {
    const now = Date.now()
    const prunedIds: string[] = []

    this.connections.forEach((conn, id) => {
      if (now - conn.lastSeen > thresholdMs) {
        prunedIds.push(id)
      }
    })

    prunedIds.forEach(id => this.removeConnection(id))

    return prunedIds
  }

  // Propagates messages selectively based on physical property boundaries (multi-tenant protection)
  static broadcastToProperty(propertyId: string, event: string, payload: any): void {
    const message = JSON.stringify({ event, payload })
    
    this.connections.forEach((conn) => {
      if (conn.propertyId === propertyId) {
        conn.send(message)
      }
    })
  }

  // Synchronizes buffered offline mobile tasks securely on reconnection
  static async replayOfflineQueue(
    socketId: string,
    queue: Array<{ action: string; payload: any; timestamp: string }>
  ): Promise<number> {
    const conn = this.connections.get(socketId)
    if (!conn) throw new Error('CONNECTION_NOT_FOUND')

    let successfullyReplayed = 0

    for (const item of queue) {
      // Process each actions (e.g. task completions, inspections checklists)
      if (item.action === 'task:complete' || item.action === 'room:inspection') {
        successfullyReplayed++
        
        // Propagate real-time updates cross-nodes
        await PubSubEngine.publish('realtime:events', {
          propertyId: conn.propertyId,
          event: 'offline_task_reclaimed',
          payload: {
            action: item.action,
            data: item.payload,
            replayedAt: new Date().toISOString()
          }
        })
      }
    }

    return successfullyReplayed
  }

  static getActiveCount(): number {
    return this.connections.size
  }

  static clearAll(): void {
    this.connections.clear()
  }
}

export default WebSocketGateway
