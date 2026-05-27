import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, MoreHorizontal, FilePlus, FolderPlus,
  GitBranch, Search, Package, Bug,
} from 'lucide-react';
import { useFileSystemStore } from '@/store/useFileSystemStore';
import { ExplorerTree } from './ExplorerTree';
import { DebuggerPanel } from './DebuggerPanel';
import { AITeamPanel } from './AITeamPanel';

type Props = {
  collapsed: boolean;
  activeTab: number;
  onToggleCanvas: () => void;
  isCanvasOpen: boolean;
};

const sectionVariants = {
  hidden:  { opacity: 0, x: -4 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.15 } },
};

export function Sidebar({ collapsed, activeTab }: Props) {
  const { workspacePath, syncFromBackend, createFile, createFolder, openFolder } = useFileSystemStore();

  const handleOpenFolder = async () => {
    const isElectron = typeof window !== 'undefined' && !!(window as any).nexoDesktop;
    if (isElectron) {
      const selected = await (window as any).nexoDesktop.selectFolder();
      if (selected) {
        await openFolder(selected);
      }
    } else {
      const path = prompt("Enter local workspace directory path:");
      if (path) {
        await openFolder(path);
      }
    }
  };

  const handleCreateFileRoot = async () => {
    const name = prompt("Enter new file name (at root):");
    if (name?.trim()) {
      await createFile('', name.trim());
    }
  };

  const handleCreateFolderRoot = async () => {
    const name = prompt("Enter new folder name (at root):");
    if (name?.trim()) {
      await createFolder('', name.trim());
    }
  };

  const rootFolderName = workspacePath
    ? workspacePath.split(/[\\/]/).pop()?.toUpperCase()
    : 'MY-AWESOME-APP';

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
          background: '#111827',
          borderRight: '1px solid #1f2937',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* ── FILE EXPLORER ── */}
        {activeTab === 0 && (
          <>
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px 6px',
              flexShrink: 0,
            }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#c9d1d9',
              }}>
                Explorer
              </span>
              <div style={{ display: 'flex', gap: '2px' }}>
                {[FilePlus, FolderPlus, RefreshCw, MoreHorizontal].map((Icon, i) => {
                  const onClickHandler = 
                    i === 0 ? handleCreateFileRoot :
                    i === 1 ? handleCreateFolderRoot :
                    i === 2 ? () => void syncFromBackend().catch(() => undefined) :
                    handleOpenFolder;
                  
                  const titleText = 
                    i === 0 ? "New File (Root)" :
                    i === 1 ? "New Folder (Root)" :
                    i === 2 ? "Refresh Tree" :
                    "Open Workspace Folder";

                  return (
                    <button
                      key={i}
                      onClick={onClickHandler}
                      title={titleText}
                      style={{
                        background: 'none', border: 'none', padding: '3px',
                        cursor: 'pointer', color: '#4b5563', borderRadius: '4px',
                        display: 'flex', transition: 'color 100ms',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#4b5563'; }}
                    >
                      <Icon size={14} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Project section */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {/* Root folder label */}
              <div 
                onClick={handleOpenFolder}
                title="Change Workspace Folder"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px 3px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: '#c9d1d9',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.color = '#3b82f6'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.color = '#c9d1d9'; }}
              >
                <span style={{ fontSize: '10px', color: '#6b7280' }}>▾</span>
                <span>{rootFolderName}</span>
              </div>

              {/* File tree */}
              <ExplorerTree />
            </div>

            {/* Outline section */}
            <div style={{ borderTop: '1px solid #1f2937', flexShrink: 0 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: '#6b7280',
                cursor: 'pointer',
              }}>
                <span style={{ fontSize: '10px' }}>›</span>
                <span>OUTLINE</span>
              </div>
            </div>
            <div style={{ borderTop: '1px solid #1f2937', flexShrink: 0 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: '#6b7280',
                cursor: 'pointer',
              }}>
                <span style={{ fontSize: '10px' }}>›</span>
                <span>TIMELINE</span>
              </div>
            </div>
          </>
        )}

        {/* ── SEARCH ── */}
        {activeTab === 1 && (
          <div style={{ padding: '10px 12px 0' }}>
            <div style={{
              fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: '#c9d1d9', marginBottom: '10px',
            }}>
              Search
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <input
                placeholder="Search"
                style={{
                  width: '100%', background: '#0d1117', border: '1px solid #1f2937',
                  borderRadius: '5px', color: '#e2e8f0', fontSize: '13px',
                  padding: '5px 10px', outline: 'none', boxSizing: 'border-box',
                }}
              />
              <input
                placeholder="Replace"
                style={{
                  width: '100%', background: '#0d1117', border: '1px solid #1f2937',
                  borderRadius: '5px', color: '#e2e8f0', fontSize: '13px',
                  padding: '5px 10px', outline: 'none', boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#4b5563', marginTop: '2px' }}>
                <span style={{ cursor: 'pointer' }}>Aa</span>
                <span style={{ cursor: 'pointer' }}>.*</span>
                <span style={{ cursor: 'pointer' }}>W</span>
              </div>
            </div>
          </div>
        )}

        {/* ── SOURCE CONTROL ── */}
        {activeTab === 2 && (
          <div style={{ padding: '10px 0 0' }}>
            <div style={{
              fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: '#c9d1d9', padding: '0 14px 10px',
            }}>
              Source Control
            </div>
            <div style={{ padding: '0 12px' }}>
              <div style={{
                background: '#0d1117', border: '1px solid #1f2937', borderRadius: '6px',
                padding: '7px 10px', fontSize: '12px', color: '#9ca3af',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <GitBranch size={13} />
                <span>main</span>
              </div>
              <div style={{ marginTop: '14px' }}>
                <div style={{
                  fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em',
                  textTransform: 'uppercase', color: '#6b7280', marginBottom: '6px',
                }}>
                  Changes (3)
                </div>
                {['IdeWorkspace.tsx', 'ActivityBar.tsx', 'globals.css'].map((f) => (
                  <div key={f} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '4px 6px', fontSize: '12.5px', color: '#9ca3af',
                    cursor: 'pointer', borderRadius: '4px',
                  }}>
                    <span style={{ color: '#f59e0b', fontSize: '11px', fontWeight: 700, fontFamily: 'monospace' }}>M</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── RUN & DEBUG ── */}
        {activeTab === 3 && (
          <div style={{ height: '100%', overflow: 'hidden' }}>
            <div style={{
              fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: '#c9d1d9', padding: '10px 14px 8px',
            }}>
              Run & Debug
            </div>
            <DebuggerPanel />
          </div>
        )}

        {/* ── EXTENSIONS ── */}
        {activeTab === 4 && (
          <div style={{ padding: '10px 12px 0' }}>
            <div style={{
              fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: '#c9d1d9', marginBottom: '10px',
            }}>
              Extensions
            </div>
            <input
              placeholder="Search Extensions in Marketplace"
              style={{
                width: '100%', background: '#0d1117', border: '1px solid #1f2937',
                borderRadius: '5px', color: '#e2e8f0', fontSize: '12.5px',
                padding: '5px 10px', outline: 'none', boxSizing: 'border-box', marginBottom: '14px',
              }}
            />
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: '6px' }}>
              Installed
            </div>
            {['Tailwind CSS IntelliSense', 'ESLint', 'Prettier', 'GitLens', 'Error Lens'].map((ext) => (
              <div key={ext} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '5px 6px', cursor: 'pointer', borderRadius: '4px',
              }}>
                <Package size={13} color="#6b7280" />
                <span style={{ fontSize: '12.5px', color: '#9ca3af' }}>{ext}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── AI TOOLS ── */}
        {activeTab === 5 && (
          <div style={{ height: '100%', overflow: 'hidden' }}>
            <div style={{
              fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: '#c9d1d9', padding: '10px 14px 8px',
            }}>
              AI Team
            </div>
            <AITeamPanel />
          </div>
        )}
      </motion.aside>
    </AnimatePresence>
  );
}
