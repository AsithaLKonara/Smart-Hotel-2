import { Page } from 'playwright';

export interface DiscoveredRoute {
  path: string;
  forms: Array<{
    selector: string;
    type: string;
    name?: string;
  }>;
  links: string[];
}

/**
 * Autonomous Flow Explorer crawling engine.
 * Discovers site topology and input fields dynamically via DOM analysis.
 */
export async function discoverRoutes(page: Page, baseUrl: string, maxDepth: number = 2): Promise<Record<string, DiscoveredRoute>> {
  const visited = new Set<string>();
  const queue: Array<{ path: string; depth: number }> = [{ path: '/', depth: 0 }];
  const siteMap: Record<string, DiscoveredRoute> = {};

  while (queue.length > 0) {
    const { path: currentPath, depth } = queue.shift()!;
    
    if (visited.has(currentPath) || depth > maxDepth) {
      continue;
    }
    visited.add(currentPath);

    try {
      const targetUrl = `${baseUrl}${currentPath}`;
      console.log(`🔍 [FLOW EXPLORER]: Crawling dynamic route [${currentPath}]...`);
      await page.goto(targetUrl, { waitUntil: 'load', timeout: 30000 });
      await page.waitForTimeout(500);

      // 1. Discover all unique local links
      const hrefs = await page.$$eval('a', (anchors) => 
        anchors.map(a => a.getAttribute('href')).filter(Boolean) as string[]
      );

      const localPaths = Array.from(new Set(
        hrefs
          .map(href => {
            try {
              const url = new URL(href, baseUrl);
              if (url.origin === baseUrl) {
                return url.pathname;
              }
            } catch {
              if (href.startsWith('/') && !href.startsWith('//')) {
                return href.split('#')[0];
              }
            }
            return null;
          })
          .filter((p): p is string => p !== null && p !== '')
      ));

      // 2. Discover input elements and forms
      const forms = await page.$$eval('input, textarea, select', (elements) => {
        return elements.map(el => {
          return {
            selector: el.tagName.toLowerCase() + (el.id ? `#${el.id}` : el.getAttribute('name') ? `[name="${el.getAttribute('name')}"]` : ''),
            type: el.getAttribute('type') || el.tagName.toLowerCase(),
            name: el.getAttribute('name') || undefined
          };
        });
      });

      siteMap[currentPath] = {
        path: currentPath,
        forms,
        links: localPaths
      };

      // Add undiscovered links to queue
      for (const nextPath of localPaths) {
        if (!visited.has(nextPath) && !queue.some(q => q.path === nextPath)) {
          // Avoid deep recursive third party or heavy routes like api endpoints
          if (!nextPath.startsWith('/api/') && !nextPath.startsWith('/_next/') && !nextPath.includes('.')) {
            queue.push({ path: nextPath, depth: depth + 1 });
          }
        }
      }

    } catch (err: any) {
      console.warn(`⚠️ [FLOW EXPLORER]: Failed to crawl route [${currentPath}]: ${err.message}`);
    }
  }

  return siteMap;
}
