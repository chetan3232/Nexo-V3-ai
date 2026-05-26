import { motion, AnimatePresence } from 'framer-motion';
import { X, PanelLeftOpen, PanelLeftClose, Circle } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';

function getFileExtension(path: string) {
  return path.split('.').pop() ?? '';
}

function getFileLanguageColor(ext: string) {
  const colors: Record<string, string> = {
    tsx: '#61dafb',
    ts:  '#3178c6',
    jsx: '#f7df1e',
    js:  '#f7df1e',
    css: '#264de4',
    json:'#fbc02d',
    md:  '#a78bfa',
    py:  '#3572A5',
    rs:  '#dea584',
  };
  return colors[ext] ?? '#8b9ab2';
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
        alignItems: 'center',
        background: 'var(--bg-sidebar)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        height: 'var(--tab-h)',
      }}
    >
      {/* Sidebar toggle */}
      {onToggleSidebar && (
        <button
          className="icon-btn"
          onClick={onToggleSidebar}
          style={{ marginLeft: '4px', marginRight: '2px', flexShrink: 0 }}
          title="Toggle Sidebar"
        >
          <PanelLeftOpen size={15} />
        </button>
      )}

      {/* Tab strip */}
      <div className="tab-strip" style={{ flex: 1 }}>
        <AnimatePresence initial={false}>
          {openedFiles.map((tab) => {
            const isActive = activeFile === tab;
            const dirty = isDirty(tab);
            const name = getShortName(tab);
            const ext = getFileExtension(tab);
            const langColor = getFileLanguageColor(ext);

            return (
              <motion.div
                key={tab}
                layout
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.12 }}
                className={`tab-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveFile(tab)}
                id={`tab-${tab.replace(/[/.]/g, '-')}`}
              >
                {/* Language dot */}
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: langColor,
                    flexShrink: 0,
                    opacity: isActive ? 1 : 0.5,
                  }}
                />

                {/* File name */}
                <span className="tab-name" style={{ maxWidth: '130px' }}>
                  {name}
                </span>

                {/* Close / dirty indicator */}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    closeFile(tab);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.stopPropagation(); closeFile(tab); }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '16px',
                    height: '16px',
                    borderRadius: '3px',
                    marginLeft: '2px',
                    flexShrink: 0,
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'color 100ms, background 100ms',
                  }}
                  className="group/close hover:bg-[#2d3748] hover:!text-[color:var(--text-primary)]"
                >
                  {dirty ? (
                    <Circle
                      size={7}
                      fill="var(--text-secondary)"
                      stroke="none"
                      style={{ flexShrink: 0 }}
                    />
                  ) : (
                    <X size={12} />
                  )}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
