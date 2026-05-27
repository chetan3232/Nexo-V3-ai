import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronRight, Folder, FolderOpen,
  Pencil, Trash2, Check, FilePlus, FolderPlus, RefreshCw,
  MoreHorizontal,
} from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { FileNode, useFileSystemStore } from '@/store/useFileSystemStore';
import { readWorkspaceFile } from '@/services/fileSystemClient';

// ── File icon system matching VS Code exactly ──────────────────────────────
function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';

  const iconMap: Record<string, { color: string; label: string }> = {
    tsx:  { color: '#61dafb', label: '⚛' },
    ts:   { color: '#3178c6', label: 'TS' },
    jsx:  { color: '#f7df1e', label: '⚛' },
    js:   { color: '#f7df1e', label: 'JS' },
    css:  { color: '#a78bfa', label: '#' },
    scss: { color: '#cc6699', label: '#' },
    json: { color: '#fbbf24', label: '{}' },
    md:   { color: '#94a3b8', label: 'M' },
    html: { color: '#e34c26', label: '</>' },
    py:   { color: '#3572A5', label: 'PY' },
    rs:   { color: '#dea584', label: 'RS' },
    go:   { color: '#00add8', label: 'GO' },
    env:  { color: '#6b7280', label: '⚙' },
    git:  { color: '#f05032', label: 'GIT' },
  };

  const config = iconMap[ext] ?? { color: '#6b7280', label: '·' };

  if (ext === 'tsx' || ext === 'jsx') {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="2.5" fill={config.color} />
        <ellipse cx="7" cy="7" rx="6" ry="2.5" stroke={config.color} strokeWidth="1" fill="none" />
        <ellipse cx="7" cy="7" rx="6" ry="2.5" stroke={config.color} strokeWidth="1" fill="none" transform="rotate(60 7 7)" />
        <ellipse cx="7" cy="7" rx="6" ry="2.5" stroke={config.color} strokeWidth="1" fill="none" transform="rotate(-60 7 7)" />
      </svg>
    );
  }

  if (ext === 'ts') {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14">
        <rect x="1" y="1" width="12" height="12" rx="2" fill="#3178c6" />
        <text x="2.5" y="10.5" fontSize="7" fontWeight="700" fill="white" fontFamily="monospace">TS</text>
      </svg>
    );
  }

  if (ext === 'css' || ext === 'scss') {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14">
        <text x="0" y="11" fontSize="10" fill={config.color} fontFamily="monospace" fontWeight="700">#</text>
      </svg>
    );
  }

  if (ext === 'json') {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14">
        <text x="0" y="11" fontSize="9" fill={config.color} fontFamily="monospace" fontWeight="600">{'{}'}</text>
      </svg>
    );
  }

  return (
    <svg width="14" height="14" viewBox="0 0 14 14">
      <path d="M2 1h7l3 3v9H2V1z" fill="none" stroke={config.color} strokeWidth="1" />
      <path d="M9 1v3h3" fill="none" stroke={config.color} strokeWidth="1" />
    </svg>
  );
}

function GitBadge({ status }: { status?: FileNode['gitStatus'] }) {
  if (!status || status === 'clean') return null;
  return (
    <span style={{
      fontSize: '11px',
      fontWeight: 700,
      color: status === 'modified' ? '#f59e0b' : '#22c55e',
      marginLeft: 'auto',
      paddingRight: '8px',
      flexShrink: 0,
    }}>
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
  const isOpen = expanded[node.path];
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
        onClick={handleClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          paddingLeft: `${level * 12 + 8}px`,
          paddingRight: '6px',
          paddingTop: '2px',
          paddingBottom: '2px',
          cursor: 'pointer',
          background: selected
            ? 'rgba(59,130,246,0.25)'
            : hovered
            ? 'rgba(255,255,255,0.05)'
            : 'transparent',
          color: selected ? '#e2e8f0' : '#c9d1d9',
          fontSize: '13px',
          userSelect: 'none',
          transition: 'background 80ms',
          borderLeft: selected ? '1px solid transparent' : '1px solid transparent',
        }}
      >
        {/* Chevron */}
        <span style={{ width: '14px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          {isFolder ? (
            isOpen
              ? <ChevronDown size={13} color="#6b7280" />
              : <ChevronRight size={13} color="#6b7280" />
          ) : null}
        </span>

        {/* Icon */}
        <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', marginRight: '2px' }}>
          {isFolder
            ? isOpen
              ? <FolderOpen size={15} color="#e8a935" />
              : <Folder size={15} color="#e8a935" />
            : <FileIcon name={node.name} />
          }
        </span>

        {/* Name / rename */}
        {renaming ? (
          <>
            <input
              value={nextName}
              onChange={(e) => setNextName(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              style={{
                flex: 1,
                background: '#1e3a5f',
                border: '1px solid #3b82f6',
                borderRadius: '3px',
                color: '#e2e8f0',
                fontSize: '13px',
                padding: '1px 4px',
                outline: 'none',
              }}
            />
            <button
              onClick={(e) => { e.stopPropagation(); renameNode(node.path, nextName); setRenaming(false); }}
              style={{ background: 'none', border: 'none', padding: '0 2px', cursor: 'pointer' }}
            >
              <Check size={12} color="#22c55e" />
            </button>
          </>
        ) : (
          <span style={{ flex: 1, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {node.name}
          </span>
        )}

        {/* Git badge */}
        {!isFolder && <GitBadge status={node.gitStatus} />}

        {/* Hover actions */}
        {hovered && !renaming && (
          <div style={{ display: 'flex', gap: '1px', flexShrink: 0, marginLeft: 'auto' }}>
            <button
              onClick={(e) => { e.stopPropagation(); setRenaming(true); }}
              style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', color: '#6b7280', borderRadius: '3px', display: 'flex' }}
              title="Rename"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); deleteNode(node.path); }}
              style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', color: '#6b7280', borderRadius: '3px', display: 'flex' }}
              title="Delete"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Children with animation */}
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
