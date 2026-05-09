export interface LeaderState {
  leaderNodeId: string
  termStartedAt: number
  lastHeartbeat: number
}

export class LeaderElection {
  private static leadershipKey = 'scheduler:leader:state'
  private static activeLeader: LeaderState | null = null

  // Attempts to acquire or renew single-master leadership for a target node
  static async campaignForLeadership(
    nodeId: string,
    heartbeatWindowMs: number = 3000
  ): Promise<boolean> {
    const now = Date.now()
    const isRedisConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)

    if (isRedisConfigured) {
      try {
        const { Redis } = require('@upstash/redis')
        const redis = Redis.fromEnv()

        const currentStr = await redis.get(this.leadershipKey)
        let current: LeaderState | null = null

        if (currentStr) {
          current = typeof currentStr === 'string' ? JSON.parse(currentStr) : currentStr
        }

        // 1. Check if leadership is vacant or has expired (missed heartbeat window)
        const isVacant = !current
        const hasExpired = current ? (now - current.lastHeartbeat > heartbeatWindowMs) : false
        const isAlreadyLeader = current ? (current.leaderNodeId === nodeId) : false

        if (isVacant || hasExpired || isAlreadyLeader) {
          const newState: LeaderState = {
            leaderNodeId: nodeId,
            termStartedAt: isAlreadyLeader ? current!.termStartedAt : now,
            lastHeartbeat: now
          }

          // Write updated term status atomically
          await redis.set(this.leadershipKey, JSON.stringify(newState), { px: heartbeatWindowMs })
          this.activeLeader = newState
          return true
        }

        return false
      } catch (err) {
        console.warn('SRE Leader: Redis leader campaign query failed. Falling back to memory term.', err)
      }
    }

    // In-Memory Term Simulation Fallback
    const localCurrent = this.activeLeader
    const isVacant = !localCurrent
    const hasExpired = localCurrent ? (now - localCurrent.lastHeartbeat > heartbeatWindowMs) : false
    const isAlreadyLeader = localCurrent ? (localCurrent.leaderNodeId === nodeId) : false

    if (isVacant || hasExpired || isAlreadyLeader) {
      const newState: LeaderState = {
        leaderNodeId: nodeId,
        termStartedAt: isAlreadyLeader ? localCurrent!.termStartedAt : now,
        lastHeartbeat: now
      }
      this.activeLeader = newState
      return true
    }

    return false
  }

  static getActiveLeader(): LeaderState | null {
    return this.activeLeader
  }

  static demoteLeadership(): void {
    this.activeLeader = null
  }
}

export default LeaderElection
