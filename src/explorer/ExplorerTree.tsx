import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronRight, Folder, FolderOpen,
  Pencil, Trash2, Check, Search, FilePlus, FolderPlus, RefreshCw
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

// ── Inline Creation Row ──────────────────────────────────────────────────
function CreateNodeRow({
  level,
  type,
  onSave,
  onCancel,
}: {
  level: number;
  type: 'file' | 'folder';
  onSave: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (name.trim()) onSave(name.trim());
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        paddingLeft: `${level * 12 + 8}px`,
        paddingRight: '6px',
        paddingTop: '2px',
        paddingBottom: '2px',
        background: 'rgba(255,255,255,0.03)',
      }}
    >
      <span style={{ width: '14px', flexShrink: 0 }} />
      <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', marginRight: '2px' }}>
        {type === 'folder' ? (
          <Folder size={15} color="#e8a935" />
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M2 1h7l3 3v9H2V1z" fill="none" stroke="#6b7280" strokeWidth="1" />
            <path d="M9 1v3h3" fill="none" stroke="#6b7280" strokeWidth="1" />
          </svg>
        )}
      </span>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={type === 'folder' ? 'Folder name...' : 'File name...'}
        autoFocus
        style={{
          flex: 1,
          background: '#0d1117',
          border: '1px solid #3b82f6',
          borderRadius: '3px',
          color: '#e2e8f0',
          fontSize: '13px',
          padding: '1px 4px',
          outline: 'none',
        }}
      />
      <button
        onClick={() => name.trim() && onSave(name.trim())}
        style={{ background: 'none', border: 'none', padding: '0 2px', cursor: 'pointer' }}
      >
        <Check size={12} color="#22c55e" />
      </button>
    </div>
  );
}

type TreeRowProps = {
  node: FileNode;
  level: number;
  searchActive: boolean;
  renamingPath: string | null;
  setRenamingPath: (path: string | null) => void;
  createInput: { parentPath: string; type: 'file' | 'folder' } | null;
  setCreateInput: (val: { parentPath: string; type: 'file' | 'folder' } | null) => void;
  onContextMenu: (e: React.MouseEvent, node: FileNode) => void;
};

function TreeRow({
  node,
  level,
  searchActive,
  renamingPath,
  setRenamingPath,
  createInput,
  setCreateInput,
  onContextMenu,
}: TreeRowProps) {
  const { expanded, toggleExpanded, renameNode, deleteNode, moveNode, selectPath, selectedPath, createFile, createFolder } =
    useFileSystemStore();
  const { markSaved, openFile } = useEditorStore();
  const [nextName, setNextName] = useState(node.name);
  const [hovered, setHovered] = useState(false);

  const isFolder = node.type === 'folder';
  const isOpen = searchActive ? true : expanded[node.path];
  const selected = selectedPath === node.path;
  const renaming = renamingPath === node.path;

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

  const handleRenameSubmit = () => {
    if (nextName.trim() && nextName.trim() !== node.name) {
      renameNode(node.path, nextName.trim());
    }
    setRenamingPath(null);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      setNextName(node.name);
      setRenamingPath(null);
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
        onContextMenu={(e) => onContextMenu(e, node)}
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
              onKeyDown={handleRenameKeyDown}
              onBlur={handleRenameSubmit}
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
              onClick={(e) => { e.stopPropagation(); handleRenameSubmit(); }}
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
              onClick={(e) => { e.stopPropagation(); setRenamingPath(node.path); }}
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
        {isFolder && isOpen && (
          <motion.ul
            key="children"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            style={{ overflow: 'hidden', padding: 0, margin: 0 }}
          >
            {/* Inline creation input row if active for this folder */}
            {createInput && createInput.parentPath === node.path && (
              <CreateNodeRow
                level={level + 1}
                type={createInput.type}
                onSave={async (name) => {
                  if (createInput.type === 'file') {
                    await createFile(node.path, name);
                  } else {
                    await createFolder(node.path, name);
                  }
                  setCreateInput(null);
                }}
                onCancel={() => setCreateInput(null)}
              />
            )}
            {node.children?.map((child) => (
              <TreeRow
                key={child.id}
                node={child}
                level={level + 1}
                searchActive={searchActive}
                renamingPath={renamingPath}
                setRenamingPath={setRenamingPath}
                createInput={createInput}
                setCreateInput={setCreateInput}
                onContextMenu={onContextMenu}
              />
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </li>
  );
}

// Recursive file filtering algorithm
function filterFileTree(nodes: FileNode[], query: string): FileNode[] {
  if (!query.trim()) return nodes;
  const q = query.toLowerCase();

  return nodes
    .map((node) => {
      if (node.type === 'file') {
        return node.name.toLowerCase().includes(q) ? node : null;
      }
      const filteredChildren = node.children ? filterFileTree(node.children, query) : [];
      if (filteredChildren.length > 0 || node.name.toLowerCase().includes(q)) {
        return { ...node, children: filteredChildren };
      }
      return null;
    })
    .filter((n): n is FileNode => n !== null);
}

export function ExplorerTree() {
  const { tree, expanded, toggleExpanded, deleteNode, createFile, createFolder } = useFileSystemStore();
  const [query, setQuery] = useState('');

  // Creation and renaming parent states
  const [createInput, setCreateInput] = useState<{ parentPath: string; type: 'file' | 'folder' } | null>(null);
  const [renamingPath, setRenamingPath] = useState<string | null>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    node: FileNode | null;
  } | null>(null);

  const filteredTree = useMemo(() => {
    return filterFileTree(tree, query);
  }, [tree, query]);

  const searchActive = query.trim().length > 0;

  // Handle outside clicks to close context menu
  useEffect(() => {
    const handleOutsideClick = () => {
      if (contextMenu) {
        setContextMenu(null);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [contextMenu]);

  const handleContextMenu = (e: React.MouseEvent, node: FileNode | null) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      node,
    });
  };

  const triggerCreate = (parentPath: string, type: 'file' | 'folder') => {
    setContextMenu(null);
    if (parentPath && !expanded[parentPath]) {
      toggleExpanded(parentPath);
    }
    setCreateInput({ parentPath, type });
  };

  const triggerRename = (node: FileNode) => {
    setContextMenu(null);
    setRenamingPath(node.path);
  };

  return (
    <div
      onContextMenu={(e) => handleContextMenu(e, null)}
      style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '300px' }}
    >
      {/* ── File filter search panel ── */}
      <div style={{ padding: '2px 12px 10px', display: 'flex', gap: '4px', position: 'relative', flexShrink: 0 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter files (e.g. main.ts)"
          style={{
            width: '100%',
            background: '#0d1117',
            border: '1px solid #1f2937',
            borderRadius: '5px',
            color: '#e2e8f0',
            fontSize: '12px',
            padding: '4px 22px 4px 24px',
            outline: 'none',
            fontFamily: "'Inter', sans-serif",
            boxSizing: 'border-box',
          }}
        />
        {/* Search icon overlay */}
        <span style={{ position: 'absolute', left: '20px', top: '9px', color: '#4b5563', display: 'flex' }}>
          <Search size={12} />
        </span>
        {searchActive && (
          <button
            onClick={() => setQuery('')}
            style={{
              position: 'absolute',
              right: '18px',
              top: '8px',
              background: 'none',
              border: 'none',
              color: '#6b7280',
              cursor: 'pointer',
              fontSize: '11px',
              padding: '0 2px',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#c9d1d9'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#6b7280'; }}
          >
            ×
          </button>
        )}
      </div>

      {/* File Tree list scroll container */}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, overflowY: 'auto', flex: 1 }}>
        {/* Inline creation at Root Level */}
        {createInput && createInput.parentPath === '' && (
          <CreateNodeRow
            level={0}
            type={createInput.type}
            onSave={async (name) => {
              if (createInput.type === 'file') {
                await createFile('', name);
              } else {
                await createFolder('', name);
              }
              setCreateInput(null);
            }}
            onCancel={() => setCreateInput(null)}
          />
        )}

        {filteredTree.map((node) => (
          <TreeRow
            key={node.id}
            node={node}
            level={0}
            searchActive={searchActive}
            renamingPath={renamingPath}
            setRenamingPath={setRenamingPath}
            createInput={createInput}
            setCreateInput={setCreateInput}
            onContextMenu={handleContextMenu}
          />
        ))}
      </ul>

      {/* ── Sleek Glassmorphic Context Menu ── */}
      <AnimatePresence>
        {contextMenu && contextMenu.visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.08 }}
            style={{
              position: 'fixed',
              top: `${contextMenu.y}px`,
              left: `${contextMenu.x}px`,
              background: 'rgba(17, 24, 39, 0.92)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
              borderRadius: '6px',
              padding: '4px',
              zIndex: 1000,
              width: '140px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {contextMenu.node && contextMenu.node.type === 'folder' ? (
              <>
                <button
                  onClick={() => triggerCreate(contextMenu.node!.path, 'file')}
                  style={contextMenuItemStyle}
                >
                  <FilePlus size={13} />
                  <span>New File</span>
                </button>
                <button
                  onClick={() => triggerCreate(contextMenu.node!.path, 'folder')}
                  style={contextMenuItemStyle}
                >
                  <FolderPlus size={13} />
                  <span>New Folder</span>
                </button>
                <div style={contextMenuSeparatorStyle} />
              </>
            ) : null}

            {!contextMenu.node && (
              <>
                <button
                  onClick={() => triggerCreate('', 'file')}
                  style={contextMenuItemStyle}
                >
                  <FilePlus size={13} />
                  <span>New File (Root)</span>
                </button>
                <button
                  onClick={() => triggerCreate('', 'folder')}
                  style={contextMenuItemStyle}
                >
                  <FolderPlus size={13} />
                  <span>New Folder (Root)</span>
                </button>
                <div style={contextMenuSeparatorStyle} />
              </>
            )}

            {contextMenu.node && (
              <>
                <button
                  onClick={() => triggerRename(contextMenu.node!)}
                  style={contextMenuItemStyle}
                >
                  <Pencil size={13} />
                  <span>Rename</span>
                </button>
                <button
                  onClick={() => { setContextMenu(null); deleteNode(contextMenu.node!.path); }}
                  style={{ ...contextMenuItemStyle, color: '#f87171' }}
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>
              </>
            )}

            {!contextMenu.node && (
              <button
                onClick={() => { setContextMenu(null); useFileSystemStore.getState().syncFromBackend(); }}
                style={contextMenuItemStyle}
              >
                <RefreshCw size={13} />
                <span>Refresh Tree</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const contextMenuItemStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#e2e8f0',
  fontSize: '12px',
  padding: '6px 8px',
  borderRadius: '4px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  textAlign: 'left',
  width: '100%',
  transition: 'background 80ms',
  fontFamily: "'Inter', sans-serif",
};

// Simple hover behavior inside React context
const origStyle = contextMenuItemStyle;
document.addEventListener('mouseover', (e) => {
  const btn = (e.target as HTMLElement).closest('button');
  if (btn && btn.style.padding === '6px 8px') {
    btn.style.background = 'rgba(255, 255, 255, 0.08)';
  }
});
document.addEventListener('mouseout', (e) => {
  const btn = (e.target as HTMLElement).closest('button');
  if (btn && btn.style.padding === '6px 8px') {
    btn.style.background = 'none';
  }
});

const contextMenuSeparatorStyle: React.CSSProperties = {
  height: '1px',
  background: '#1f2937',
  margin: '3px 0',
};
