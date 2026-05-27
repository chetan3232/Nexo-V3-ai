import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  streamAIResponse,
  NVIDIA_MODELS,
  DEFAULT_MODEL,
  ChatMessage as ApiMessage,
} from '@/services/aiStreamClient';

export type ChatMessage = {
  id:      string;
  role:    'user' | 'assistant';
  content: string;
  model?:  string;
};

type ChatState = {
  messages:   ChatMessage[];
  input:      string;
  isStreaming: boolean;
  model:      string;
  error:      string | null;

  setInput:   (v: string) => void;
  setModel:   (v: string) => void;
  clearError: () => void;
  clearChat:  () => void;
  sendMessage: (context?: string, semanticMemories?: string) => Promise<void>;
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages:    [],
      input:       '',
      isStreaming:  false,
      model:        DEFAULT_MODEL,
      error:        null,

      setInput:   (v) => set({ input: v }),
      setModel:   (v) => set({ model: v }),
      clearError: ()  => set({ error: null }),
      clearChat:  ()  => set({ messages: [] }),

      sendMessage: async (context?: string, semanticMemories?: string) => {
        const { input, model, messages } = get();
        if (!input.trim() || get().isStreaming) return;

        const userText = context ? `${input}\n\n---\n${context}` : input;

        const userMsg: ChatMessage = {
          id:      `u-${Date.now()}`,
          role:    'user',
          content: input,  // display original input, not injected context
        };
        const assistantId = `a-${Date.now()}`;
        const assistantMsg: ChatMessage = {
          id:      assistantId,
          role:    'assistant',
          content: '',
          model,
        };

        set({
          input:       '',
          isStreaming:  true,
          error:        null,
          messages:    [...messages, userMsg, assistantMsg],
        });

        // Build conversation history for the API
        const systemPrompt = 'You are Nexo AI, an expert coding assistant built into a VS Code-style IDE. Be concise, precise, and developer-friendly. Format code in markdown code blocks.' +
          (semanticMemories ? `\n\n--- Semantic Memories ---\n${semanticMemories}` : '');

        const history: ApiMessage[] = [
          {
            role:    'system',
            content: systemPrompt,
          },
          // Send up to last 20 messages as context
          ...[...messages.slice(-20), userMsg].map((m) => ({
            role:    m.role as 'user' | 'assistant',
            content: m.id === userMsg.id ? userText : m.content,
          })),
        ];

        await streamAIResponse(history, model, {
          onToken: (chunk) => {
            set((state) => ({
              messages: state.messages.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + chunk }
                  : m
              ),
            }));
          },
          onDone: async () => {
            set({ isStreaming: false });
            try {
              const latestMessages = get().messages;
              const lastAssistantMsg = latestMessages.find((m) => m.id === assistantId);
              if (lastAssistantMsg && lastAssistantMsg.content) {
                const { useMemoryStore } = await import('@/store/useMemoryStore');
                
                const title = userMsg.content.length > 50 
                  ? userMsg.content.slice(0, 47) + '...' 
                  : userMsg.content;
                  
                const exchangeContent = `User Question: ${userMsg.content}\n\nAI Response: ${lastAssistantMsg.content}`;
                
                await useMemoryStore.getState().upsertMemory({
                  layer: 'conversation',
                  title: `Chat: ${title}`,
                  content: exchangeContent,
                  source: 'chat-panel',
                  tags: ['conversation', 'chat', model],
                });
              }
            } catch (e) {
              console.error('[Chat Store] Failed to save conversation memory:', e);
            }
          },
          onError: (err) => {
            set({
              isStreaming: false,
              error: err.message,
              messages: get().messages.map((m) =>
                m.id === assistantId
                  ? { ...m, content: `❌ Error: ${err.message}` }
                  : m
              ),
            });
          },
        });
      },
    }),
    {
      name: 'nexo-chat-v3',
      partialize: (s) => ({
        messages: s.messages.slice(-50),  // persist last 50 messages
        model:    s.model,
      }),
    }
  )
);
