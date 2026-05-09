export interface SelectorHealResult {
  healed: boolean;
  repairedSelector: string;
  explanation: string;
}

export function healSelector(originalSelector: string, pageSource: string): SelectorHealResult {
  console.log(`🧯 Running selector self-healing routine for: "${originalSelector}"`);
  
  // 1. Text selector modern replacement
  if (originalSelector.includes('text=')) {
    const rawText = originalSelector.split('text=')[1].replace(/['"]/g, '');
    const repaired = `text="${rawText}"`;
    return {
      healed: true,
      repairedSelector: repaired,
      explanation: `Evolved legacy syntax 'text=Label' into native Playwright quoted search filter: 'text="Label"'.`
    };
  }

  // 2. ID target fallback to class or test-id
  if (originalSelector.startsWith('#')) {
    const idName = originalSelector.replace('#', '');
    if (pageSource.includes(`data-testid="${idName}"`)) {
      return {
        healed: true,
        repairedSelector: `[data-testid="${idName}"]`,
        explanation: `Target ID element "${originalSelector}" shifted inside a test-id container. Re-routed locator.`
      };
    }
    
    if (pageSource.includes(`name="${idName}"`)) {
      return {
        healed: true,
        repairedSelector: `input[name="${idName}"]`,
        explanation: `Fallback matching on name attribute for form element.`
      };
    }
  }

  // 3. No healing match possible
  return {
    healed: false,
    repairedSelector: originalSelector,
    explanation: 'No direct layout correlation patterns matched in DOM layout cache.'
  };
}
