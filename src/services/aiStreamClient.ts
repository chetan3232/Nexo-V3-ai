// ── Unified Multi-Model AI Streaming Client ─────────────────────────────────
//
// Supports:
//  • NVIDIA NIM (default/fallback)
//  • OpenAI
//  • Claude (Anthropic)
//  • Gemini (Google)
//  • OpenRouter
//  • Ollama (Local)
//  • DeepSeek
//
// Dynamic Routing is supported via 'nexo-auto-router'.
// CORS bypasses are set up securely via Electron's main process.
//

const IS_ELECTRON = typeof window !== 'undefined' && !!(window as any).nexoDesktop;
const IS_DEV      = typeof window !== 'undefined' && (location.hostname === 'localhost' || location.protocol === 'file:');

// In dev Vite: use Vite proxy at /api/nvidia
// In Electron file:// or prod: call NVIDIA directly (CORS is bypassed by Electron session)
const NVIDIA_BASE = (IS_ELECTRON || !IS_DEV)
  ? 'https://integrate.api.nvidia.com/v1'
  : '/api/nvidia';

// ── Secure Credential Retrievers ──────────────────────────────────────────
export const getNvidiaKey = () => {
  if (typeof window !== 'undefined' && (window as any).nexoDesktop?.getNvidiaKey) {
    const key = (window as any).nexoDesktop.getNvidiaKey();
    if (key) return key;
  }
  return ((import.meta as any).env?.VITE_NVIDIA_API_KEY as string) || '';
};

export const getOpenaiKey = () => {
  if (typeof window !== 'undefined' && (window as any).nexoDesktop?.getOpenaiKey) {
    const key = (window as any).nexoDesktop.getOpenaiKey();
    if (key) return key;
  }
  return ((import.meta as any).env?.VITE_OPENAI_API_KEY as string) || '';
};

export const getClaudeKey = () => {
  if (typeof window !== 'undefined' && (window as any).nexoDesktop?.getClaudeKey) {
    const key = (window as any).nexoDesktop.getClaudeKey();
    if (key) return key;
  }
  return ((import.meta as any).env?.VITE_CLAUDE_API_KEY as string) || '';
};

export const getGeminiKey = () => {
  if (typeof window !== 'undefined' && (window as any).nexoDesktop?.getGeminiKey) {
    const key = (window as any).nexoDesktop.getGeminiKey();
    if (key) return key;
  }
  return ((import.meta as any).env?.VITE_GEMINI_API_KEY as string) || '';
};

export const getOpenrouterKey = () => {
  if (typeof window !== 'undefined' && (window as any).nexoDesktop?.getOpenrouterKey) {
    const key = (window as any).nexoDesktop.getOpenrouterKey();
    if (key) return key;
  }
  return ((import.meta as any).env?.VITE_OPENROUTER_API_KEY as string) || '';
};

export const getDeepseekKey = () => {
  if (typeof window !== 'undefined' && (window as any).nexoDesktop?.getDeepseekKey) {
    const key = (window as any).nexoDesktop.getDeepseekKey();
    if (key) return key;
  }
  return ((import.meta as any).env?.VITE_DEEPSEEK_API_KEY as string) || '';
};

// ── Types ─────────────────────────────────────────────────────────────────
export type StreamHandlers = {
  onToken: (token: string) => void;
  onDone:  () => void;
  onError: (error: Error) => void;
};

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type ModelCategory = 'coding' | 'reasoning' | 'general' | 'vision' | 'mini';

export type NvidiaModel = {
  id: string;
  label: string;
  provider: string;
  category: ModelCategory;
  contextK?: number;
};

// ── Curated Model Directory ───────────────────────────────────────────────
export const NVIDIA_MODELS: NvidiaModel[] = [
  // ── Auto Router ──
  { id: 'nexo-auto-router',                        label: '✦ Nexo Auto Router',       provider: 'Nexo AI',    category: 'reasoning', contextK: 128 },

  // ── NVIDIA NIM (Direct Coding / Reasoning) ──
  { id: 'z-ai/glm-5.1',                            label: 'GLM 5.1 (NIM)',            provider: 'NVIDIA',     category: 'reasoning', contextK: 128 },
  { id: 'stepfun-ai/step-3.7-flash',               label: 'Step 3.7 Flash (NIM)',     provider: 'NVIDIA',     category: 'coding',    contextK: 128 },
  { id: 'minimaxai/minimax-m2.7',                  label: 'Minimax M2.7 (NIM)',       provider: 'NVIDIA',     category: 'general',   contextK: 128 },
  { id: 'qwen/qwen3-coder-480b-a35b-instruct',    label: 'Qwen3 Coder 480B (NIM)',   provider: 'NVIDIA',     category: 'coding',    contextK: 128 },
];

export const DEFAULT_MODEL = 'nexo-auto-router';

// ── Provider Resolver ──────────────────────────────────────────────────────
export function getProviderForModel(modelId: string): 'OpenAI' | 'Claude' | 'Gemini' | 'OpenRouter' | 'Ollama' | 'DeepSeek' | 'NVIDIA' {
  if (modelId.startsWith('openai/')) return 'OpenAI';
  if (modelId.startsWith('claude/') || modelId.startsWith('anthropic/')) return 'Claude';
  if (modelId.startsWith('gemini/')) return 'Gemini';
  if (modelId.startsWith('openrouter/')) return 'OpenRouter';
  if (modelId.startsWith('ollama/')) return 'Ollama';
  if (modelId.startsWith('deepseek/')) return 'DeepSeek';
  return 'NVIDIA';
}

// ── Smart Task Classifier ──────────────────────────────────────────────────
export function detectTaskType(messages: ChatMessage[]): 'cheap' | 'coding' | 'reasoning' | 'general' {
  const lastMessage = messages[messages.length - 1]?.content ?? '';
  const lowercase = lastMessage.toLowerCase();

  if (lowercase.includes('inline code autocompletion') || lowercase.includes('continuation:') || lowercase.includes('ghost text')) {
    return 'cheap';
  }
  if (lowercase.includes('refactor') || lowercase.includes('generate component') || lowercase.includes('document code') || lowercase.includes('write a code') || lowercase.includes('fix bug') || lowercase.includes('edit the provided code')) {
    return 'coding';
  }
  if (lowercase.includes('plan') || lowercase.includes('reason') || lowercase.includes('agent') || lowercase.includes('architect') || lowercase.includes('solve this complex')) {
    return 'reasoning';
  }
  return 'general';
}

// ── Auto Model Router ─────────────────────────────────────────────────────
export function routeModelAutomatically(taskType: 'cheap' | 'coding' | 'reasoning' | 'general'): string {
  if (taskType === 'reasoning') {
    return 'z-ai/glm-5.1';
  }
  if (taskType === 'coding') {
    return 'qwen/qwen3-coder-480b-a35b-instruct';
  }
  if (taskType === 'cheap') {
    return 'stepfun-ai/step-3.7-flash';
  }
  return 'minimaxai/minimax-m2.7';
}

// ── SSE Stream Parsers ─────────────────────────────────────────────────────

async function parseStandardSSE(response: Response, handlers: StreamHandlers) {
  if (!response.body) {
    handlers.onError(new Error('No response body received from stream'));
    return;
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') {
          handlers.onDone();
          return;
        }

        try {
          const json = JSON.parse(data);
          const delta = json?.choices?.[0]?.delta;
          if (delta?.reasoning_content) {
            handlers.onToken(delta.reasoning_content);
          }
          if (delta?.content) {
            handlers.onToken(delta.content);
          }
        } catch {
          // Skip malformed lines
        }
      }
    }
  } catch (err: any) {
    handlers.onError(new Error(`Stream parsing error: ${err.message}`));
    return;
  }
  handlers.onDone();
}

async function parseClaudeSSE(response: Response, handlers: StreamHandlers) {
  if (!response.body) {
    handlers.onError(new Error('No response body received from stream'));
    return;
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const data = trimmed.slice(5).trim();

        try {
          const json = JSON.parse(data);
          if (json.type === 'content_block_delta' && json.delta?.text) {
            handlers.onToken(json.delta.text);
          } else if (json.type === 'message_stop') {
            handlers.onDone();
            return;
          }
        } catch {
          // Skip malformed lines
        }
      }
    }
  } catch (err: any) {
    handlers.onError(new Error(`Stream parsing error: ${err.message}`));
    return;
  }
  handlers.onDone();
}

async function parseGeminiSSE(response: Response, handlers: StreamHandlers) {
  if (!response.body) {
    handlers.onError(new Error('No response body received from stream'));
    return;
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const data = trimmed.slice(5).trim();

        try {
          const json = JSON.parse(data);
          const partText = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (partText) {
            handlers.onToken(partText);
          }
        } catch {
          // Skip malformed lines
        }
      }
    }
  } catch (err: any) {
    handlers.onError(new Error(`Stream parsing error: ${err.message}`));
    return;
  }
  handlers.onDone();
}

async function parseOllamaStream(response: Response, handlers: StreamHandlers) {
  if (!response.body) {
    handlers.onError(new Error('No response body received from stream'));
    return;
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const json = JSON.parse(trimmed);
          if (json.message?.content) {
            handlers.onToken(json.message.content);
          }
          if (json.done) {
            handlers.onDone();
            return;
          }
        } catch {
          // Skip malformed lines
        }
      }
    }
  } catch (err: any) {
    handlers.onError(new Error(`Stream parsing error: ${err.message}`));
    return;
  }
  handlers.onDone();
}

// ── Stream Routing Implementation ──────────────────────────────────────────

async function streamOpenAI(
  messages: ChatMessage[],
  modelId: string,
  handlers: StreamHandlers,
  options?: { temperature?: number; maxTokens?: number }
) {
  const key = getOpenaiKey();
  if (!key) {
    handlers.onError(new Error("OpenAI API key not found. Please configure OPENAI_API_KEY in your environment variables."));
    return;
  }
  const cleanModel = modelId.replace('openai/', '');
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: cleanModel,
        messages,
        temperature: options?.temperature ?? 0.6,
        max_tokens: options?.maxTokens ?? 4096,
        stream: true
      })
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI API ${response.status}: ${text}`);
    }
    await parseStandardSSE(response, handlers);
  } catch (err: any) {
    handlers.onError(err);
  }
}

async function streamClaude(
  messages: ChatMessage[],
  modelId: string,
  handlers: StreamHandlers,
  options?: { temperature?: number; maxTokens?: number }
) {
  const key = getClaudeKey();
  if (!key) {
    handlers.onError(new Error("Claude API key not found. Please configure CLAUDE_API_KEY in your environment variables."));
    return;
  }
  const cleanModel = modelId.replace('claude/', '').replace('anthropic/', '');

  const systemMsg = messages.find(m => m.role === 'system');
  const userMsgs = messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role, content: m.content }));

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: cleanModel,
        messages: userMsgs,
        system: systemMsg?.content,
        max_tokens: options?.maxTokens ?? 4096,
        temperature: options?.temperature ?? 0.6,
        stream: true
      })
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Claude API ${response.status}: ${text}`);
    }
    await parseClaudeSSE(response, handlers);
  } catch (err: any) {
    handlers.onError(err);
  }
}

async function streamGemini(
  messages: ChatMessage[],
  modelId: string,
  handlers: StreamHandlers,
  options?: { temperature?: number; maxTokens?: number }
) {
  const key = getGeminiKey();
  if (!key) {
    handlers.onError(new Error("Gemini API key not found. Please configure GEMINI_API_KEY in your environment variables."));
    return;
  }
  let cleanModel = modelId.replace('gemini/', '');
  if (cleanModel === 'gemini') {
    cleanModel = 'gemini-2.0-flash';
  }

  const systemMsg = messages.find(m => m.role === 'system');
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

  const body: any = {
    contents,
    generationConfig: {
      temperature: options?.temperature ?? 0.6,
      maxOutputTokens: options?.maxTokens ?? 4096
    }
  };

  if (systemMsg) {
    body.systemInstruction = {
      parts: [{ text: systemMsg.content }]
    };
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:streamGenerateContent?alt=sse&key=${key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Gemini API ${response.status}: ${text}`);
    }
    await parseGeminiSSE(response, handlers);
  } catch (err: any) {
    handlers.onError(err);
  }
}

async function streamOpenRouter(
  messages: ChatMessage[],
  modelId: string,
  handlers: StreamHandlers,
  options?: { temperature?: number; maxTokens?: number }
) {
  const key = getOpenrouterKey();
  if (!key) {
    handlers.onError(new Error("OpenRouter API key not found. Please configure OPENROUTER_API_KEY in your environment variables."));
    return;
  }
  const cleanModel = modelId.replace('openrouter/', '');
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'Nexo AI'
      },
      body: JSON.stringify({
        model: cleanModel,
        messages,
        temperature: options?.temperature ?? 0.6,
        max_tokens: options?.maxTokens ?? 4096,
        stream: true
      })
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenRouter API ${response.status}: ${text}`);
    }
    await parseStandardSSE(response, handlers);
  } catch (err: any) {
    handlers.onError(err);
  }
}

async function streamOllama(
  messages: ChatMessage[],
  modelId: string,
  handlers: StreamHandlers,
  options?: { temperature?: number }
) {
  const cleanModel = modelId.replace('ollama/', '');
  try {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: cleanModel,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        options: {
          temperature: options?.temperature ?? 0.6
        },
        stream: true
      })
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Ollama API ${response.status}: ${text}`);
    }
    await parseOllamaStream(response, handlers);
  } catch (err: any) {
    handlers.onError(new Error(`Ollama connection error. Verify Ollama is running locally on http://localhost:11434. Details: ${err.message}`));
  }
}

async function streamDeepSeek(
  messages: ChatMessage[],
  modelId: string,
  handlers: StreamHandlers,
  options?: { temperature?: number; maxTokens?: number }
) {
  const key = getDeepseekKey();
  if (!key) {
    handlers.onError(new Error("DeepSeek API key not found. Please configure DEEPSEEK_API_KEY in your environment variables."));
    return;
  }
  const cleanModel = modelId.replace('deepseek/', '');
  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: cleanModel,
        messages,
        temperature: options?.temperature ?? 0.6,
        max_tokens: options?.maxTokens ?? 4096,
        stream: true
      })
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`DeepSeek API ${response.status}: ${text}`);
    }
    await parseStandardSSE(response, handlers);
  } catch (err: any) {
    handlers.onError(err);
  }
}

function getFallbackNvidiaModel(modelId: string): string | null {
  switch (modelId) {
    case 'z-ai/glm-5.1':
      return 'stepfun-ai/step-3.7-flash';
    default:
      return null;
  }
}

async function streamNvidiaResponseDirect(
  messages: ChatMessage[],
  modelId: string,
  handlers: StreamHandlers,
  options?: { temperature?: number; maxTokens?: number; topP?: number }
): Promise<void> {
  const { temperature = 0.6, maxTokens = 8192, topP = 0.95 } = options ?? {};
  const key = getNvidiaKey();

  if (!key) {
    handlers.onError(new Error("NVIDIA NIM API key not found. Please configure NVIDIA_API_KEY in your environment variables."));
    return;
  }

  let currentModel = modelId;
  const maxRetries = 2; // Retry up to 2 times per model

  while (currentModel) {
    let delay = 1000;
    let success = false;
    let lastError: Error | null = null;
    let shouldTryFallback = false;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      let response: Response;
      try {
        const requestBody: any = {
          model:       currentModel,
          messages,
          temperature,
          top_p:       topP,
          max_tokens:  maxTokens,
          stream:      true,
        };

        if (currentModel === 'z-ai/glm-5.1') {
          requestBody.chat_template_kwargs = { "enable_thinking": true, "clear_thinking": false };
          requestBody.max_tokens = 16384;
          requestBody.temperature = 1.0;
          requestBody.top_p = 1.0;
        } else if (currentModel === 'stepfun-ai/step-3.7-flash') {
          requestBody.max_tokens = 16384;
          requestBody.temperature = 1.0;
          requestBody.top_p = 0.95;
        }

        response = await fetch(`${NVIDIA_BASE}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${key}`,
          },
          body: JSON.stringify(requestBody),
        });
      } catch (err) {
        lastError = new Error(`Network error: ${String(err)}`);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 1.5;
          continue;
        }
        shouldTryFallback = true;
        break;
      }

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        lastError = new Error(`NVIDIA API ${response.status}: ${text}`);

        if (response.status === 503 || response.status === 429) {
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 1.5;
            continue;
          }
          shouldTryFallback = true;
        }
        break;
      }

      try {
        await parseStandardSSE(response, handlers);
        return; // Success, exit
      } catch (err: any) {
        handlers.onError(err);
        return;
      }
    }

    if (shouldTryFallback) {
      const fallbackModel = getFallbackNvidiaModel(currentModel);
      if (fallbackModel) {
        const fallbackLabel = NVIDIA_MODELS.find(m => m.id === fallbackModel)?.label || fallbackModel;
        // Notify the user of fallback behavior via stream token
        handlers.onToken(`\n\n> ⚠️ *[NVIDIA API: "${currentModel}" is busy/overloaded (503/429). Falling back to "${fallbackLabel}"...]*\n\n`);
        currentModel = fallbackModel;
        continue;
      }
    }

    handlers.onError(lastError || new Error("NVIDIA API request failed"));
    return;
  }
}

// ── Unified Master Entrypoints ─────────────────────────────────────────────

const API_BASE = (import.meta as any).env?.VITE_NEXO_API_URL ?? 'http://localhost:8787';

export async function streamAIResponse(
  messages: ChatMessage[],
  modelId: string,
  handlers: StreamHandlers,
  options?: { temperature?: number; maxTokens?: number; topP?: number }
): Promise<void> {
  let activeModel = modelId;

  // Fallback to DEFAULT_MODEL if the model ID is not in our supported list (e.g. from stale LocalStorage)
  const modelExists = NVIDIA_MODELS.some(m => m.id === activeModel);
  if (!modelExists) {
    activeModel = DEFAULT_MODEL;
  }

  if (activeModel === 'nexo-auto-router') {
    const taskType = detectTaskType(messages);
    activeModel = routeModelAutomatically(taskType);
    console.log(`[Auto Router] Routed task type "${taskType}" to model: ${activeModel}`);
  }

  const provider = getProviderForModel(activeModel);

  let tokenCount = 0;
  const wrappedHandlers: StreamHandlers = {
    onToken: (token) => {
      tokenCount++;
      handlers.onToken(token);
    },
    onDone: () => {
      const inputStr = messages.reduce((acc, m) => acc + m.content, '');
      const inputTokens = Math.ceil(inputStr.length / 4);

      fetch(`${API_BASE}/api/analytics/log-tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: activeModel,
          inputTokens,
          outputTokens: tokenCount
        })
      }).catch(() => {});

      handlers.onDone();
    },
    onError: (err) => {
      fetch(`${API_BASE}/api/analytics/log-error`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: err.message,
          stack: err.stack,
          source: 'client_ai_stream'
        })
      }).catch(() => {});

      handlers.onError(err);
    }
  };

  switch (provider) {
    case 'OpenAI':
      await streamOpenAI(messages, activeModel, wrappedHandlers, options);
      break;
    case 'Claude':
      await streamClaude(messages, activeModel, wrappedHandlers, options);
      break;
    case 'Gemini':
      await streamGemini(messages, activeModel, wrappedHandlers, options);
      break;
    case 'OpenRouter':
      await streamOpenRouter(messages, activeModel, wrappedHandlers, options);
      break;
    case 'Ollama':
      await streamOllama(messages, activeModel, wrappedHandlers, options);
      break;
    case 'DeepSeek':
      await streamDeepSeek(messages, activeModel, wrappedHandlers, options);
      break;
    case 'NVIDIA':
    default:
      await streamNvidiaResponseDirect(messages, activeModel, wrappedHandlers, options);
      break;
  }
}


// Keep signature compatible with previous version
export async function streamNvidiaResponse(
  messages: ChatMessage[],
  modelId: string,
  handlers: StreamHandlers,
  options?: { temperature?: number; maxTokens?: number; topP?: number }
): Promise<void> {
  return streamAIResponse(messages, modelId, handlers, options);
}

// ── Legacy Compatibility Wrapper ──────────────────────────────────────────
export type StreamTransport = 'nvidia' | 'sse' | 'websocket';

export async function streamAIResponseLegacy(
  _transport: StreamTransport,
  prompt: string,
  handlers: StreamHandlers,
  modelId?: string
): Promise<void> {
  await streamAIResponse(
    [{ role: 'user', content: prompt }],
    modelId ?? 'nexo-auto-router',
    handlers
  );
}
