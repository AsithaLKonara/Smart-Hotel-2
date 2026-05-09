import { resolveSelector, learnSelector } from '../memory/run-memory';
import { healSelector } from '../healing/selector-healer';

export interface Action {
  type: 'goto' | 'click' | 'type' | 'wait';
  url?: string;
  selector?: string;
  value?: string;
  ms?: number;
}

export interface FlowResult {
  success: boolean;
  error?: any;
  lastAction?: Action;
}

export async function runFlow(page: any, actions: Action[]): Promise<FlowResult> {
  const defaultBaseUrl = 'http://localhost:3002'; // Runs on production smoke port
  
  for (const action of actions) {
    try {
      switch (action.type) {
        case 'goto':
          const targetUrl = action.url?.startsWith('http') 
            ? action.url 
            : `${defaultBaseUrl}${action.url}`;
          console.log(`🧭 Navigating to: ${targetUrl}`);
          await page.goto(targetUrl, { waitUntil: 'load', timeout: 10000 });
          break;

        case 'click':
          if (!action.selector) throw new Error('Click action requires selector');
          const clickedSelector = resolveSelector(action.selector);
          try {
            console.log(`🖱️ Clicking: ${clickedSelector}`);
            await page.waitForSelector(clickedSelector, { timeout: 5000 });
            await page.click(clickedSelector);
          } catch (clickErr: any) {
            console.warn(`⚠️ Warning: Selector "${clickedSelector}" failed to interact. Triggering self-healing...`);
            const pageSource = await page.content().catch(() => '');
            const healing = healSelector(action.selector, pageSource);
            if (healing.healed) {
              console.log(`🟢 [DYNAMIC RECOVERY]: Attempting inline click replay using "${healing.repairedSelector}"...`);
              await page.waitForSelector(healing.repairedSelector, { timeout: 3000 });
              await page.click(healing.repairedSelector);
              learnSelector(action.selector, healing.repairedSelector);
              console.log(`🎉 [SUCCESS]: Dynamic inline self-healing replay recovered successfully!`);
            } else {
              throw clickErr;
            }
          }
          break;

        case 'type':
          if (!action.selector) throw new Error('Type action requires selector');
          const typedSelector = resolveSelector(action.selector);
          try {
            console.log(`⌨️ Filling [${typedSelector}] with: "${action.value}"`);
            await page.waitForSelector(typedSelector, { timeout: 5000 });
            await page.fill(typedSelector, action.value || '');
          } catch (typeErr: any) {
            console.warn(`⚠️ Warning: Selector "${typedSelector}" failed to interact. Triggering self-healing...`);
            const pageSource = await page.content().catch(() => '');
            const healing = healSelector(action.selector, pageSource);
            if (healing.healed) {
              console.log(`🟢 [DYNAMIC RECOVERY]: Attempting inline type replay using "${healing.repairedSelector}"...`);
              await page.waitForSelector(healing.repairedSelector, { timeout: 3000 });
              await page.fill(healing.repairedSelector, action.value || '');
              learnSelector(action.selector, healing.repairedSelector);
              console.log(`🎉 [SUCCESS]: Dynamic inline self-healing replay recovered successfully!`);
            } else {
              throw typeErr;
            }
          }
          break;

        case 'wait':
          const waitMs = action.ms || 1000;
          console.log(`⏳ Waiting for ${waitMs}ms`);
          await page.waitForTimeout(waitMs);
          break;
      }
    } catch (err: any) {
      console.error(`❌ Action Failed: ${JSON.stringify(action)} -> Error: ${err.message}`);
      return {
        success: false,
        error: err.message,
        lastAction: action,
      };
    }
  }

  return { success: true };
}
