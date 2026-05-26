import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronRight, Folder, FolderOpen, FileCode2, FileJson2,
  FileText, Pencil, Trash2, Check,
} from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { FileNode, useFileSystemStore } from '@/store/useFileSystemStore';
import { readWorkspaceFile } from '@/services/fileSystemClient';

function getFileIcon(name: string) {
  const ext = name.split('.').pop() ?? '';
  const colors: Record<string, string> = {
    tsx: '#61dafb', ts: '#3178c6', jsx: '#f7df1e', js: '#f7df1e',
    css: '#264de4', json: '#fbc02d', md: '#a78bfa', py: '#3572A5', rs: '#dea584',
  };
  const color = colors[ext] ?? '#8b9ab2';

  if (ext === 'json') return <FileJson2 size={14} color={color} />;
  if (ext === 'md' || ext === 'txt') return <FileText size={14} color={color} />;
  return <FileCode2 size={14} color={color} />;
}

function GitBadge({ status }: { status?: FileNode['gitStatus'] }) {
  if (!status || status === 'clean') return null;
  return (
    <span
      style={{
        fontSize: '10px',
        fontWeight: 700,
        fontFamily: 'var(--font-code)',
        color: status === 'modified' ? '#f59e0b' : '#22c55e',
        flexShrink: 0,
        marginLeft: 'auto',
        marginRight: '4px',
      }}
    >
      {status === 'modified' ? 'M' : 'A'}
    </span>
  );
}

function TreeRow({ node, level }: { node: FileNode; level: number }) {
  const { expanded, toggleExpanded, renameNode, deleteNode, moveNode, selectPath, selectedPath } =
    useFileSystemStore();
  const { markSaved, openFile } = useEditorStore();
  const [renaming, setRenaming] = useState(false);
  const [nextName, setNextName] = useState(node.name);
  const [hovered, setHovered] = useState(false);

  const isFolder = node.type === 'folder';
  const isOpen   = expanded[node.path];
  const selected = selectedPath === node.path;

  const handleClick = () => {
    selectPath(node.path);
    if (isFolder) {
      toggleExpanded(node.path);
    } else {
      openFile(node.path);
      void readWorkspaceFile(node.path)
        .then(({ content }) => markSaved(node.path, content))
        .catch(() => undefined);
    }
  };

  return (
    <li style={{ listStyle: 'none' }}>
      <div
        draggable
        onDragStart={(e) => e.dataTransfer.setData('text/path', node.path)}
        onDragOver={(e) => isFolder && e.preventDefault()}
        onDrop={(e) => {
          if (!isFolder) return;
          moveNode(e.dataTransfer.getData('text/path'), node.path);
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`tree-row ${selected ? 'selected' : ''}`}
        style={{ paddingLeft: `${level * 12 + 6}px` }}
        onClick={handleClick}
      >
        {/* Chevron for folders */}
        <span style={{ width: '14px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          {isFolder ? (
            isOpen
              ? <ChevronDown size={12} color="var(--text-muted)" />
              : <ChevronRight size={12} color="var(--text-muted)" />
          ) : null}
        </span>

        {/* Folder or file icon */}
        <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          {isFolder
            ? (isOpen
                ? <FolderOpen size={14} color="#60a5fa" />
                : <Folder size={14} color="#3b82f6" />
              )
            : getFileIcon(node.name)
          }
        </span>

        {/* Name / rename input */}
        {renaming ? (
          <>
            <input
              value={nextName}
              onChange={(e) => setNextName(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              style={{
                flex: 1,
                background: 'var(--bg-input)',
                border: '1px solid var(--border-focus)',
                borderRadius: '3px',
                color: 'var(--text-primary)',
                fontSize: '12px',
                padding: '1px 4px',
                fontFamily: 'var(--font-ui)',
                outline: 'none',
              }}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                renameNode(node.path, nextName);
                setRenaming(false);
              }}
              style={{ background: 'none', border: 'none', padding: '0 2px', cursor: 'pointer' }}
            >
              <Check size={12} color="var(--green)" />
            </button>
          </>
        ) : (
          <span
            style={{
              flex: 1,
              fontSize: '12.5px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {node.name}
          </span>
        )}

        {/* Git badge */}
        {!isFolder && <GitBadge status={node.gitStatus} />}

        {/* Hover actions */}
        {hovered && !renaming && (
          <div style={{ display: 'flex', gap: '1px', flexShrink: 0 }}>
            <button
              className="icon-btn"
              style={{ width: '18px', height: '18px' }}
              onClick={(e) => { e.stopPropagation(); setRenaming(true); }}
              title="Rename"
            >
              <Pencil size={11} />
            </button>
            <button
              className="icon-btn"
              style={{ width: '18px', height: '18px', color: '#ef4444' }}
              onClick={(e) => { e.stopPropagation(); deleteNode(node.path); }}
              title="Delete"
            >
              <Trash2 size={11} />
            </button>
          </div>
        )}
      </div>

      {/* Children */}
      <AnimatePresence initial={false}>
        {isFolder && isOpen && node.children?.length && (
          <motion.ul
            key="children"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            style={{ overflow: 'hidden', padding: 0, margin: 0 }}
          >
            {node.children.map((child) => (
              <TreeRow key={child.id} node={child} level={level + 1} />
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </li>
  );
}

export function ExplorerTree() {
  const { tree } = useFileSystemStore();
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {tree.map((node) => (
        <TreeRow key={node.id} node={node} level={0} />
      ))}
    </ul>
  );
}
