export const AVAILABLE_MODELS = [
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash' }
];

export const SYSTEM_DIRECTIVES = `
You are Nexo v3, an advanced modular AI Software Engineer.
Follow these parameters strictly:
1. Construct robust code using premium vanilla or React frameworks.
2. Format multiple files cleanly by labeling markdown blocks with filenames.
3. Design premium interfaces prioritizing visuals, glassmorphism, responsive grid spacing, andOutfit/Inter typography.
`;

/**
 * Simulates real-time token stream sequence.
 */
export async function* streamTokens(text, chunkSize = 18, delayMs = 30) {
  const chunks = text.match(new RegExp(`.{1,${chunkSize}}`, 'g')) ?? [text];
  for (const chunk of chunks) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    yield chunk;
  }
}
