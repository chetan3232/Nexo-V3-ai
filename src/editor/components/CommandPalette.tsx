import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, FileCode2, Settings, TerminalSquare, Sparkles,
  GitBranch, ChevronRight, Hash,
} from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { useFileSystemStore } from '@/store/useFileSystemStore';

type CommandItem = {
  id: string;
  label: string;
  category: string;
  icon: React.ElementType;
  action?: () => void;
  shortcut?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

export function CommandPalette({ open, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { openedFiles, openFile, setActiveFile } = useEditorStore();
  const tree = useFileSystemStore((s) => s.tree);
  const allFiles = useMemo(() => {
    const paths: string[] = [];
    const walk = (nodes: any[]) => {
      nodes.forEach((node) => {
        if (node.type === 'file') paths.push(node.path);
        if (node.children) walk(node.children);
      });
    };
    walk(tree);
    return paths;
  }, [tree]);

  // Reset when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const commands: CommandItem[] = [
    { id: 'new-file',    label: 'New File',           category: 'File',     icon: FileCode2,     shortcut: 'Ctrl+N' },
    { id: 'save-all',    label: 'Save All',           category: 'File',     icon: FileCode2,     shortcut: 'Ctrl+Shift+S' },
    { id: 'settings',    label: 'Open Settings',      category: 'Preferences', icon: Settings,   shortcut: 'Ctrl+,' },
    { id: 'terminal',    label: 'New Terminal',        category: 'Terminal', icon: TerminalSquare, shortcut: 'Ctrl+`' },
    { id: 'ai',          label: 'Ask Nexo AI',         category: 'AI',       icon: Sparkles,      shortcut: 'Ctrl+Shift+A' },
    { id: 'git-commit',  label: 'Git: Commit',         category: 'Git',      icon: GitBranch },
    { id: 'git-push',    label: 'Git: Push',           category: 'Git',      icon: GitBranch },
    ...allFiles.map((f) => ({
      id: `open-${f}`,
      label: f.split('/').pop() ?? f,
      category: 'Files',
      icon: FileCode2,
      action: () => { openFile(f); setActiveFile(f); },
    })),
  ];

  const filtered = query.trim()
    ? commands.filter(
        (cmd) =>
          cmd.label.toLowerCase().includes(query.toLowerCase()) ||
          cmd.category.toLowerCase().includes(query.toLowerCase())
      )
    : commands.slice(0, 10);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = filtered[selected];
      item?.action?.();
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Group by category
  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
    (acc[item.category] = acc[item.category] ?? []).push(item);
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 1000,
              backdropFilter: 'blur(2px)',
            }}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              top: '80px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '600px',
              maxWidth: '90vw',
              background: 'var(--bg-sidebar)',
              border: '1px solid var(--border-light)',
              borderRadius: '10px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
              zIndex: 1001,
              overflow: 'hidden',
            }}
          >
            {/* Search input */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <Search size={16} color="var(--text-muted)" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
                onKeyDown={handleKeyDown}
                placeholder="Search commands, files, symbols…"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  fontFamily: 'var(--font-ui)',
                }}
              />
              <kbd
                style={{
                  background: 'var(--border)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-code)',
                }}
              >
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
              {filtered.length === 0 ? (
                <div
                  style={{
                    padding: '24px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '13px',
                  }}
                >
                  No results for "{query}"
                </div>
              ) : (
                Object.entries(grouped).map(([category, items]) => (
                  <div key={category}>
                    <div
                      style={{
                        padding: '6px 14px 4px',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'var(--text-muted)',
                        background: 'var(--bg-base)',
                      }}
                    >
                      {category}
                    </div>
                    {items.map((item) => {
                      const Icon = item.icon;
                      const globalIdx = filtered.indexOf(item);
                      const isSelected = globalIdx === selected;
                      return (
                        <div
                          key={item.id}
                          onClick={() => { item.action?.(); onClose(); }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px 14px',
                            cursor: 'pointer',
                            background: isSelected ? 'var(--bg-selected)' : 'transparent',
                            transition: 'background 80ms',
                          }}
                        >
                          <Icon size={14} color={isSelected ? 'var(--accent)' : 'var(--text-muted)'} />
                          <span
                            style={{
                              flex: 1,
                              fontSize: '13px',
                              color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                            }}
                          >
                            {item.label}
                          </span>
                          {item.shortcut && (
                            <kbd
                              style={{
                                background: 'var(--border)',
                                border: '1px solid var(--border-light)',
                                borderRadius: '3px',
                                padding: '1px 5px',
                                fontSize: '10.5px',
                                color: 'var(--text-muted)',
                                fontFamily: 'var(--font-code)',
                              }}
                            >
                              {item.shortcut}
                            </kbd>
                          )}
                          {isSelected && <ChevronRight size={13} color="var(--text-muted)" />}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '6px 14px',
                borderTop: '1px solid var(--border)',
                fontSize: '11px',
                color: 'var(--text-muted)',
              }}
            >
              <span>↑↓ Navigate</span>
              <span>↵ Open</span>
              <span>ESC Close</span>
              <span style={{ marginLeft: 'auto' }}>{filtered.length} results</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
