import { useEffect, useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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

// ── Drag-resize handle ─────────────────────────────────────────────────────
function ResizeHandle({
  direction,
  onDrag,
}: {
  direction: 'col' | 'row';
  onDrag: (delta: number) => void;
}) {
  const dragging = useRef(false);
  const last = useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    last.current = direction === 'col' ? e.clientX : e.clientY;

    const move = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const pos = direction === 'col' ? ev.clientX : ev.clientY;
      onDrag(pos - last.current);
      last.current = pos;
    };
    const up = () => { dragging.current = false; };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up, { once: true });
  };

  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        flexShrink: 0,
        background: 'transparent',
        transition: 'background 120ms',
        cursor: direction === 'col' ? 'col-resize' : 'row-resize',
        zIndex: 10,
        ...(direction === 'col'
          ? { width: '4px', height: '100%' }
          : { height: '4px', width: '100%' }),
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#3b82f6'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
    />
  );
}

// ── Default sizes (px) ────────────────────────────────────────────────────
const DEFAULT_SIDEBAR_W  = 220;
const DEFAULT_AI_W       = 280;
const DEFAULT_TERMINAL_H = 220;

const MIN_SIDEBAR_W  = 140;
const MAX_SIDEBAR_W  = 380;
const MIN_AI_W       = 200;
const MAX_AI_W       = 480;
const MIN_TERMINAL_H = 36;
const MAX_TERMINAL_H = 520;

export function IdeWorkspace() {
  const [activeIcon, setActiveIcon]     = useState(0);
  const [paletteOpen, setPaletteOpen]   = useState(false);
  const [aiPanelOpen, setAiPanelOpen]   = useState(true);

  // Pixel-based sizes for reliable layout
  const [sidebarW,  setSidebarW]  = useState(DEFAULT_SIDEBAR_W);
  const [aiW,       setAiW]       = useState(DEFAULT_AI_W);
  const [terminalH, setTerminalH] = useState(DEFAULT_TERMINAL_H);
  const [termCollapsed, setTermCollapsed] = useState(false);

  const {
    sidebarCollapsed,
    setSidebarCollapsed,
  } = useIdeLayoutStore();

  // Global shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setAiPanelOpen((v) => !v);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        setTermCollapsed((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Resize callbacks
  const onSidebarDrag = useCallback((delta: number) => {
    setSidebarW((w) => Math.min(MAX_SIDEBAR_W, Math.max(MIN_SIDEBAR_W, w + delta)));
  }, []);

  const onAiDrag = useCallback((delta: number) => {
    setAiW((w) => Math.min(MAX_AI_W, Math.max(MIN_AI_W, w - delta)));
  }, []);

  const onTermDrag = useCallback((delta: number) => {
    setTerminalH((h) => {
      const next = Math.min(MAX_TERMINAL_H, Math.max(MIN_TERMINAL_H, h - delta));
      setTermCollapsed(next <= MIN_TERMINAL_H + 4);
      return next;
    });
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      background: '#0d1117',
      color: '#c9d1d9',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* ── Title bar ── */}
      <TitleBar
        onTogglePalette={() => setPaletteOpen(true)}
        onToggleAI={() => setAiPanelOpen((v) => !v)}
        aiPanelOpen={aiPanelOpen}
      />

      {/* ── Main body ── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* Activity bar */}
        <ActivityBar
          activeIndex={activeIcon}
          onSelect={(idx) => {
            setActiveIcon(idx);
            if (sidebarCollapsed) setSidebarCollapsed(false);
          }}
        />

        {/* Sidebar */}
        <AnimatePresence initial={false}>
          {!sidebarCollapsed && (
            <motion.div
              key="sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: sidebarW, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
              style={{ flexShrink: 0, overflow: 'hidden', height: '100%' }}
            >
              <div style={{ width: sidebarW, height: '100%' }}>
                <Sidebar
                  collapsed={false}
                  activeTab={activeIcon}
                  onToggleCanvas={() => {}}
                  isCanvasOpen={false}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sidebar resize handle */}
        {!sidebarCollapsed && (
          <ResizeHandle direction="col" onDrag={onSidebarDrag} />
        )}

        {/* ── Editor column (flex grows) ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, overflow: 'hidden' }}>

          {/* Editor area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
            <EditorTabs onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
            <div style={{ flex: 1, minHeight: 0 }}>
              <CodeEditor />
            </div>
          </div>

          {/* Terminal resize handle */}
          <ResizeHandle direction="row" onDrag={onTermDrag} />

          {/* Bottom panel */}
          <div style={{
            height: termCollapsed ? 36 : terminalH,
            flexShrink: 0,
            overflow: 'hidden',
            transition: 'height 150ms ease',
          }}>
            <BottomPanel
              collapsed={termCollapsed}
              onToggle={() => setTermCollapsed((v) => !v)}
            />
          </div>
        </div>

        {/* AI panel resize handle */}
        {aiPanelOpen && (
          <ResizeHandle direction="col" onDrag={onAiDrag} />
        )}

        {/* AI Assistant Panel */}
        <AnimatePresence initial={false}>
          {aiPanelOpen && (
            <motion.div
              key="ai-panel"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: aiW, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
              style={{ flexShrink: 0, overflow: 'hidden', height: '100%' }}
            >
              <div style={{ width: aiW, height: '100%' }}>
                <AIAssistantPanel onClose={() => setAiPanelOpen(false)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Status bar ── */}
      <StatusBar aiPanelOpen={aiPanelOpen} sidebarOpen={!sidebarCollapsed} />

      {/* ── Command Palette ── */}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
