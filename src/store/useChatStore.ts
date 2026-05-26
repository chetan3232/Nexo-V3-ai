import { create } from 'zustand';
import { streamAIResponse } from '@/services/aiStreamClient';
import { useMemoryStore } from '@/store/useMemoryStore';
import { upsertBackendMemory } from '@/services/memoryClient';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  tokens?: number;
  mentions?: string[];
};

type StreamMode = 'websocket' | 'sse';

type ChatState = {
  messages: ChatMessage[];
  input: string;
  isStreaming: boolean;
  model: string;
  streamMode: StreamMode;
  tokenUsage: number;
  setInput: (value: string) => void;
  setModel: (value: string) => void;
  setStreamMode: (value: StreamMode) => void;
  sendMessage: (context: string) => Promise<void>;
};

const MODELS = ['openrouter/claude-sonnet', 'gemini-2.5-pro', 'deepseek-chat', 'ollama/qwen2.5-coder'];

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [
    { id: 'm0', role: 'assistant', content: 'NEXO AI panel online. Mention files like @src/editor/CodeEditor.tsx.', model: MODELS[0], tokens: 16 },
  ],
  input: '',
  isStreaming: false,
  model: MODELS[0],
  streamMode: 'websocket',
  tokenUsage: 16,
  setInput: (value) => set({ input: value }),
  setModel: (value) => set({ model: value }),
  setStreamMode: (value) => set({ streamMode: value }),
  sendMessage: async (context) => {
    const { input, model, messages, streamMode, tokenUsage } = get();
    if (!input.trim()) return;

    const mentions = Array.from(input.matchAll(/@([\w./-]+)/g)).map((m) => m[1]);
    const userMessage: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: input, mentions };
    const assistantId = `a-${Date.now()}`;
    useMemoryStore.getState().upsertMemory({
      layer: 'conversation',
      title: `User request: ${input.slice(0, 42)}`,
      content: input,
      source: 'ai-chat',
      tags: ['chat', ...mentions],
    });
    void upsertBackendMemory({
      layer: 'conversation',
      title: `User request: ${input.slice(0, 42)}`,
      content: input,
      source: 'ai-chat',
      tags: ['chat', ...mentions],
    }).catch(() => undefined);

    set({
      input: '',
      isStreaming: true,
      messages: [...messages, userMessage, { id: assistantId, role: 'assistant', content: '', model, tokens: 0 }],
    });

    const synthetic = [
      `Using ${streamMode.toUpperCase()} stream.`,
      'Context injected:',
      context,
      'Planned actions:',
      '- inspect open files',
      '- analyze selected code',
      '- suggest patch with rationale',
    ].join('\n');

    await streamAIResponse(streamMode === 'sse' ? 'sse' : 'websocket', synthetic, {
      onToken: (chunk) => {
        set((state) => ({
          messages: state.messages.map((message) =>
            message.id === assistantId
              ? { ...message, content: `${message.content}${chunk}`, tokens: (message.tokens ?? 0) + Math.ceil(chunk.length / 4) }
              : message
          ),
        }));
      },
      onDone: () => undefined,
      onError: () => undefined,
    });

    const newTokens = Math.ceil((input.length + synthetic.length) / 4);
    useMemoryStore.getState().upsertMemory({
      layer: 'short',
      title: `AI response: ${input.slice(0, 42)}`,
      content: synthetic,
      source: 'ai-chat',
      tags: ['stream', model],
    });
    set({
      isStreaming: false,
      tokenUsage: tokenUsage + newTokens,
    });
  },
}));
