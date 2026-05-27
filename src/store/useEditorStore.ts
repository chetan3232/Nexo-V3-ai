import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { writeWorkspaceFile } from '@/services/fileSystemClient';

export type EditorFile = {
  path: string;
  language: string;
  content: string;
  savedContent: string;
};

type EditorState = {
  files: Record<string, EditorFile>;
  openedFiles: string[];
  activeFile: string | null;
  splitFile: string | null;
  setActiveFile: (path: string) => void;
  openFile: (path: string) => void;
  closeFile: (path: string) => void;
  updateFileContent: (path: string, content: string) => void;
  saveFile: (path: string) => void;
  toggleSplitFile: () => void;
  markSaved: (path: string, content: string) => void;
  isDirty: (path: string) => boolean;
};

function detectLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() ?? '';
  const langMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    cjs: 'javascript',
    mjs: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    css: 'css',
    scss: 'scss',
    html: 'html',
    json: 'json',
    md: 'markdown',
    py: 'python',
    rs: 'rust',
    go: 'go',
    sh: 'shell',
    yaml: 'yaml',
    yml: 'yaml',
    sql: 'sql',
  };
  return langMap[ext] ?? 'plaintext';
}

const starterFiles: Record<string, EditorFile> = {
  'src/editor/CodeEditor.tsx': {
    path: 'src/editor/CodeEditor.tsx',
    language: 'typescript',
    content: `export function CodeEditor() {\n  return <div>Monaco Ready</div>;\n}\n`,
    savedContent: `export function CodeEditor() {\n  return <div>Monaco Ready</div>;\n}\n`,
  },
  'src/agents/planner.ts': {
    path: 'src/agents/planner.ts',
    language: 'typescript',
    content: `export const planner = async (goal: string) => {\n  return { goal, steps: ['analyze', 'plan', 'execute'] };\n};\n`,
    savedContent: `export const planner = async (goal: string) => {\n  return { goal, steps: ['analyze', 'plan', 'execute'] };\n};\n`,
  },
  'src/runtime/sandbox.ts': {
    path: 'src/runtime/sandbox.ts',
    language: 'typescript',
    content: `export async function runInSandbox(code: string) {\n  return { ok: true, output: code.length };\n}\n`,
    savedContent: `export async function runInSandbox(code: string) {\n  return { ok: true, output: code.length };\n}\n`,
  },
};

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      files: starterFiles,
      openedFiles: ['src/editor/CodeEditor.tsx'],
      activeFile: 'src/editor/CodeEditor.tsx',
      splitFile: null,
      setActiveFile: (path) => set({ activeFile: path }),
      openFile: (path) =>
        set((state) => {
          const exists = Boolean(state.files[path]);
          const language = detectLanguage(path);
          return {
            files: exists
              ? state.files
              : {
                  ...state.files,
                  [path]: {
                    path,
                    language,
                    content: `// ${path}\n`,
                    savedContent: `// ${path}\n`,
                  },
                },
            openedFiles: state.openedFiles.includes(path) ? state.openedFiles : [...state.openedFiles, path],
            activeFile: path,
          };
        }),
      closeFile: (path) =>
        set((state) => {
          const opened = state.openedFiles.filter((file) => file !== path);
          const nextActive = state.activeFile === path ? opened[opened.length - 1] ?? null : state.activeFile;
          return { openedFiles: opened, activeFile: nextActive, splitFile: state.splitFile === path ? null : state.splitFile };
        }),
      updateFileContent: (path, content) =>
        set((state) => ({
          files: {
            ...state.files,
            [path]: { ...state.files[path], content },
          },
        })),
      saveFile: (path) => {
        const content = get().files[path]?.content ?? '';
        void writeWorkspaceFile(path, content).catch(() => undefined);
        set((state) => ({
          files: {
            ...state.files,
            [path]: { ...state.files[path], savedContent: state.files[path].content },
          },
        }));
      },
      markSaved: (path, content) =>
        set((state) => ({
          files: {
            ...state.files,
            [path]: { ...state.files[path], content, savedContent: content },
          },
        })),
      toggleSplitFile: () => {
        const { activeFile, splitFile } = get();
        if (!activeFile) return;
        set({ splitFile: splitFile ? null : activeFile });
      },
      isDirty: (path) => {
        const file = get().files[path];
        return file ? file.content !== file.savedContent : false;
      },
    }),
    {
      name: 'nexo-editor-state-v3',
      partialize: (state) => ({
        files: state.files,
        openedFiles: state.openedFiles,
        activeFile: state.activeFile,
      }),
    }
  )
);
