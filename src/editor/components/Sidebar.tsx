import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Search, ChevronDown, ChevronRight, FolderGit2, GitBranch, Bug, Package } from 'lucide-react';
import { useFileSystemStore } from '@/store/useFileSystemStore';
import { ExplorerTree } from './ExplorerTree';
import { AITeamPanel } from './AITeamPanel';
import { DebuggerPanel } from './DebuggerPanel';

type Props = {
  collapsed: boolean;
  activeTab: number;
  onToggleCanvas: () => void;
  isCanvasOpen: boolean;
};

const tabContent: Record<number, React.ReactNode> = {};

const sectionVariants = {
  hidden: { opacity: 0, x: -6 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.15 } },
};

export function Sidebar({ collapsed, activeTab, onToggleCanvas, isCanvasOpen }: Props) {
  const syncFromBackend = useFileSystemStore((state) => state.syncFromBackend);

  if (collapsed) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.aside
        key={activeTab}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        style={{
          height: '100%',
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* ── FILE EXPLORER ── */}
        {activeTab === 0 && (
          <>
            <div className="sidebar-section-header" style={{ paddingTop: '10px' }}>
              <span>Explorer</span>
              <div style={{ display: 'flex', gap: '2px' }}>
                <button
                  className="icon-btn"
                  onClick={() => void syncFromBackend().catch(() => undefined)}
                  title="Refresh"
                >
                  <RefreshCw size={13} />
                </button>
              </div>
            </div>

            {/* Project name */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 10px 2px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: 'var(--text-secondary)',
              }}
            >
              <ChevronDown size={12} />
              <FolderGit2 size={13} />
              <span>Nexo V3</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
              <ExplorerTree />
            </div>
          </>
        )}

        {/* ── SEARCH ── */}
        {activeTab === 1 && (
          <div style={{ padding: '10px 10px 0' }}>
            <div className="sidebar-section-header" style={{ padding: '0 0 8px' }}>
              <span>Search</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <input
                className="ide-input"
                placeholder="Search"
                style={{ width: '100%' }}
              />
              <input
                className="ide-input"
                placeholder="Replace"
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>Match Case</span>
                <span>·</span>
                <span>Regex</span>
                <span>·</span>
                <span>Whole Word</span>
              </div>
            </div>
          </div>
        )}

        {/* ── GIT / SOURCE CONTROL ── */}
        {activeTab === 2 && (
          <div style={{ padding: '10px 0 0' }}>
            <div className="sidebar-section-header">
              <span>Source Control</span>
            </div>
            <div style={{ padding: '8px 12px' }}>
              <div style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '8px 10px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <GitBranch size={13} />
                <span>codex/nexo-v3</span>
              </div>
              <div style={{ marginTop: '12px' }}>
                <div className="sidebar-section-header" style={{ padding: '0 0 4px' }}>
                  <span>Changes (3)</span>
                </div>
                {['IdeWorkspace.tsx', 'ActivityBar.tsx', 'globals.css'].map((file) => (
                  <div key={file} className="tree-row" style={{ gap: '8px' }}>
                    <span style={{ color: 'var(--amber)', fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-code)' }}>M</span>
                    <span style={{ fontSize: '12px' }}>{file}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── DEBUG ── */}
        {activeTab === 3 && (
          <div style={{ height: '100%', overflow: 'hidden' }}>
            <div className="sidebar-section-header" style={{ paddingTop: '10px' }}>
              <span>Run & Debug</span>
            </div>
            <DebuggerPanel />
          </div>
        )}

        {/* ── EXTENSIONS ── */}
        {activeTab === 4 && (
          <div style={{ padding: '10px 0 0' }}>
            <div className="sidebar-section-header">
              <span>Extensions</span>
            </div>
            <div style={{ padding: '6px 10px' }}>
              <input className="ide-input" placeholder="Search Extensions…" style={{ width: '100%' }} />
              <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <div className="sidebar-section-header" style={{ padding: '0 0 4px' }}>
                  <span>Installed</span>
                </div>
                {['Tailwind CSS IntelliSense', 'ESLint', 'Prettier', 'GitLens'].map((ext) => (
                  <div key={ext} className="tree-row">
                    <Package size={12} />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{ext}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── AI TOOLS ── */}
        {activeTab === 5 && (
          <div style={{ height: '100%', overflow: 'hidden' }}>
            <div className="sidebar-section-header" style={{ paddingTop: '10px' }}>
              <span>AI Team</span>
            </div>
            <AITeamPanel />
          </div>
        )}
      </motion.aside>
    </AnimatePresence>
  );
}
