import { RetrievedMemory } from '@/memory/types';

export type AgentTaskStatus = 'pending' | 'running' | 'done' | 'error';

export type AgentTask = {
  id: string;
  title: string;
  status: AgentTaskStatus;
  file?: string;
  detail: string;
};

export type AgentPlan = {
  taskGraph: AgentTask[];
  filePlan: string[];
  dependencyPlan: string[];
};

export function createAgentPlan(goal: string, memories: RetrievedMemory[]): AgentPlan {
  const likelyFiles = Array.from(
    new Set(
      memories
        .map((memory) => memory.source)
        .filter((source): source is string => Boolean(source && source.includes('/')))
    )
  ).slice(0, 4);

  const filePlan = likelyFiles.length
    ? likelyFiles
    : ['src/editor/CodeEditor.tsx', 'src/store/useChatStore.ts', 'src/ai/contextInjection.ts'];

  return {
    taskGraph: [
      { id: 'think', title: 'Thinking', status: 'pending', detail: `Understand goal: ${goal}` },
      { id: 'plan', title: 'Planning', status: 'pending', detail: 'Create task graph, file plan, and dependency plan' },
      { id: 'edit', title: 'Editing file', status: 'pending', file: filePlan[0], detail: 'Prepare patch against the highest-impact file' },
      { id: 'test', title: 'Running tests', status: 'pending', detail: 'Run validation command and capture errors' },
      { id: 'fix', title: 'Fixing errors', status: 'pending', detail: 'Patch detected build/runtime failures and retry' },
    ],
    filePlan,
    dependencyPlan: ['zustand memory state', 'backend memory endpoints', 'streaming AI transport', 'editor file bindings'],
  };
}
