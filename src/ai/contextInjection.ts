import { useChatStore } from '@/store/useChatStore';
import { useEditorStore } from '@/store/useEditorStore';
import { useFileSystemStore } from '@/store/useFileSystemStore';
import { useMemoryStore } from '@/store/useMemoryStore';
import { useProjectBrainStore } from '@/store/useProjectBrainStore';
import { useAiLearningStore } from '@/store/useAiLearningStore';

type ContextPayload = {
  openFiles: string[];
  selectedCode: string;
  terminalLogs: string[];
  errors: string[];
  projectStructure: string[];
  memories: string[];
  brainContext: string;
};

const mockTerminalLogs = [
  '[runtime] boot sequence complete',
  '[agent] planner connected',
  '[build] warning: bundle exceeds 500kb',
];

const mockErrors = ['No blocking runtime error detected'];

export function buildContextPayload(): ContextPayload {
  const editor = useEditorStore.getState();
  const fs = useFileSystemStore.getState();
  const chat = useChatStore.getState();
  const memory = useMemoryStore.getState();
  const brain = useProjectBrainStore.getState();

  const activePath = editor.activeFile;
  const selectedCode = activePath ? editor.files[activePath]?.content.slice(0, 500) ?? '' : '';
  const query = `${chat.input}\n${selectedCode}\n${editor.openedFiles.join(' ')}`;
  const memories = memory
    .retrieveRelevant(query, ['short', 'long', 'project', 'conversation', 'code'], 6)
    .map((entry) => `[${entry.layer}:${entry.score.toFixed(2)}] ${entry.title}: ${entry.content}`);

  return {
    openFiles: editor.openedFiles,
    selectedCode,
    terminalLogs: mockTerminalLogs,
    errors: mockErrors,
    projectStructure: fs.flattenPaths(),
    memories,
    brainContext: brain.getBrainContext(),
  };
}

export function formatContextForPrompt() {
  const payload = buildContextPayload();
  const lines = [
    `open_files: ${payload.openFiles.join(', ') || 'none'}`,
    `selected_code: ${payload.selectedCode || 'none'}`,
    `terminal_logs: ${payload.terminalLogs.join(' | ')}`,
    `errors: ${payload.errors.join(' | ')}`,
    `project_structure: ${payload.projectStructure.join(', ')}`,
    `retrieved_memory: ${payload.memories.join(' | ') || 'none'}`,
  ];

  // Inject Project Brain context if available
  if (payload.brainContext) {
    lines.push(payload.brainContext);
  }

  // Inject AI Learning observed style context if available
  const styleContext = useAiLearningStore.getState().getStyleContext();
  if (styleContext) {
    lines.push(styleContext);
  }

  return lines.join('\n');
}

export async function sendContextualMessage() {
  const context = formatContextForPrompt();
  await useChatStore.getState().sendMessage(context);
}

