import fs from 'fs';
import path from 'path';

export interface RunRecord {
  route: string;
  success: boolean;
  errors: string[];
  brokenSelectors: string[];
  healedSelectors: string[];
  timestamp: number;
  stabilityScore: number;
}

export interface MemoryState {
  runHistory: RunRecord[];
  selectorMap: Record<string, string>;
}

const MEMORY_DIR = path.join(__dirname, '../../qa/memory');
const MEMORY_FILE = path.join(MEMORY_DIR, 'memory.json');

const defaultState: MemoryState = {
  runHistory: [],
  selectorMap: {}
};

// Ensure memory directory exists
if (!fs.existsSync(MEMORY_DIR)) {
  fs.mkdirSync(MEMORY_DIR, { recursive: true });
}

export function loadMemory(): MemoryState {
  if (!fs.existsSync(MEMORY_FILE)) {
    saveMemory(defaultState);
    return { ...defaultState };
  }
  try {
    const raw = fs.readFileSync(MEMORY_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.warn('⚠️ Warn: Failed to read QA Memory file, loading empty state:', err);
    return { ...defaultState };
  }
}

export function saveMemory(state: MemoryState) {
  try {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error('❌ Error: Failed to write QA Memory file:', err);
  }
}

export function learnSelector(broken: string, fixed: string) {
  const state = loadMemory();
  state.selectorMap[broken] = fixed;
  saveMemory(state);
  console.log(`🧠 [LEARNED SELECTOR]: Stored persistent mapping:\n  "${broken}" -> "${fixed}"`);
}

export function resolveSelector(selector: string): string {
  const state = loadMemory();
  const resolved = state.selectorMap[selector];
  if (resolved) {
    console.log(`🔌 [SELECTOR MIDDLEWARE]: Resolved broken locator "${selector}" -> "${resolved}"`);
    return resolved;
  }
  return selector;
}

export interface ComparisonReport {
  stabilityDelta: number;
  newFailures: string[];
  resolvedIssues: string[];
  stabilityTrend: 'improving' | 'degrading' | 'stable';
}

export function compareRuns(prev?: RunRecord, current?: RunRecord): ComparisonReport {
  if (!prev) {
    return {
      stabilityDelta: 0,
      newFailures: current?.errors || [],
      resolvedIssues: [],
      stabilityTrend: 'stable'
    };
  }
  if (!current) {
    return {
      stabilityDelta: 0,
      newFailures: [],
      resolvedIssues: prev.errors,
      stabilityTrend: 'stable'
    };
  }

  const prevErrors = new Set(prev.errors);
  const currentErrors = new Set(current.errors);

  const newFailures = current.errors.filter(e => !prevErrors.has(e));
  const resolvedIssues = prev.errors.filter(e => !currentErrors.has(e));

  const stabilityDelta = current.stabilityScore - prev.stabilityScore;
  let stabilityTrend: 'improving' | 'degrading' | 'stable' = 'stable';

  if (stabilityDelta > 0.05) {
    stabilityTrend = 'improving';
  } else if (stabilityDelta < -0.05) {
    stabilityTrend = 'degrading';
  }

  return {
    stabilityDelta,
    newFailures,
    resolvedIssues,
    stabilityTrend
  };
}
