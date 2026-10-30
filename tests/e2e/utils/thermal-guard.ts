import { execSync } from 'child_process';

/**
 * Reads CPU die temperature via osx-cpu-temp.
 * Returns temperature in degrees Celsius (or null if unavailable).
 */
export function getCpuTemperature(): number | null {
  try {
    const output = execSync('osx-cpu-temp', { encoding: 'utf8' }).trim();
    const match = output.match(/([0-9]+(\.[0-9]+)?)/);
    return match ? parseFloat(match[1]) : null;
  } catch {
    return null;
  }
}

/**
 * Enforces strict thermal throttling to protect CPU hardware.
 * If CPU die temperature exceeds maxTempC (default: 82°C to prevent reaching 85°C),
 * pauses execution until temperature cools down below safeThresholdC (default: 72°C).
 */
export async function enforceThermalGuard(maxTempC = 84, safeThresholdC = 78): Promise<void> {
  const currentTemp = getCpuTemperature();
  if (currentTemp === null) return;

  if (currentTemp >= maxTempC) {
    console.warn(`\n⚠️ [Thermal Guard] CPU temp reached ${currentTemp.toFixed(1)}°C (Limit: ${maxTempC}°C). Pausing for cooldown...`);
    while (true) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      const cooledTemp = getCpuTemperature();
      if (cooledTemp === null || cooledTemp <= safeThresholdC) {
        console.log(`❄️ [Thermal Guard] CPU cooled down to ${cooledTemp?.toFixed(1) || 'safe'}°C. Resuming execution.`);
        break;
      }
      console.log(`⏳ [Thermal Guard] Still cooling down: ${cooledTemp.toFixed(1)}°C (waiting for <= ${safeThresholdC}°C)...`);
    }
  }
}
