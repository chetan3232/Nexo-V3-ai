import { create } from 'zustand';
import { AgentPlan, AgentTask } from '@/agents/planningEngine';
import { useMemoryStore } from '@/store/useMemoryStore';

type AgentPhase = 'idle' | 'thinking' | 'planning' | 'editing' | 'testing' | 'fixing' | 'done' | 'error';

type AgentTaskState = {
  goal: string;
  phase: AgentPhase;
  plan: AgentPlan | null;
  logs: string[];
  setGoal: (goal: string) => void;
  runAutonomousTask: () => Promise<void>;
};

const API_BASE = import.meta.env.VITE_NEXO_API_URL ?? 'http://localhost:8787';
const WS_BASE = API_BASE.replace(/^http/, 'ws') + '/api/ws';

export const useAgentTaskStore = create<AgentTaskState>((set, get) => {
  let ws: WebSocket | null = null;

  return {
    goal: 'Wire memory retrieval into AI calls and validate build output.',
    phase: 'idle',
    plan: null,
    logs: [],
    setGoal: (goal) => set({ goal }),
    runAutonomousTask: async () => {
      const goal = get().goal.trim();
      if (!goal) return;

      const memory = useMemoryStore.getState();
      const memories = memory.retrieveRelevant(goal, ['project', 'code', 'conversation', 'long'], 5);

      // Close previous WebSocket if open
      if (ws) {
        try {
          ws.close();
        } catch (e) {
          // ignore
        }
      }

      set({
        phase: 'thinking',
        plan: null,
        logs: [
          `thinking: retrieved ${memories.length} relevant memories`,
          'Connecting to autonomous agent gateway...'
        ]
      });

      // Record goal in local memory
      memory.upsertMemory({
        layer: 'short',
        title: 'Current autonomous goal',
        content: goal,
        tags: ['agent', 'goal'],
        source: 'agent-task-panel',
      });

      ws = new WebSocket(WS_BASE);

      ws.onopen = () => {
        set((state) => ({
          phase: 'planning',
          logs: [...state.logs, 'Connected. Starting cognitive agent loop...']
        }));
        ws?.send(JSON.stringify({ type: 'agent_start', goal }));
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const { type, status, taskGraph, completed, currentTask } = payload;

          if (type === 'agent_status') {
            const mappedTasks: AgentTask[] = (taskGraph || []).map((t: any) => ({
              id: t.id,
              title: t.task,
              status: t.status === 'completed' ? 'done' : t.status === 'working' ? 'running' : 'pending',
              detail: t.task
            }));

            let activePhase: AgentPhase = 'planning';
            if (completed) {
              activePhase = 'done';
            } else if (status === 'working' && currentTask) {
              const lower = currentTask.toLowerCase();
              if (lower.includes('analyze') || lower.includes('think')) {
                activePhase = 'thinking';
              } else if (lower.includes('retrieve') || lower.includes('memory')) {
                activePhase = 'thinking';
              } else if (lower.includes('patch') || lower.includes('generate') || lower.includes('edit')) {
                activePhase = 'editing';
              } else if (lower.includes('sandbox') || lower.includes('test')) {
                activePhase = 'testing';
              } else if (lower.includes('deployment') || lower.includes('fix') || lower.includes('finalize')) {
                activePhase = 'fixing';
              }
            }

            set((state) => {
              const currentLogs = [...state.logs];
              if (currentTask) {
                currentLogs.push(`[Agent] ${currentTask}... (${status})`);
              }
              if (completed) {
                currentLogs.push('[Agent] Execution loop completed successfully.');
              }
              return {
                phase: completed ? 'done' : activePhase,
                plan: {
                  taskGraph: mappedTasks,
                  filePlan: state.plan?.filePlan ?? [
                    'src/editor/CodeEditor.tsx',
                    'src/store/useChatStore.ts',
                    'src/ai/contextInjection.ts'
                  ],
                  dependencyPlan: state.plan?.dependencyPlan ?? [
                    'zustand memory state',
                    'backend memory endpoints',
                    'streaming AI transport',
                    'editor file bindings'
                  ]
                },
                logs: currentLogs
              };
            });

            if (completed) {
              memory.upsertMemory({
                layer: 'long',
                title: 'Autonomous validation completed',
                content: `Goal validated: ${goal}`,
                tags: ['agent', 'validation'],
                source: 'agent-task-panel',
              });
            }
          }
        } catch (e) {
          // ignore
        }
      };

      ws.onerror = () => {
        set((state) => ({
          phase: 'error',
          logs: [...state.logs, 'Error: Failed to connect to agent WebSocket.']
        }));
      };

      ws.onclose = () => {
        set((state) => {
          if (state.phase !== 'done' && state.phase !== 'error') {
            return {
              phase: 'idle',
              logs: [...state.logs, 'Agent workspace session closed.']
            };
          }
          return state;
        });
      };
    }
  };
});

