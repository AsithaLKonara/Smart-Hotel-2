import fs from 'fs'
import path from 'path'

export interface ChaosScenario {
  id: string
  name: string
  description: string
  active: boolean
  intensity: number // e.g., latency ms or failure rate %
}

const STATE_FILE_PATH = path.join(process.cwd(), 'qa/chaos/chaos-state.json')

const DEFAULT_SCENARIOS: ChaosScenario[] = [
  {
    id: "DB_LATENCY",
    name: "Database Transaction Latency",
    description: "Delays all database reads and writes by an intentional lag duration.",
    active: false,
    intensity: 3000 // 3000ms delay
  },
  {
    id: "SOCKET_DROP",
    name: "Websocket Connection Drop",
    description: "Forces all active client-socket listeners to simulate offline/retry status.",
    active: false,
    intensity: 100 // 100% disconnect simulation
  },
  {
    id: "OTA_FAIL",
    name: "OTA Channel Webhook Outage",
    description: "Returns random 500 crashes on Booking.com / Airbnb pricing sync queries.",
    active: false,
    intensity: 80 // 80% failure rate
  }
];

// Helper to ensure the file and dir exist safely
function initChaosStateFile() {
  const dir = path.dirname(STATE_FILE_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  if (!fs.existsSync(STATE_FILE_PATH)) {
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(DEFAULT_SCENARIOS, null, 2))
  }
}

export function getChaosScenarios(): ChaosScenario[] {
  initChaosStateFile()
  try {
    const raw = fs.readFileSync(STATE_FILE_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return DEFAULT_SCENARIOS
  }
}

export function saveChaosScenarios(scenarios: ChaosScenario[]) {
  initChaosStateFile()
  fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(scenarios, null, 2))
}

export function isChaosActive(scenarioId: string): { active: boolean; intensity: number } {
  const list = getChaosScenarios()
  const found = list.find(s => s.id === scenarioId)
  return {
    active: found ? found.active : false,
    intensity: found ? found.intensity : 0
  }
}

export async function injectChaosDelay(scenarioId: string): Promise<boolean> {
  const { active, intensity } = isChaosActive(scenarioId)
  if (active && intensity > 0) {
    console.warn(`🔥 [CHAOS ENGINE]: Injecting intentional latency delay of ${intensity}ms for ${scenarioId}...`)
    await new Promise(resolve => setTimeout(resolve, intensity))
    return true
  }
  return false
}

export function shouldChaosFail(scenarioId: string): boolean {
  const { active, intensity } = isChaosActive(scenarioId)
  if (active) {
    const roll = Math.random() * 100
    if (roll < intensity) {
      console.error(`🔥 [CHAOS ENGINE]: Injecting simulated outage crash for scenario: ${scenarioId}!`)
      return true
    }
  }
  return false
}
