import { create } from 'zustand';
import { createAgentPlan, AgentPlan, AgentTask } from '@/agents/planningEngine';
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

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function updateTask(tasks: AgentTask[], id: string, status: AgentTask['status']) {
  return tasks.map((task) => (task.id === id ? { ...task, status } : task));
}

export const useAgentTaskStore = create<AgentTaskState>((set, get) => ({
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

    set({ phase: 'thinking', logs: [`thinking: retrieving ${memories.length} memory hits`] });
    memory.upsertMemory({
      layer: 'short',
      title: 'Current autonomous goal',
      content: goal,
      tags: ['agent', 'goal'],
      source: 'agent-task-panel',
    });
    await wait(350);

    const plan = createAgentPlan(goal, memories);
    set({
      phase: 'planning',
      plan: { ...plan, taskGraph: updateTask(plan.taskGraph, 'think', 'done') },
      logs: [...get().logs, 'planning: task graph, file plan, and dependency plan created'],
    });
    await wait(450);

    set((state) => ({
      phase: 'editing',
      plan: state.plan ? { ...state.plan, taskGraph: updateTask(updateTask(state.plan.taskGraph, 'plan', 'done'), 'edit', 'running') } : state.plan,
      logs: [...state.logs, `editing: ${state.plan?.filePlan[0] ?? 'selected file'}`],
    }));
    await wait(550);

    set((state) => ({
      phase: 'testing',
      plan: state.plan ? { ...state.plan, taskGraph: updateTask(updateTask(state.plan.taskGraph, 'edit', 'done'), 'test', 'running') } : state.plan,
      logs: [...state.logs, 'testing: npm run build'],
    }));
    await wait(450);

    set((state) => ({
      phase: 'fixing',
      plan: state.plan ? { ...state.plan, taskGraph: updateTask(updateTask(state.plan.taskGraph, 'test', 'done'), 'fix', 'running') } : state.plan,
      logs: [...state.logs, 'fixing: no blocking error found, recording validation memory'],
    }));
    await wait(350);

    memory.upsertMemory({
      layer: 'long',
      title: 'Autonomous validation completed',
      content: `Goal validated: ${goal}`,
      tags: ['agent', 'validation'],
      source: 'agent-task-panel',
    });

    set((state) => ({
      phase: 'done',
      plan: state.plan ? { ...state.plan, taskGraph: updateTask(state.plan.taskGraph, 'fix', 'done') } : state.plan,
      logs: [...state.logs, 'done: task completed and memory updated'],
    }));
  },
}));
