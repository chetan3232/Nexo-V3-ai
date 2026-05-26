import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { ActivityBar } from './components/ActivityBar';
import { Sidebar } from './components/Sidebar';
import { EditorTabs } from './components/EditorTabs';
import { CodeEditor } from './CodeEditor';
import { BottomPanel } from './components/BottomPanel';
import { StatusBar } from './components/StatusBar';
import { CommandPalette } from './components/CommandPalette';
import { AIAssistantPanel } from './components/AIAssistantPanel';
import { TitleBar } from './components/TitleBar';
import { useIdeLayoutStore } from '@/store/useIdeLayoutStore';

export function IdeWorkspace() {
  const [activeIcon, setActiveIcon] = useState(0);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(true);

  const {
    sidebarCollapsed,
    setSidebarCollapsed,
    bottomPanelCollapsed,
    setBottomPanelCollapsed,
  } = useIdeLayoutStore();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setAiPanelOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--bg-base)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-ui)',
      }}
    >
      {/* ── Title bar (Electron-style) ── */}
      <TitleBar
        onTogglePalette={() => setPaletteOpen(true)}
        onToggleAI={() => setAiPanelOpen((v) => !v)}
        aiPanelOpen={aiPanelOpen}
      />

      {/* ── Main workspace body ── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Activity Bar — leftmost strip */}
        <ActivityBar
          activeIndex={activeIcon}
          onSelect={(idx) => {
            setActiveIcon(idx);
            if (sidebarCollapsed) setSidebarCollapsed(false);
          }}
        />

        {/* Horizontal group: Sidebar | Editor+Bottom | AI Panel */}
        <Group
          orientation="horizontal"
          style={{ flex: 1, minWidth: 0, height: '100%' }}
        >
          {/* ── Sidebar ── */}
          {!sidebarCollapsed && (
            <>
              <Panel id="sidebar" defaultSize={18} minSize={12} maxSize={32}>
                <AnimatePresence>
                  <motion.div
                    key="sidebar"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.15 }}
                    style={{ height: '100%' }}
                  >
                    <Sidebar
                      collapsed={false}
                      activeTab={activeIcon}
                      onToggleCanvas={() => {}}
                      isCanvasOpen={false}
                    />
                  </motion.div>
                </AnimatePresence>
              </Panel>
              <Separator
                style={{
                  width: '1px',
                  background: 'var(--border)',
                  cursor: 'col-resize',
                  flexShrink: 0,
                }}
              />
            </>
          )}

          {/* ── Editor + Bottom Panel ── */}
          <Panel id="editor-main" defaultSize={aiPanelOpen ? 58 : 82} minSize={30}>
            {/* Vertical group: Editor | Terminal */}
            <Group orientation="vertical" style={{ height: '100%' }}>
              {/* Editor area */}
              <Panel id="editor-area" defaultSize={72} minSize={25}>
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <EditorTabs onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
                  <div style={{ flex: 1, minHeight: 0 }}>
                    <CodeEditor />
                  </div>
                </div>
              </Panel>

              <Separator
                style={{
                  height: '1px',
                  background: 'var(--border)',
                  cursor: 'row-resize',
                  flexShrink: 0,
                }}
              />

              {/* Bottom panel */}
              <Panel
                id="bottom-panel"
                defaultSize={28}
                minSize={8}
                maxSize={55}
                collapsible
                collapsedSize={6}
                onResize={(panelSize) => {
                  const pct = typeof panelSize === 'number'
                    ? panelSize
                    : panelSize.asPercentage;
                  setBottomPanelCollapsed(pct <= 7);
                }}
              >
                <BottomPanel
                  collapsed={bottomPanelCollapsed}
                  onToggle={() => setBottomPanelCollapsed(!bottomPanelCollapsed)}
                />
              </Panel>
            </Group>
          </Panel>

          {/* ── AI Assistant Panel ── */}
          {aiPanelOpen && (
            <>
              <Separator
                style={{
                  width: '1px',
                  background: 'var(--border)',
                  cursor: 'col-resize',
                  flexShrink: 0,
                }}
              />
              <Panel id="ai-panel" defaultSize={22} minSize={16} maxSize={40}>
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.15 }}
                  style={{ height: '100%' }}
                >
                  <AIAssistantPanel onClose={() => setAiPanelOpen(false)} />
                </motion.div>
              </Panel>
            </>
          )}
        </Group>
      </div>

      {/* ── Status bar ── */}
      <StatusBar aiPanelOpen={aiPanelOpen} sidebarOpen={!sidebarCollapsed} />

      {/* ── Command palette overlay ── */}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
