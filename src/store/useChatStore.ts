import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  streamAIResponse,
  NVIDIA_MODELS,
  DEFAULT_MODEL,
  ChatMessage as ApiMessage,
} from '@/services/aiStreamClient';
import { useFileSystemStore } from './useFileSystemStore';

const API_BASE = import.meta.env.VITE_NEXO_API_URL ?? 'http://localhost:8787';

export type ChatMessage = {
  id:          string;
  role:        'user' | 'assistant';
  content:     string;
  model?:      string;
  created_at?: string;
  tokens_used?: number;
  attachments?: any[];
};

export type Conversation = {
  id:          string;
  project_id:  string;
  title:       string;
  model:       string;
  is_pinned:   boolean;
  is_favorite: boolean;
  created_at:  string;
  updated_at:  string;
};

type ChatState = {
  conversations:        Conversation[];
  activeConversationId: string | null;
  projectId:            string | null;
  messages:             ChatMessage[];
  input:                string;
  isStreaming:          boolean;
  streamingDraft:       string;
  model:                string;
  error:                string | null;

  setInput:                   (v: string) => void;
  setModel:                   (v: string) => void;
  clearError:                 () => void;
  clearChat:                  () => void;
  getOrResolveProjectId:      () => Promise<string | null>;
  loadConversations:          (targetProjectId?: string) => Promise<void>;
  selectConversation:         (conversationId: string | null) => Promise<void>;
  createConversation:         (selectedModel?: string) => Promise<string | null>;
  forkConversation:           (messageId: string, branchTitle?: string) => Promise<void>;
  renameConversation:         (id: string, title: string) => Promise<void>;
  deleteConversation:         (id: string) => Promise<void>;
  togglePinConversation:      (id: string, isPinned: boolean) => Promise<void>;
  toggleFavoriteConversation: (id: string, isFavorite: boolean) => Promise<void>;
  exportChat:                 (id: string) => string;
  importChat:                 (jsonContent: string) => Promise<boolean>;
  sendMessage:                (context?: string, semanticMemories?: string) => Promise<void>;
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations:        [],
      activeConversationId: null,
      projectId:            null,
      messages:             [],
      input:                '',
      isStreaming:          false,
      streamingDraft:       '',
      model:                DEFAULT_MODEL,
      error:                null,

      setInput:   (v) => set({ input: v }),
      setModel:   (v) => set({ model: v }),
      clearError: ()  => set({ error: null }),
      clearChat:  ()  => set({ messages: [] }),

      getOrResolveProjectId: async () => {
        const { workspacePath } = useFileSystemStore.getState();
        if (!workspacePath) return null;

        const currentProjectId = get().projectId;
        const currentActivePath = (get() as any).activeWorkspacePath;

        if (currentProjectId && currentActivePath === workspacePath) {
          return currentProjectId;
        }

        try {
          const response = await fetch(`${API_BASE}/api/projects/resolve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: workspacePath }),
          });

          if (response.ok) {
            const data = await response.json();
            const project = data.project;
            if (project?.id) {
              set({ projectId: project.id, activeWorkspacePath: workspacePath } as any);
              return project.id;
            }
          }
        } catch (e) {
          console.error('[Chat Store] Error resolving project ID:', e);
        }
        return null;
      },

      loadConversations: async (targetProjectId) => {
        let pId = targetProjectId;
        if (!pId) {
          pId = await get().getOrResolveProjectId() || undefined;
        }
        if (!pId) return;

        try {
          const response = await fetch(`${API_BASE}/api/conversations?project_id=${pId}`);
          if (response.ok) {
            const data = await response.json();
            const convs = data.conversations || [];
            set({ conversations: convs });

            const activeId = get().activeConversationId;
            const belongs = convs.some((c: any) => c.id === activeId);
            if (!belongs && convs.length > 0) {
              await get().selectConversation(convs[0].id);
            } else if (convs.length === 0) {
              set({ activeConversationId: null, messages: [] });
            }
          }
        } catch (e) {
          console.error('[Chat Store] Failed to load conversations:', e);
        }
      },

      selectConversation: async (conversationId) => {
        if (!conversationId) {
          set({ activeConversationId: null, messages: [], streamingDraft: '' });
          return;
        }

        try {
          const response = await fetch(`${API_BASE}/api/messages?conversation_id=${conversationId}`);
          if (response.ok) {
            const data = await response.json();
            const mapped: ChatMessage[] = (data.messages || []).map((m: any) => ({
              id:          m.id,
              role:        m.role as 'user' | 'assistant',
              content:     m.text,
              model:       m.model || get().model,
              created_at:  m.created_at,
              tokens_used: m.tokens_used,
              attachments: m.attachments || []
            }));

            // Check if there is an offline streaming draft cache to recover
            const savedDraft = localStorage.getItem(`nexo_chat_draft_${conversationId}`);

            set({
              activeConversationId: conversationId,
              messages:             mapped,
              streamingDraft:       savedDraft || ''
            });
          }
        } catch (e) {
          console.error('[Chat Store] Error selecting conversation:', e);
        }
      },

      createConversation: async (selectedModel) => {
        const pId = await get().getOrResolveProjectId();
        if (!pId) return null;

        const m = selectedModel || get().model;
        try {
          const response = await fetch(`${API_BASE}/api/conversations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              project_id: pId,
              title:      'New Conversation',
              model:      m
            })
          });

          if (response.ok) {
            const data = await response.json();
            const conv = data.conversation;
            set((state) => ({
              conversations:        [conv, ...state.conversations],
              activeConversationId: conv.id,
              messages:             [],
              streamingDraft:       ''
            }));
            return conv.id as string;
          }
        } catch (e) {
          console.error('[Chat Store] Failed to create conversation:', e);
        }
        return null;
      },

      forkConversation: async (messageId, branchTitle) => {
        const activeId = get().activeConversationId;
        if (!activeId) return;

        try {
          const response = await fetch(`${API_BASE}/api/conversations/${activeId}/fork`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
              forked_message_id: messageId,
              branch_title:      branchTitle
            })
          });

          if (response.ok) {
            const data = await response.json();
            const newConv = data.conversation;

            await get().loadConversations();
            await get().selectConversation(newConv.id);
          }
        } catch (e) {
          console.error('[Chat Store] Failed to fork conversation:', e);
        }
      },

      renameConversation: async (id, title) => {
        try {
          const response = await fetch(`${API_BASE}/api/conversations/${id}`, {
            method:  'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ title })
          });

          if (response.ok) {
            set((state) => ({
              conversations: state.conversations.map(c => c.id === id ? { ...c, title } : c)
            }));
          }
        } catch (e) {
          console.error('[Chat Store] Failed to rename conversation:', e);
        }
      },

      deleteConversation: async (id) => {
        try {
          const response = await fetch(`${API_BASE}/api/conversations/${id}`, {
            method: 'DELETE'
          });

          if (response.ok) {
            localStorage.removeItem(`nexo_chat_draft_${id}`);
            set((state) => {
              const nextConvs = state.conversations.filter(c => c.id !== id);
              let nextActive = state.activeConversationId;
              if (nextActive === id) {
                nextActive = nextConvs.length > 0 ? nextConvs[0].id : null;
              }
              return {
                conversations:        nextConvs,
                activeConversationId: nextActive
              };
            });

            const nextActiveId = get().activeConversationId;
            if (nextActiveId) {
              await get().selectConversation(nextActiveId);
            } else {
              set({ messages: [], streamingDraft: '' });
            }
          }
        } catch (e) {
          console.error('[Chat Store] Failed to delete conversation:', e);
        }
      },

      togglePinConversation: async (id, isPinned) => {
        try {
          const response = await fetch(`${API_BASE}/api/conversations/${id}`, {
            method:  'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ is_pinned: isPinned })
          });

          if (response.ok) {
            await get().loadConversations();
          }
        } catch (e) {
          console.error('[Chat Store] Failed to pin conversation:', e);
        }
      },

      toggleFavoriteConversation: async (id, isFavorite) => {
        try {
          const response = await fetch(`${API_BASE}/api/conversations/${id}`, {
            method:  'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ is_favorite: isFavorite })
          });

          if (response.ok) {
            await get().loadConversations();
          }
        } catch (e) {
          console.error('[Chat Store] Failed to favorite conversation:', e);
        }
      },

      exportChat: (id) => {
        const { conversations, messages } = get();
        const conv = conversations.find(c => c.id === id);
        if (!conv) return '';
        const exportData = {
          conversation: conv,
          messages:     messages
        };
        return JSON.stringify(exportData, null, 2);
      },

      importChat: async (jsonContent) => {
        try {
          const data = JSON.parse(jsonContent);
          const pId = await get().getOrResolveProjectId();
          if (!pId) return false;

          const convRes = await fetch(`${API_BASE}/api/conversations`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
              project_id: pId,
              title:      data.conversation?.title || 'Imported Conversation',
              model:      data.conversation?.model || get().model
            })
          });

          if (convRes.ok) {
            const convData = await convRes.json();
            const newConv = convData.conversation;

            if (Array.isArray(data.messages)) {
              for (const msg of data.messages) {
                await fetch(`${API_BASE}/api/messages`, {
                  method:  'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body:    JSON.stringify({
                    projectId:      pId,
                    senderId:       msg.sender_id || null,
                    role:           msg.role,
                    text:           msg.content || msg.text || '',
                    conversationId: newConv.id,
                    tokensUsed:     msg.tokens_used || 0
                  })
                });
              }
            }

            await get().loadConversations();
            await get().selectConversation(newConv.id);
            return true;
          }
        } catch (e) {
          console.error('[Chat Store] Failed to import chat:', e);
        }
        return false;
      },

      sendMessage: async (context, semanticMemories) => {
        const { input, model, messages } = get();
        if (!input.trim() || get().isStreaming) return;

        const pId = await get().getOrResolveProjectId();
        if (!pId) {
          set({ error: 'Workspace project ID not resolved' });
          return;
        }

        let activeId = get().activeConversationId;
        if (!activeId) {
          activeId = await get().createConversation(model);
          if (!activeId) {
            set({ error: 'Failed to initialize conversation' });
            return;
          }
        }

        const userText = context ? `${input}\n\n---\n${context}` : input;

        // Create UI message entities immediately
        const userMsg: ChatMessage = {
          id:      `u-${Date.now()}`,
          role:    'user',
          content: input,
        };
        const assistantId = `a-${Date.now()}`;
        const assistantMsg: ChatMessage = {
          id:      assistantId,
          role:    'assistant',
          content: '',
          model,
        };

        set({
          input:          '',
          isStreaming:     true,
          error:           null,
          messages:       [...messages, userMsg, assistantMsg],
          streamingDraft: ''
        });

        // 1. Post user message to backend
        try {
          await fetch(`${API_BASE}/api/messages`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
              projectId:      pId,
              role:           'user',
              text:           input,
              conversationId: activeId
            })
          });
        } catch (e) {
          console.error('[Chat Store] Failed to save user message to backend:', e);
        }

        // Build AI system prompts and history
        const systemPrompt = 'You are Nexo AI, an expert coding assistant built into a VS Code-style IDE. Be concise, precise, and developer-friendly. Format code in markdown code blocks.' +
          (semanticMemories ? `\n\n--- Semantic Memories ---\n${semanticMemories}` : '');

        const history: ApiMessage[] = [
          {
            role:    'system',
            content: systemPrompt,
          },
          ...[...messages.slice(-20), userMsg].map((m) => ({
            role:    m.role as 'user' | 'assistant',
            content: m.id === userMsg.id ? userText : m.content,
          })),
        ];

        // 2. Stream Response
        await streamAIResponse(history, model, {
          onToken: (chunk) => {
            const currentDraft = get().streamingDraft + chunk;
            set({ streamingDraft: currentDraft });
            localStorage.setItem(`nexo_chat_draft_${activeId}`, currentDraft);

            set((state) => ({
              messages: state.messages.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + chunk }
                  : m
              ),
            }));
          },
          onDone: async () => {
            const finalDraft = get().streamingDraft;
            set({ isStreaming: false, streamingDraft: '' });
            localStorage.removeItem(`nexo_chat_draft_${activeId}`);

            // A. Post Assistant message to backend
            try {
              await fetch(`${API_BASE}/api/messages`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({
                  projectId:      pId,
                  role:           'assistant',
                  text:           finalDraft,
                  conversationId: activeId
                })
              });

              // B. Save to memory layer
              const { useMemoryStore } = await import('@/store/useMemoryStore');
              const titleSummary = userMsg.content.length > 50
                ? userMsg.content.slice(0, 47) + '...'
                : userMsg.content;
              const exchangeContent = `User Question: ${userMsg.content}\n\nAI Response: ${finalDraft}`;

              await useMemoryStore.getState().upsertMemory({
                layer:   'conversation',
                title:   `Chat: ${titleSummary}`,
                content: exchangeContent,
                source:  'chat-panel',
                tags:    ['conversation', 'chat', model],
              });
            } catch (e) {
              console.error('[Chat Store] Failed to save assistant message/memory:', e);
            }

            // C. Trigger smart summary title if it was named "New Conversation"
            const currentConvs = get().conversations;
            const activeConv = currentConvs.find(c => c.id === activeId);
            if (activeConv && (activeConv.title === 'New Conversation' || activeConv.title === 'Untitled Chat')) {
              try {
                const titlePrompt = `Task: Summarize the user's coding query into a concise title of 3-5 words. Do not use quotes or punctuation. Return ONLY the title and nothing else.\n\nQuery: "${userMsg.content}"`;
                let generatedTitle = '';
                
                await streamAIResponse([
                  { role: 'system', content: 'You are a precise title generator. Return only a 3-5 word summary of the user prompt without quotes or preamble.' },
                  { role: 'user', content: titlePrompt }
                ], model, {
                  onToken: (chunk) => {
                    generatedTitle += chunk;
                  },
                  onDone: async () => {
                    const cleanTitle = generatedTitle.trim().replace(/^["']|["']$/g, '').slice(0, 40) || 'AI Chat';
                    await get().renameConversation(activeId!, cleanTitle);
                  },
                  onError: () => {}
                });
              } catch (e) {
                console.error('[Chat Store] Failed to generate smart title:', e);
              }
            }
          },
          onError: (err) => {
            localStorage.removeItem(`nexo_chat_draft_${activeId}`);
            set({
              isStreaming: false,
              streamingDraft: '',
              error:       err.message,
              messages:    get().messages.map((m) =>
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
        activeConversationId: s.activeConversationId,
        model:                s.model,
      }),
    }
  )
);
