// ── NVIDIA NIM API — OpenAI-compatible streaming client ───────────────────
const NVIDIA_BASE = 'https://integrate.api.nvidia.com/v1';
const NVIDIA_KEY  = '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';

export type StreamHandlers = {
  onToken: (token: string) => void;
  onDone:  () => void;
  onError: (error: Error) => void;
};

// Chat message format (OpenAI-compatible)
export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

// ── Curated model list from NVIDIA NIM (fetched 2026-05-27) ──────────────
export type ModelCategory = 'coding' | 'reasoning' | 'general' | 'vision' | 'mini';

export type NvidiaModel = {
  id: string;
  label: string;
  provider: string;
  category: ModelCategory;
  contextK?: number;
};

export const NVIDIA_MODELS: NvidiaModel[] = [
  // ── Coding ──
  { id: 'qwen/qwen3-coder-480b-a35b-instruct',    label: 'Qwen3 Coder 480B',         provider: 'Qwen',       category: 'coding',    contextK: 128 },
  { id: 'ibm/granite-34b-code-instruct',           label: 'Granite 34B Code',         provider: 'IBM',        category: 'coding',    contextK: 8   },
  { id: 'ibm/granite-8b-code-instruct',            label: 'Granite 8B Code',          provider: 'IBM',        category: 'coding',    contextK: 8   },
  { id: 'bigcode/starcoder2-15b',                  label: 'StarCoder2 15B',           provider: 'BigCode',    category: 'coding',    contextK: 16  },
  { id: 'meta/codellama-70b',                      label: 'Code Llama 70B',           provider: 'Meta',       category: 'coding',    contextK: 100 },
  { id: 'mistralai/codestral-22b-instruct-v0.1',   label: 'Codestral 22B',            provider: 'Mistral',    category: 'coding',    contextK: 32  },
  { id: 'deepseek-ai/deepseek-coder-6.7b-instruct',label: 'DeepSeek Coder 6.7B',      provider: 'DeepSeek',   category: 'coding',    contextK: 16  },

  // ── Reasoning / Flagship ──
  { id: 'nvidia/llama-3.1-nemotron-ultra-253b-v1', label: 'Nemotron Ultra 253B',      provider: 'NVIDIA',     category: 'reasoning', contextK: 128 },
  { id: 'nvidia/llama-3.3-nemotron-super-49b-v1.5',label: 'Nemotron Super 49B',       provider: 'NVIDIA',     category: 'reasoning', contextK: 128 },
  { id: 'nvidia/llama-3.3-nemotron-super-49b-v1',  label: 'Nemotron Super 49B v1',    provider: 'NVIDIA',     category: 'reasoning', contextK: 128 },
  { id: 'nvidia/llama-3.1-nemotron-70b-instruct',  label: 'Nemotron 70B',             provider: 'NVIDIA',     category: 'reasoning', contextK: 128 },
  { id: 'deepseek-ai/deepseek-v4-pro',             label: 'DeepSeek V4 Pro',          provider: 'DeepSeek',   category: 'reasoning', contextK: 64  },
  { id: 'deepseek-ai/deepseek-v4-flash',           label: 'DeepSeek V4 Flash',        provider: 'DeepSeek',   category: 'reasoning', contextK: 64  },
  { id: 'moonshotai/kimi-k2.6',                    label: 'Kimi K2.6',                provider: 'Moonshot',   category: 'reasoning', contextK: 128 },
  { id: 'minimaxai/minimax-m2.7',                  label: 'MiniMax M2.7',             provider: 'MiniMax',    category: 'reasoning', contextK: 32  },
  { id: 'qwen/qwen3.5-397b-a17b',                  label: 'Qwen3.5 397B',             provider: 'Qwen',       category: 'reasoning', contextK: 32  },
  { id: 'qwen/qwen3.5-122b-a10b',                  label: 'Qwen3.5 122B',             provider: 'Qwen',       category: 'reasoning', contextK: 32  },
  { id: 'openai/gpt-oss-120b',                     label: 'GPT OSS 120B',             provider: 'OpenAI',     category: 'reasoning', contextK: 128 },
  { id: 'z-ai/glm-5.1',                            label: 'GLM 5.1',                  provider: 'ZAI',        category: 'reasoning', contextK: 32  },
  { id: 'stepfun-ai/step-3.5-flash',               label: 'Step 3.5 Flash',           provider: 'StepFun',    category: 'reasoning', contextK: 32  },
  { id: 'nvidia/nemotron-3-super-120b-a12b',       label: 'Nemotron Super 120B',      provider: 'NVIDIA',     category: 'reasoning', contextK: 32  },

  // ── General / Instruction ──
  { id: 'meta/llama-4-maverick-17b-128e-instruct', label: 'Llama 4 Maverick 17B',     provider: 'Meta',       category: 'general',   contextK: 128 },
  { id: 'meta/llama-3.3-70b-instruct',             label: 'Llama 3.3 70B',            provider: 'Meta',       category: 'general',   contextK: 128 },
  { id: 'meta/llama-3.1-70b-instruct',             label: 'Llama 3.1 70B',            provider: 'Meta',       category: 'general',   contextK: 128 },
  { id: 'meta/llama-3.1-8b-instruct',              label: 'Llama 3.1 8B',             provider: 'Meta',       category: 'general',   contextK: 128 },
  { id: 'mistralai/mistral-large-3-675b-instruct-2512', label: 'Mistral Large 3 675B',provider: 'Mistral',    category: 'general',   contextK: 128 },
  { id: 'mistralai/mistral-large-2-instruct',      label: 'Mistral Large 2',          provider: 'Mistral',    category: 'general',   contextK: 128 },
  { id: 'mistralai/mistral-medium-3.5-128b',       label: 'Mistral Medium 3.5 128B',  provider: 'Mistral',    category: 'general',   contextK: 128 },
  { id: 'mistralai/mistral-small-4-119b-2603',     label: 'Mistral Small 4 119B',     provider: 'Mistral',    category: 'general',   contextK: 32  },
  { id: 'mistralai/mixtral-8x22b-v0.1',            label: 'Mixtral 8×22B',            provider: 'Mistral',    category: 'general',   contextK: 64  },
  { id: 'mistralai/mixtral-8x7b-instruct-v0.1',    label: 'Mixtral 8×7B',             provider: 'Mistral',    category: 'general',   contextK: 32  },
  { id: 'google/gemma-4-31b-it',                   label: 'Gemma 4 31B',              provider: 'Google',     category: 'general',   contextK: 128 },
  { id: 'google/gemma-3-12b-it',                   label: 'Gemma 3 12B',              provider: 'Google',     category: 'general',   contextK: 128 },
  { id: 'ai21labs/jamba-1.5-large-instruct',       label: 'Jamba 1.5 Large',          provider: 'AI21',       category: 'general',   contextK: 256 },
  { id: 'databricks/dbrx-instruct',                label: 'DBRX Instruct',            provider: 'Databricks', category: 'general',   contextK: 32  },
  { id: 'mistralai/mistral-nemotron',              label: 'Mistral Nemotron',         provider: 'Mistral',    category: 'general',   contextK: 128 },
  { id: 'mistralai/ministral-14b-instruct-2512',   label: 'Ministral 14B',            provider: 'Mistral',    category: 'general',   contextK: 32  },
  { id: 'writer/palmyra-creative-122b',            label: 'Palmyra Creative 122B',    provider: 'Writer',     category: 'general',   contextK: 32  },
  { id: '01-ai/yi-large',                          label: 'Yi Large',                 provider: '01.AI',      category: 'general',   contextK: 32  },
  { id: 'qwen/qwen3-next-80b-a3b-instruct',        label: 'Qwen3 Next 80B',           provider: 'Qwen',       category: 'general',   contextK: 32  },
  { id: 'bytedance/seed-oss-36b-instruct',         label: 'SEED OSS 36B',             provider: 'ByteDance',  category: 'general',   contextK: 32  },

  // ── Vision ──
  { id: 'meta/llama-3.2-90b-vision-instruct',      label: 'Llama 3.2 90B Vision',    provider: 'Meta',       category: 'vision',    contextK: 128 },
  { id: 'meta/llama-3.2-11b-vision-instruct',      label: 'Llama 3.2 11B Vision',    provider: 'Meta',       category: 'vision',    contextK: 128 },
  { id: 'microsoft/phi-4-multimodal-instruct',     label: 'Phi-4 Multimodal',        provider: 'Microsoft',  category: 'vision',    contextK: 128 },
  { id: 'nvidia/llama-3.1-nemotron-nano-vl-8b-v1', label: 'Nemotron Nano VL 8B',     provider: 'NVIDIA',     category: 'vision',    contextK: 32  },
  { id: 'nvidia/nemotron-nano-12b-v2-vl',          label: 'Nemotron Nano 12B VL',    provider: 'NVIDIA',     category: 'vision',    contextK: 32  },
  { id: 'google/gemma-3n-e4b-it',                  label: 'Gemma 3n E4B',            provider: 'Google',     category: 'vision',    contextK: 32  },

  // ── Mini / Fast ──
  { id: 'nvidia/llama-3.1-nemotron-nano-8b-v1',    label: 'Nemotron Nano 8B',        provider: 'NVIDIA',     category: 'mini',      contextK: 128 },
  { id: 'microsoft/phi-4-mini-instruct',           label: 'Phi-4 Mini',              provider: 'Microsoft',  category: 'mini',      contextK: 128 },
  { id: 'microsoft/phi-3.5-moe-instruct',          label: 'Phi-3.5 MoE',            provider: 'Microsoft',  category: 'mini',      contextK: 128 },
  { id: 'google/gemma-3-4b-it',                    label: 'Gemma 3 4B',              provider: 'Google',     category: 'mini',      contextK: 32  },
  { id: 'google/gemma-2-2b-it',                    label: 'Gemma 2 2B',              provider: 'Google',     category: 'mini',      contextK: 8   },
  { id: 'meta/llama-3.2-3b-instruct',              label: 'Llama 3.2 3B',            provider: 'Meta',       category: 'mini',      contextK: 128 },
  { id: 'meta/llama-3.2-1b-instruct',              label: 'Llama 3.2 1B',            provider: 'Meta',       category: 'mini',      contextK: 128 },
  { id: 'nvidia/nemotron-mini-4b-instruct',        label: 'Nemotron Mini 4B',        provider: 'NVIDIA',     category: 'mini',      contextK: 4   },
  { id: 'openai/gpt-oss-20b',                      label: 'GPT OSS 20B',             provider: 'OpenAI',     category: 'mini',      contextK: 128 },
  { id: 'nv-mistralai/mistral-nemo-12b-instruct',  label: 'Mistral Nemo 12B',        provider: 'NVIDIA×Mistral', category: 'mini', contextK: 128 },
  { id: 'nvidia/mistral-nemo-minitron-8b-8k-instruct', label: 'Minitron 8B',         provider: 'NVIDIA',     category: 'mini',      contextK: 8   },
];

// Default model
export const DEFAULT_MODEL = NVIDIA_MODELS[0].id; // qwen3-coder-480b

// ── NVIDIA NIM streaming (OpenAI-compatible SSE) ──────────────────────────
export async function streamNvidiaResponse(
  messages: ChatMessage[],
  modelId: string,
  handlers: StreamHandlers,
  options?: { temperature?: number; maxTokens?: number; topP?: number }
): Promise<void> {
  const { temperature = 0.6, maxTokens = 8192, topP = 0.95 } = options ?? {};

  let response: Response;
  try {
    response = await fetch(`${NVIDIA_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${NVIDIA_KEY}`,
      },
      body: JSON.stringify({
        model:       modelId,
        messages,
        temperature,
        top_p:       topP,
        max_tokens:  maxTokens,
        stream:      true,
      }),
    });
  } catch (err) {
    handlers.onError(new Error(`Network error: ${String(err)}`));
    return;
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    handlers.onError(new Error(`NVIDIA API ${response.status}: ${text}`));
    return;
  }

  if (!response.body) {
    handlers.onError(new Error('No response body'));
    return;
  }

  const reader  = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer    = '';

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
        if (data === '[DONE]') { handlers.onDone(); return; }

        try {
          const json = JSON.parse(data);
          const delta = json?.choices?.[0]?.delta;
          if (delta?.content) handlers.onToken(delta.content);
        } catch {
          // skip malformed lines
        }
      }
    }
  } catch (err) {
    handlers.onError(new Error(`Stream read error: ${String(err)}`));
    return;
  }

  handlers.onDone();
}

// ── Legacy compat (used by old store) ────────────────────────────────────
export type StreamTransport = 'nvidia' | 'sse' | 'websocket';

export async function streamAIResponse(
  _transport: StreamTransport,
  prompt: string,
  handlers: StreamHandlers,
  modelId?: string
): Promise<void> {
  await streamNvidiaResponse(
    [{ role: 'user', content: prompt }],
    modelId ?? DEFAULT_MODEL,
    handlers,
  );
}
