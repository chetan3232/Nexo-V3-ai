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
import { useFileSystemStore } from '@/store/useFileSystemStore';
import { useEditorStore } from '@/store/useEditorStore';
import { LivePreview } from './components/LivePreview';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTerminalStore } from '@/store/useTerminalStore';
import { writeWorkspaceFile } from '@/services/fileSystemClient';
import { AISpotlight } from './components/AISpotlight';
import { ShortcutsModal } from './components/ShortcutsModal';
import { CloudProjectsModal } from './components/CloudProjectsModal';
import { FloatingAIWidget } from './components/FloatingAIWidget';

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
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [cloudOpen, setCloudOpen]         = useState(false);

  // Pixel-based sizes for reliable layout
  const [sidebarW,  setSidebarW]  = useState(DEFAULT_SIDEBAR_W);
  const [aiW,       setAiW]       = useState(DEFAULT_AI_W);
  const [terminalH, setTerminalH] = useState(DEFAULT_TERMINAL_H);

  const {
    sidebarCollapsed,
    setSidebarCollapsed,
    bottomPanelCollapsed,
    setBottomPanelCollapsed,
    aiPanelOpen,
    setAiPanelOpen,
    previewOpen,
    setPreviewOpen,
  } = useIdeLayoutStore();

  const loadWorkspaceRoot = useFileSystemStore((s) => s.loadWorkspaceRoot);

  useEffect(() => {
    void loadWorkspaceRoot().catch(() => undefined);
  }, [loadWorkspaceRoot]);

  // Unified action routing function
  const handleCommand = useCallback((command: string, payload?: any) => {
    switch (command) {
      // File
      case 'new-file': {
        let nextNum = 1;
        while (useEditorStore.getState().files[`untitled-${nextNum}.tsx`]) {
          nextNum++;
        }
        const newPath = `untitled-${nextNum}.tsx`;
        useEditorStore.getState().openFile(newPath);
        break;
      }
      case 'open-folder':
        if ((window as any).nexoDesktop) {
          (window as any).nexoDesktop.selectFolder().then((path: string | null) => {
            if (path) {
              void useFileSystemStore.getState().openFolder(path);
            }
          });
        } else {
          const path = prompt('Enter folder path to open:');
          if (path) {
            void useFileSystemStore.getState().openFolder(path);
          }
        }
        break;
      case 'save-file': {
        const activeFile = useEditorStore.getState().activeFile;
        if (activeFile) {
          useEditorStore.getState().saveFile(activeFile);
        }
        break;
      }
      case 'save-as': {
        const activeFile = useEditorStore.getState().activeFile;
        if (activeFile) {
          const content = useEditorStore.getState().files[activeFile]?.content ?? '';
          if ((window as any).nexoDesktop) {
            (window as any).nexoDesktop.saveFileDialog(activeFile).then((filePath: string | null) => {
              if (filePath) {
                writeWorkspaceFile(filePath, content).then(() => {
                  void useFileSystemStore.getState().syncFromBackend();
                  useEditorStore.getState().openFile(filePath);
                });
              }
            });
          } else {
            const filePath = prompt('Save file as:', activeFile);
            if (filePath) {
              writeWorkspaceFile(filePath, content).then(() => {
                void useFileSystemStore.getState().syncFromBackend();
                useEditorStore.getState().openFile(filePath);
              });
            }
          }
        }
        break;
      }
      case 'toggle-auto-save': {
        const val = payload !== undefined ? payload : !useSettingsStore.getState().autoSave;
        useSettingsStore.getState().setAutoSave(val);
        break;
      }

      // Edit commands: forward to Monaco
      case 'undo':
      case 'redo':
      case 'cut':
      case 'copy':
      case 'paste':
      case 'select-all':
      case 'find':
      case 'replace':
      case 'go-to-line':
        window.dispatchEvent(new CustomEvent('nexo-editor-command', { detail: { command, payload } }));
        break;

      // View / Layout
      case 'toggle-sidebar':
        setSidebarCollapsed(!sidebarCollapsed);
        break;
      case 'toggle-terminal':
        setBottomPanelCollapsed(!bottomPanelCollapsed);
        break;
      case 'toggle-ai':
        setAiPanelOpen(!aiPanelOpen);
        break;
      case 'toggle-minimap':
        useSettingsStore.getState().setMinimapEnabled(!useSettingsStore.getState().minimapEnabled);
        break;
      case 'zoom-in':
        useSettingsStore.getState().setFontSize(Math.min(24, useSettingsStore.getState().fontSize + 1));
        break;
      case 'zoom-out':
        useSettingsStore.getState().setFontSize(Math.max(10, useSettingsStore.getState().fontSize - 1));
        break;

      // Go
      case 'go-to-file':
        setPaletteOpen(true);
        break;
      case 'next-tab': {
        const { openedFiles, activeFile, setActiveFile } = useEditorStore.getState();
        if (openedFiles.length > 1 && activeFile) {
          const idx = openedFiles.indexOf(activeFile);
          const nextIdx = (idx + 1) % openedFiles.length;
          setActiveFile(openedFiles[nextIdx]);
        }
        break;
      }

      // Run
      case 'run-project': {
        setBottomPanelCollapsed(false);
        let activeId = useTerminalStore.getState().activeId;
        if (!activeId) {
          useTerminalStore.getState().createTerminal();
          activeId = useTerminalStore.getState().activeId;
        }
        const desktop = (window as any).nexoDesktop;
        if (activeId && desktop) {
          desktop.sendTerminalInput(activeId, 'npm run dev\r');
        }
        setPreviewOpen(true);
        break;
      }
      case 'stop-project': {
        const activeId = useTerminalStore.getState().activeId;
        const desktop = (window as any).nexoDesktop;
        if (activeId && desktop) {
          desktop.sendTerminalInput(activeId, '\x03');
        }
        break;
      }
      case 'restart-project': {
        const activeId = useTerminalStore.getState().activeId;
        const desktop = (window as any).nexoDesktop;
        if (activeId && desktop) {
          desktop.sendTerminalInput(activeId, '\x03');
          setTimeout(() => {
            desktop.sendTerminalInput(activeId, 'npm run dev\r');
          }, 500);
        }
        break;
      }
      case 'run-current-file': {
        const activeFile = useEditorStore.getState().activeFile;
        if (activeFile) {
          setBottomPanelCollapsed(false);
          let activeId = useTerminalStore.getState().activeId;
          if (!activeId) {
            useTerminalStore.getState().createTerminal();
            activeId = useTerminalStore.getState().activeId;
          }
          const desktop = (window as any).nexoDesktop;
          if (activeId && desktop) {
            const ext = activeFile.split('.').pop() ?? '';
            const cmd = ext === 'py' ? `python ${activeFile}` : ext === 'js' || ext === 'ts' ? `node ${activeFile}` : `echo "Cannot run ${activeFile}"`;
            desktop.sendTerminalInput(activeId, `${cmd}\r`);
          }
        }
        break;
      }

      // Terminal
       case 'new-terminal':
        setBottomPanelCollapsed(false);
        useTerminalStore.getState().createTerminal();
        break;
      
      case 'toggle-spotlight':
        setSpotlightOpen((v) => !v);
        break;
      case 'toggle-cloud':
        setCloudOpen((v) => !v);
        break;
      case 'toggle-shortcuts':
        setShortcutsOpen((v) => !v);
        break;

      // Help
      case 'about':
        alert('Nexo AI IDE V3 - A Next-Generation Agentic Coding Environment.');
        break;

      default:
        break;
    }
  }, [
    sidebarCollapsed,
    setSidebarCollapsed,
    bottomPanelCollapsed,
    setBottomPanelCollapsed,
    aiPanelOpen,
    setAiPanelOpen,
  ]);

  // Keyboard Shortcuts Manager
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;

      if (isMod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
      else if (isMod && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        handleCommand('toggle-spotlight');
      }
      else if (isMod && e.shiftKey && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        handleCommand('toggle-cloud');
      }
      else if (isMod && e.shiftKey && (e.key === '?' || e.key === '/')) {
        e.preventDefault();
        handleCommand('toggle-shortcuts');
      }
      else if (isMod && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
      else if (isMod && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
      else if (isMod && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        handleCommand('toggle-ai');
      }
      else if (isMod && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        handleCommand('toggle-sidebar');
      }
      else if (isMod && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        handleCommand('toggle-terminal');
      }
      else if (isMod && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleCommand('new-file');
      }
      else if (isMod && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        handleCommand('open-folder');
      }
      else if (isMod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleCommand('save-file');
      }
      else if (isMod && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleCommand('save-as');
      }
      else if (e.key === 'F11') {
        e.preventDefault();
        const desktop = (window as any).nexoDesktop;
        if (desktop && desktop.toggleFullscreen) {
          desktop.toggleFullscreen();
        }
      }
      else if (e.ctrlKey && e.key === 'Tab') {
        e.preventDefault();
        handleCommand('next-tab');
      }
      else if (isMod && e.key === '`') {
        e.preventDefault();
        handleCommand('toggle-terminal');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleCommand]);

  // Listen to menu actions from main process
  useEffect(() => {
    const desktop = (window as any).nexoDesktop;
    if (desktop && desktop.onMenuCommand) {
      const unsubscribe = desktop.onMenuCommand((command: string, ...args: any[]) => {
        handleCommand(command, ...args);
      });
      return unsubscribe;
    }
  }, [handleCommand]);

  // Listen to custom layout command events (from header dropdowns, command palette, etc.)
  useEffect(() => {
    const listener = (e: CustomEvent<{ command: string; payload?: any }>) => {
      const { command, payload } = e.detail;
      handleCommand(command, payload);
    };
    window.addEventListener('nexo-layout-command' as any, listener);
    return () => {
      window.removeEventListener('nexo-layout-command' as any, listener);
    };
  }, [handleCommand]);

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
      setBottomPanelCollapsed(next <= MIN_TERMINAL_H + 4);
      return next;
    });
  }, [setBottomPanelCollapsed]);

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
        onToggleAI={() => setAiPanelOpen(!aiPanelOpen)}
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
          <div style={{ flex: 1, display: 'flex', flexDirection: 'row', minHeight: 0, overflow: 'hidden' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
              <EditorTabs onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
              <div style={{ flex: 1, minHeight: 0 }}>
                <CodeEditor />
              </div>
            </div>
            
            {previewOpen && (
              <div style={{ width: '45%', minWidth: '320px', height: '100%', flexShrink: 0 }}>
                <LivePreview />
              </div>
            )}
          </div>

          {/* Terminal resize handle */}
          <ResizeHandle direction="row" onDrag={onTermDrag} />

          {/* Bottom panel */}
          <div style={{
            height: bottomPanelCollapsed ? 36 : terminalH,
            flexShrink: 0,
            overflow: 'hidden',
            transition: 'height 150ms ease',
          }}>
            <BottomPanel
              collapsed={bottomPanelCollapsed}
              onToggle={() => setBottomPanelCollapsed(!bottomPanelCollapsed)}
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

      {/* ── Premium UX & Cloud Modals ── */}
      <AISpotlight isOpen={spotlightOpen} onClose={() => setSpotlightOpen(false)} />
      <ShortcutsModal isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <CloudProjectsModal isOpen={cloudOpen} onClose={() => setCloudOpen(false)} />
      <FloatingAIWidget />
    </div>
  );
}
