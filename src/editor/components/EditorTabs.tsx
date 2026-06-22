import { motion, AnimatePresence } from 'framer-motion';
import { X, Circle } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';

function FileTabIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';

  if (ext === 'tsx' || ext === 'jsx') {
    return (
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="2.2" fill="#61dafb" />
        <ellipse cx="7" cy="7" rx="5.5" ry="2.2" stroke="#61dafb" strokeWidth="1" fill="none" />
        <ellipse cx="7" cy="7" rx="5.5" ry="2.2" stroke="#61dafb" strokeWidth="1" fill="none" transform="rotate(60 7 7)" />
        <ellipse cx="7" cy="7" rx="5.5" ry="2.2" stroke="#61dafb" strokeWidth="1" fill="none" transform="rotate(-60 7 7)" />
      </svg>
    );
  }
  if (ext === 'ts') {
    return (
      <svg width="13" height="13" viewBox="0 0 14 14">
        <rect x="1" y="1" width="12" height="12" rx="2" fill="#3178c6" />
        <text x="2.2" y="10.5" fontSize="7" fontWeight="700" fill="white" fontFamily="monospace">TS</text>
      </svg>
    );
  }
  if (ext === 'css' || ext === 'scss') {
    return <span style={{ fontSize: '13px', color: '#a78bfa', fontWeight: 700, lineHeight: 1 }}>#</span>;
  }
  if (ext === 'json') {
    return <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 700, lineHeight: 1 }}>{'{}'}</span>;
  }
  if (ext === 'md') {
    return <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, lineHeight: 1 }}>M</span>;
  }
  return <span style={{ fontSize: '10px', color: '#6b7280', lineHeight: 1 }}>●</span>;
}

function getShortName(path: string) {
  return path.split('/').pop() ?? path;
}

type Props = {
  onToggleSidebar?: () => void;
};

export function EditorTabs({ onToggleSidebar }: Props) {
  const { openedFiles, activeFile, setActiveFile, closeFile, isDirty } = useEditorStore();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        background: 'var(--bg-sidebar)',
        borderBottom: '1px solid var(--border)',
        height: '35px',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <AnimatePresence initial={false}>
        {openedFiles.map((tab) => {
          const isActive = activeFile === tab;
          const dirty = isDirty(tab);
          const name = getShortName(tab);

          return (
            <motion.div
              key={tab}
              layout
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.12 }}
              onClick={() => setActiveFile(tab)}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0 12px',
                cursor: 'pointer',
                borderRight: '1px solid var(--border)',
                background: isActive ? 'var(--bg-base)' : 'var(--bg-sidebar)',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '13px',
                whiteSpace: 'nowrap',
                minWidth: '100px',
                maxWidth: '180px',
                transition: 'color 100ms, background 100ms',
                flexShrink: 0,
              }}
            >
              {/* Active top border line */}
              {isActive && (
                <span style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0,
                  height: '2px',
                  background: 'var(--accent)',
                }} />
              )}

              {/* File icon */}
              <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                <FileTabIcon name={name} />
              </span>

              {/* File name */}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                {name}
              </span>

              {/* Close/dirty button */}
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); closeFile(tab); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); closeFile(tab); } }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '16px',
                  height: '16px',
                  borderRadius: '3px',
                  flexShrink: 0,
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  opacity: isActive || dirty ? 1 : 0,
                  transition: 'opacity 100ms, background 100ms, color 100ms',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLSpanElement;
                  el.style.background = 'var(--bg-hover)';
                  el.style.color = 'var(--text-primary)';
                  el.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLSpanElement;
                  el.style.background = 'transparent';
                  el.style.color = 'var(--text-muted)';
                  if (!isActive && !dirty) el.style.opacity = '0';
                }}
              >
                {dirty
                  ? <Circle size={8} fill="var(--text-primary)" stroke="none" />
                  : <X size={13} />
                }
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
