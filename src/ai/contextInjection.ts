import { useChatStore } from '@/store/useChatStore';
import { useEditorStore } from '@/store/useEditorStore';
import { useFileSystemStore } from '@/store/useFileSystemStore';
import { useMemoryStore } from '@/store/useMemoryStore';

type ContextPayload = {
  openFiles: string[];
  selectedCode: string;
  terminalLogs: string[];
  errors: string[];
  projectStructure: string[];
  memories: string[];
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
  };
}

export function formatContextForPrompt() {
  const payload = buildContextPayload();
  return [
    `open_files: ${payload.openFiles.join(', ') || 'none'}`,
    `selected_code: ${payload.selectedCode || 'none'}`,
    `terminal_logs: ${payload.terminalLogs.join(' | ')}`,
    `errors: ${payload.errors.join(' | ')}`,
    `project_structure: ${payload.projectStructure.join(', ')}`,
    `retrieved_memory: ${payload.memories.join(' | ') || 'none'}`,
  ].join('\n');
}

export async function sendContextualMessage() {
  const context = formatContextForPrompt();
  await useChatStore.getState().sendMessage(context);
}
