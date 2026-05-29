import { create } from 'zustand';
import { streamAIResponse, ChatMessage } from '@/services/aiStreamClient';
import { useFileSystemStore } from './useFileSystemStore';

export type TalkMessage = {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  matchedFiles?: string[];
  timestamp: number;
};

type ProjectTalkState = {
  messages: TalkMessage[];
  isThinking: boolean;
  askProject: (query: string) => Promise<void>;
  clearHistory: () => void;
};

export const useProjectTalkStore = create<ProjectTalkState>((set, get) => ({
  messages: [],
  isThinking: false,

  clearHistory: () => set({ messages: [] }),

  askProject: async (query: string) => {
    if (!query.trim()) return;

    const userMsg: TalkMessage = {
      id: `talk-user-${Date.now()}`,
      sender: 'user',
      content: query,
      timestamp: Date.now()
    };

    set((s) => ({
      messages: [...s.messages, userMsg],
      isThinking: true
    }));

    const fsStore = useFileSystemStore.getState();
    const flatPaths = fsStore.flattenPaths();

    const systemPrompt = `You are Nexo Project Conversation Assistant. Your job is to answer questions about the workspace files structure.
You have access to the complete flat file listings of the project:
${JSON.stringify(flatPaths.slice(0, 100))}

Provide:
1. A direct, concise explanation mapping what files implement the queried feature/logic.
2. Under a section labeled "Files Checked:", list the relative paths of the files (one per line, start with "- " and enclose file path in backticks, e.g. "- \`src/App.tsx\`").

Format clearly in markdown.`;

    const assistantMsgId = `talk-ass-${Date.now()}`;
    set((s) => ({
      messages: [
        ...s.messages,
        {
          id: assistantMsgId,
          sender: 'assistant',
          content: '',
          timestamp: Date.now()
        }
      ]
    }));

    try {
      const messagesToSend: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ];

      let responseText = '';
      await streamAIResponse(
        messagesToSend,
        'nexo-auto-router',
        {
          onToken: (tok) => {
            responseText += tok;
            set((s) => ({
              messages: s.messages.map((m) =>
                m.id === assistantMsgId ? { ...m, content: responseText } : m
              )
            }));
          },
          onDone: () => {
            // Extract files list from the response
            const matchedFiles: string[] = [];
            const lines = responseText.split('\n');
            lines.forEach((line) => {
              const fileMatch = line.match(/-\s*`([^`]+)`/);
              if (fileMatch && flatPaths.includes(fileMatch[1])) {
                matchedFiles.push(fileMatch[1]);
              }
            });

            set((s) => ({
              messages: s.messages.map((m) =>
                m.id === assistantMsgId ? { ...m, matchedFiles } : m
              ),
              isThinking: false
            }));
          },
          onError: (err) => {
            set((s) => ({
              messages: s.messages.map((m) =>
                m.id === assistantMsgId ? { ...m, content: `Error: ${err.message}` } : m
              ),
              isThinking: false
            }));
          }
        }
      );
    } catch (e: any) {
      set((s) => ({
        messages: s.messages.map((m) =>
          m.id === assistantMsgId ? { ...m, content: `Failed: ${e.message}` } : m
        ),
        isThinking: false
      }));
    }
  }
}));
