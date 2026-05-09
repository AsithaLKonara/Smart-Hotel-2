export interface FailureTelemetry {
  errors: string[];
  consoleErrors: string[];
  networkFailures: string[];
}

export function setupFailureListeners(page: any): FailureTelemetry {
  const logs: FailureTelemetry = {
    errors: [],
    consoleErrors: [],
    networkFailures: []
  };

  // 1. Capture uncaught frontend runtime errors
  page.on('pageerror', (err: Error) => {
    logs.errors.push(err.stack || err.message);
  });

  // 2. Capture client-side browser console.error calls
  page.on('console', (msg: any) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore transient browser asset or network resource load warnings (images, fonts, maps, analytics, CDNs)
      if (text.includes('Failed to load resource')) {
        return;
      }
      logs.consoleErrors.push(text);
    }
  });

  // 3. Capture failed HTTP/fetch requests (such as 500 API responses)
  page.on('requestfailed', (req: any) => {
    const url = req.url();
    const resource = req.resourceType();
    // Only monitor critical operational layers: document loading, API fetches, and scripts
    if (resource !== 'document' && resource !== 'fetch' && resource !== 'xhr' && resource !== 'script') {
      return;
    }
    // Filter non-blocking analytics, metrics payloads, or network-aborted unloads
    if (url.includes('/api/performance') || url.includes('/metrics') || req.failure()?.errorText === 'net::ERR_ABORTED') {
      return;
    }
    const failText = req.failure()?.errorText || 'HTTP Request Failed';
    logs.networkFailures.push(`[${req.method()}] ${url} -> ${failText}`);
  });

  // 4. Capture bad status codes from finished network requests
  page.on('requestfinished', async (req: any) => {
    const url = req.url();
    const resource = req.resourceType();
    if (resource !== 'document' && resource !== 'fetch' && resource !== 'xhr' && resource !== 'script') {
      return;
    }
    if (url.includes('/api/performance') || url.includes('/metrics')) {
      return;
    }
    const response = await req.response().catch(() => null);
    if (response && response.status() >= 400) {
      logs.networkFailures.push(`[${req.method()}] ${url} -> HTTP Status ${response.status()}`);
    }
  });

  return logs;
}
