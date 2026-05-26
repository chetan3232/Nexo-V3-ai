import { useState } from 'react';
import { Check, ChevronDown, ChevronRight, FileCode2, FileJson2, Folder, FolderOpen, GripVertical, Pencil, Trash2 } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { FileNode, useFileSystemStore } from '@/store/useFileSystemStore';
import { readWorkspaceFile } from '@/services/fileSystemClient';

function fileIcon(name: string) {
  if (name.endsWith('.json')) return <FileJson2 className="h-3.5 w-3.5 text-amber-300" />;
  return <FileCode2 className="h-3.5 w-3.5 text-cyan-300" />;
}

function gitBadge(status?: FileNode['gitStatus']) {
  if (status === 'modified') return <span className="text-[10px] text-amber-300">M</span>;
  if (status === 'new') return <span className="text-[10px] text-emerald-300">A</span>;
  return <span className="text-[10px] text-slate-500">.</span>;
}

function TreeRow({ node, level }: { node: FileNode; level: number }) {
  const { expanded, toggleExpanded, renameNode, deleteNode, moveNode, selectPath, selectedPath } = useFileSystemStore();
  const { markSaved, openFile } = useEditorStore();
  const [renameMode, setRenameMode] = useState(false);
  const [nextName, setNextName] = useState(node.name);

  const isFolder = node.type === 'folder';
  const isOpen = expanded[node.path];

  return (
    <li>
      <div
        draggable
        onDragStart={(e) => e.dataTransfer.setData('text/path', node.path)}
        onDragOver={(e) => isFolder && e.preventDefault()}
        onDrop={(e) => {
          if (!isFolder) return;
          const source = e.dataTransfer.getData('text/path');
          moveNode(source, node.path);
        }}
        className={`group flex items-center gap-1 rounded px-2 py-1 text-xs ${selectedPath === node.path ? 'bg-cyan-500/20 text-cyan-100' : 'text-slate-300 hover:bg-cyan-500/10'}`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        <GripVertical className="h-3 w-3 opacity-30" />
        {isFolder ? (
          <button onClick={() => toggleExpanded(node.path)}>{isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}</button>
        ) : (
          <span className="w-3.5" />
        )}

        {isFolder ? (isOpen ? <FolderOpen className="h-3.5 w-3.5 text-cyan-200" /> : <Folder className="h-3.5 w-3.5 text-cyan-200" />) : fileIcon(node.name)}

        {renameMode ? (
          <>
            <input value={nextName} onChange={(e) => setNextName(e.target.value)} className="w-28 rounded bg-slate-900 px-1 py-0.5 text-xs" />
            <button onClick={() => { renameNode(node.path, nextName); setRenameMode(false); }}><Check className="h-3.5 w-3.5 text-emerald-300" /></button>
          </>
        ) : (
          <button
            onClick={() => {
              selectPath(node.path);
              if (!isFolder) {
                openFile(node.path);
                void readWorkspaceFile(node.path)
                  .then(({ content }) => markSaved(node.path, content))
                  .catch(() => undefined);
              }
              if (isFolder) toggleExpanded(node.path);
            }}
            className="truncate"
          >
            {node.name}
          </button>
        )}

        <span className="ml-auto">{!isFolder && gitBadge(node.gitStatus)}</span>
        <button onClick={() => setRenameMode(true)} className="opacity-0 group-hover:opacity-100"><Pencil className="h-3 w-3" /></button>
        <button onClick={() => deleteNode(node.path)} className="opacity-0 group-hover:opacity-100"><Trash2 className="h-3 w-3 text-rose-300" /></button>
      </div>

      {isFolder && isOpen && node.children?.length ? (
        <ul>
          {node.children.map((child) => (
            <TreeRow key={child.id} node={child} level={level + 1} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function ExplorerTree() {
  const { tree } = useFileSystemStore();

  return (
    <ul className="space-y-0.5">
      {tree.map((node) => (
        <TreeRow key={node.id} node={node} level={0} />
      ))}
    </ul>
  );
}
