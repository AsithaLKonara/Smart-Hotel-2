/**
 * SRE Chaos & Failure Simulation Core State
 * 
 * Provides unified toggles to trigger and simulate real-world production outages,
 * transient network delays, memory spikes, and third-party API crashes.
 */

export interface ChaosState {
  dbOutage: boolean
  latency: number // latency injection in milliseconds
  stripeFailure: boolean
  memoryPressure: boolean
}

const globalForChaos = globalThis as unknown as {
  chaosState: ChaosState | undefined
}

// Initialize process-level singleton for persistent chaos state across requests
if (!globalForChaos.chaosState) {
  globalForChaos.chaosState = {
    dbOutage: false,
    latency: 0,
    stripeFailure: false,
    memoryPressure: false,
  }
}

export const chaosState = globalForChaos.chaosState

/**
 * Injects a delayed sleep if latency is configured
 */
export async function applyChaosDelay(): Promise<void> {
  if (chaosState.latency > 0) {
    await new Promise((resolve) => setTimeout(resolve, chaosState.latency))
  }
}

// In-memory memory leak holder
let memoryLeakedBlock: Buffer[] = []

/**
 * Allocates or deallocates dummy memory blocks to simulate RAM starvation
 */
export function toggleMemoryPressure(active: boolean): void {
  if (active) {
    try {
      // Allocate 50MB of memory safely
      memoryLeakedBlock.push(Buffer.alloc(50 * 1024 * 1024, 'X'))
      console.warn('SRE Chaos: Allocated 50MB memory block under pressure simulation.')
    } catch (err) {
      console.error('SRE Chaos: Memory allocation failed:', err)
    }
  } else {
    memoryLeakedBlock = []
    if (globalThis.gc) {
      try {
        globalThis.gc()
      } catch (err) {}
    }
    console.log('SRE Chaos: Deallocated memory pressure blocks.')
  }
}
