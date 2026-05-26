export type InlineIntent = 'ghostText' | 'autocomplete' | 'fix' | 'rewrite' | 'explain';

export function generateInlineSuggestion(intent: InlineIntent, source: string) {
  const base = source.trim().split('\n').slice(-1)[0] || 'function handler() {}';

  if (intent === 'ghostText') {
    return `\n// AI ghost text\n// next: validate inputs and add retry logic`;
  }

  if (intent === 'autocomplete') {
    return `${base}\n// autocomplete: add typed return contract`;
  }

  if (intent === 'fix') {
    return `${source}\n\n// fix: handle null checks before execution`;
  }

  if (intent === 'rewrite') {
    return `// rewritten for clarity\n${source}`;
  }

  return `This selection orchestrates runtime execution and persists state snapshots for agent continuity.`;
}
