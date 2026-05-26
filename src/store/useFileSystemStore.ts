import { create } from 'zustand';
import { deleteWorkspacePath, fetchWorkspaceTree, renameWorkspacePath } from '@/services/fileSystemClient';

export type FileNode = {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  language?: string;
  gitStatus?: 'modified' | 'new' | 'clean';
  children?: FileNode[];
};

type FileSystemState = {
  tree: FileNode[];
  expanded: Record<string, boolean>;
  selectedPath: string | null;
  toggleExpanded: (path: string) => void;
  selectPath: (path: string) => void;
  renameNode: (path: string, nextName: string) => void;
  deleteNode: (path: string) => void;
  moveNode: (sourcePath: string, targetFolderPath: string) => void;
  syncFromBackend: () => Promise<void>;
  flattenPaths: () => string[];
};

const initialTree: FileNode[] = [
  {
    id: 'src',
    name: 'src',
    path: 'src',
    type: 'folder',
    children: [
      { id: 'src-editor', name: 'editor', path: 'src/editor', type: 'folder', children: [
        { id: 'src-editor-code', name: 'CodeEditor.tsx', path: 'src/editor/CodeEditor.tsx', type: 'file', language: 'typescript', gitStatus: 'modified' },
        { id: 'src-editor-ide', name: 'IdeWorkspace.tsx', path: 'src/editor/IdeWorkspace.tsx', type: 'file', language: 'typescript', gitStatus: 'modified' },
      ]},
      { id: 'src-ai', name: 'ai', path: 'src/ai', type: 'folder', children: [
        { id: 'src-ai-inline', name: 'inlineAssist.ts', path: 'src/ai/inlineAssist.ts', type: 'file', language: 'typescript', gitStatus: 'new' },
      ]},
      { id: 'src-runtime', name: 'runtime', path: 'src/runtime', type: 'folder', children: [
        { id: 'src-runtime-sandbox', name: 'sandbox.ts', path: 'src/runtime/sandbox.ts', type: 'file', language: 'typescript', gitStatus: 'clean' },
      ]},
    ],
  },
];

function walk(nodes: FileNode[], fn: (node: FileNode, parent: FileNode[] | null, index: number) => void, parent: FileNode[] | null = null) {
  nodes.forEach((node, index) => {
    fn(node, parent, index);
    if (node.children) walk(node.children, fn, node.children);
  });
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function joinPath(parentPath: string, name: string) {
  return parentPath ? `${parentPath}/${name}` : name;
}

function updateNodePath(node: FileNode, nextPath: string) {
  node.path = nextPath;
  node.id = nextPath;
  node.children?.forEach((child) => updateNodePath(child, joinPath(nextPath, child.name)));
}

export const useFileSystemStore = create<FileSystemState>((set, get) => ({
  tree: initialTree,
  expanded: { src: true, 'src/editor': true, 'src/ai': true },
  selectedPath: 'src/editor/CodeEditor.tsx',
  toggleExpanded: (path) => set((state) => ({ expanded: { ...state.expanded, [path]: !state.expanded[path] } })),
  selectPath: (path) => set({ selectedPath: path }),
  renameNode: (path, nextName) =>
    set((state) => {
      const nextTree = deepClone(state.tree);
      walk(nextTree, (node) => {
        if (node.path === path) {
          const parentPath = path.split('/').slice(0, -1).join('/');
          node.name = nextName;
          updateNodePath(node, joinPath(parentPath, nextName));
        }
      });
      const to = path.split('/').slice(0, -1).concat(nextName).join('/');
      void renameWorkspacePath(path, to).catch(() => undefined);
      return { tree: nextTree };
    }),
  deleteNode: (path) =>
    set((state) => {
      const nextTree = deepClone(state.tree);
      walk(nextTree, (node, parent, index) => {
        if (parent && node.path === path) {
          parent.splice(index, 1);
        }
      });
      void deleteWorkspacePath(path).catch(() => undefined);
      return { tree: nextTree, selectedPath: state.selectedPath === path ? null : state.selectedPath };
    }),
  moveNode: (sourcePath, targetFolderPath) =>
    set((state) => {
      if (sourcePath === targetFolderPath) return state;
      const nextTree = deepClone(state.tree);
      let moving: FileNode | null = null;
      walk(nextTree, (node, parent, index) => {
        if (parent && node.path === sourcePath) {
          moving = node;
          parent.splice(index, 1);
        }
      });
      if (!moving) return state;
      walk(nextTree, (node) => {
        if (node.path === targetFolderPath && node.type === 'folder') {
          node.children = node.children ?? [];
          updateNodePath(moving as FileNode, joinPath(node.path, (moving as FileNode).name));
          node.children.push(moving as FileNode);
        }
      });
      void renameWorkspacePath(sourcePath, joinPath(targetFolderPath, moving.name)).catch(() => undefined);
      return { tree: nextTree };
    }),
  syncFromBackend: async () => {
    const { tree } = await fetchWorkspaceTree();
    set({ tree });
  },
  flattenPaths: () => {
    const paths: string[] = [];
    walk(get().tree, (node) => {
      if (node.type === 'file') paths.push(node.path);
    });
    return paths;
  },
}));
