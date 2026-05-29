import { create } from 'zustand';
import { streamAIResponse, ChatMessage } from '@/services/aiStreamClient';

export type TeamAgent = 'frontend' | 'backend' | 'security' | 'ui' | 'cto';

export type TeamMessage = {
  id: string;
  agent: TeamAgent;
  avatar: string;
  name: string;
  content: string;
  timestamp: number;
  isStreaming: boolean;
};

type TeamRoomState = {
  messages: TeamMessage[];
  isDiscussing: boolean;
  goal: string;
  setGoal: (goal: string) => void;
  startDiscussion: (goal: string) => Promise<void>;
  clearDiscussion: () => void;
};

export const TEAM_AGENT_CONFIGS: Record<TeamAgent, { name: string; avatar: string; prompt: string }> = {
  frontend: {
    name: 'Frontend Architect',
    avatar: '🎨',
    prompt: 'You are the Frontend Architect. Review the goal and propose React component structures, styling approaches, and state management logic. Keep your answer brief and professional.'
  },
  backend: {
    name: 'Backend Systems Engineer',
    avatar: '⚙️',
    prompt: 'You are the Backend Systems Engineer. Propose API endpoints, data flow, database changes, and integration patterns. Reference any ideas mentioned by the Frontend Architect. Keep your answer brief.'
  },
  security: {
    name: 'Security Officer',
    avatar: '🛡️',
    prompt: 'You are the Security Officer. Audit the proposed frontend/backend structures for XSS, credentials leakage, injection vulnerabilities, and API authentication gaps. Keep it brief.'
  },
  ui: {
    name: 'UI/UX Specialist',
    avatar: '🖌️',
    prompt: 'You are the UI/UX Specialist. Refine components with glassmorphism aesthetics, responsive layouts, and modern transitions. Keep it brief.'
  },
  cto: {
    name: 'CTO Decision Maker',
    avatar: '🧠',
    prompt: 'You are the CTO Decision Maker. Review the debate outputs of Frontend, Backend, Security, and UI. Synthesize them and outline the final implementation path. Keep it brief and actionable.'
  }
};

export const useTeamRoomStore = create<TeamRoomState>((set, get) => ({
  messages: [],
  isDiscussing: false,
  goal: '',

  setGoal: (goal) => set({ goal }),
  clearDiscussion: () => set({ messages: [], isDiscussing: false }),

  startDiscussion: async (goal: string) => {
    set({ goal, isDiscussing: true, messages: [] });

    const agents: TeamAgent[] = ['frontend', 'backend', 'security', 'ui', 'cto'];
    let currentContext = `User Goal: "${goal}"\n\nDiscussion Thread:\n`;

    for (const agentKey of agents) {
      const config = TEAM_AGENT_CONFIGS[agentKey];
      const messageId = `team-msg-${agentKey}-${Date.now()}`;

      // Insert loading streaming message
      set((s) => ({
        messages: [
          ...s.messages,
          {
            id: messageId,
            agent: agentKey,
            avatar: config.avatar,
            name: config.name,
            content: '',
            timestamp: Date.now(),
            isStreaming: true
          }
        ]
      }));

      try {
        const messagesToSend: ChatMessage[] = [
          { role: 'system', content: config.prompt },
          { role: 'user', content: `${currentContext}\nGoal: "${goal}". Provide your feedback.` }
        ];

        let responseText = '';
        await streamAIResponse(
          messagesToSend,
          'nexo-auto-router',
          {
            onToken: (token) => {
              responseText += token;
              set((s) => ({
                messages: s.messages.map((m) =>
                  m.id === messageId ? { ...m, content: responseText } : m
                )
              }));
            },
            onDone: () => {},
            onError: (err) => {
              console.error(`[TeamRoom] Error in agent ${agentKey}:`, err);
            }
          }
        );

        // Turn off streaming status
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === messageId ? { ...m, isStreaming: false } : m
          )
        }));

        currentContext += `[${config.name} (${agentKey.toUpperCase()})]: ${responseText}\n\n`;

      } catch (err) {
        console.error(`Roundtable agent fail: ${agentKey}`, err);
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === messageId ? { ...m, content: 'Failed to retrieve agent report.', isStreaming: false } : m
          )
        }));
      }
    }

    set({ isDiscussing: false });
  }
}));
