import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TerminalSquare, AlertTriangle, AlignLeft, Bug,
  ChevronUp, ChevronDown, Plus, Trash2, Columns2,
} from 'lucide-react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { useTerminalStore } from '@/store/useTerminalStore';

type PanelTab = 'terminal' | 'problems' | 'output' | 'debug';

const problemLines = [
  { severity: 'error',   file: 'src/editor/CodeEditor.tsx', line: 42, msg: "Cannot find name 'Monaco'." },
  { severity: 'warning', file: 'src/store/useChatStore.ts',  line: 17, msg: "Variable 'tokens' is assigned but never read." },
  { severity: 'info',    file: 'vite.config.ts',             line: 5,  msg: "Module resolution uses bundler mode." },
];

const outputLines = [
  '[nexo] Starting AI agent runtime...',
  '[nexo] Loaded 4 tools: read_file, write_file, run_command, search',
  '[nexo] Context window: 128k tokens',
  '[nexo] Model: Claude Sonnet 4.5',
  '[nexo] Ready. Waiting for instructions...',
];

type Props = {
  collapsed: boolean;
  onToggle: () => void;
};

const tabs: { id: PanelTab; label: string }[] = [
  { id: 'terminal', label: 'TERMINAL' },
  { id: 'problems', label: 'PROBLEMS' },
  { id: 'output',   label: 'OUTPUT' },
  { id: 'debug',    label: 'DEBUG CONSOLE' },
];

function RealTerminal({ id }: { id: string }) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termInstance = useRef<Terminal | null>(null);

  useEffect(() => {
    const container = terminalRef.current;
    if (!container) return;

    const isElectron = typeof window !== 'undefined' && !!(window as any).nexoDesktop;
    if (!isElectron) return;

    const desktop = (window as any).nexoDesktop;

    // Instantiate high-performance terminal
    const term = new Terminal({
      cursorBlink: true,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      fontSize: 12.5,
      theme: {
        background: '#0d1117',
        foreground: '#c9d1d9',
        cursor: '#c9d1d9',
        black: '#0d1117',
        red: '#ff7b72',
        green: '#7ee787',
        yellow: '#f2cc60',
        blue: '#58a6ff',
        magenta: '#bc8cff',
        cyan: '#79c0ff',
        white: '#ffffff',
      },
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(container);
    fitAddon.fit();

    termInstance.current = term;

    // Hook listeners securely using unique terminal ID channel
    const unsubscribe = desktop.onTerminalData(id, (data: string) => {
      term.write(data);
    });

    term.onData((data) => {
      desktop.sendTerminalInput(id, data);
    });

    // Handle resizing on split drags
    const handleResize = () => {
      try { fitAddon.fit(); } catch (e) {}
    };

    window.addEventListener('resize', handleResize);
    
    // Fit canvas initially once container mounts
    const timer = setTimeout(handleResize, 150);

    return () => {
      unsubscribe();
      term.dispose();
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [id]);

  return (
    <div style={{ width: '100%', height: '100%', padding: '6px 12px', boxSizing: 'border-box' }}>
      <div ref={terminalRef} style={{ width: '100%', height: '100%', minHeight: '120px' }} />
    </div>
  );
}

function BrowserTerminalFallback() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      background: '#0d1117',
      gap: '12px',
      color: '#6b7280',
      padding: '24px',
      textAlign: 'center',
    }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '10px',
        background: '#111827', border: '1px solid #1f2937',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <TerminalSquare size={20} color="#4b5563" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <span style={{ fontSize: '13.5px', color: '#e2e8f0', fontWeight: 600 }}>Interactive Terminals Restricted</span>
        <span style={{ fontSize: '12px', color: '#4b5563', maxWidth: '400px', lineHeight: '1.5' }}>
          Concurrent OS shell execution is limited inside standard web viewports. To launch integrated multi-terminal shells (PowerShell or Bash), please open Nexo inside our Electron desktop app.
        </span>
      </div>
    </div>
  );
}

export function BottomPanel({ collapsed, onToggle }: Props) {
  const [activeTab, setActiveTab] = useState<PanelTab>('terminal');
  const isElectron = typeof window !== 'undefined' && !!(window as any).nexoDesktop;

  // Multi-terminal store states
  const { terminals, activeId, createTerminal, removeTerminal, setActiveId } = useTerminalStore();

  const [isSplit, setIsSplit] = useState(false);
  const [splitActiveId, setSplitActiveId] = useState<string | null>(null);

  const handleToggleSplit = () => {
    if (isSplit) {
      setIsSplit(false);
      setSplitActiveId(null);
    } else {
      const other = terminals.find((t) => t.id !== activeId);
      if (other) {
        setSplitActiveId(other.id);
        setIsSplit(true);
      } else {
        setIsSplit(true);
        createTerminal();
      }
    }
  };

  // Auto-spawn a first shell instance on mount
  useEffect(() => {
    if (terminals.length === 0 && isElectron) {
      createTerminal();
    }
  }, [terminals.length, isElectron]);

  // Sync split active ID when terminals list changes
  useEffect(() => {
    if (isSplit) {
      if (terminals.length <= 1) {
        setIsSplit(false);
        setSplitActiveId(null);
      } else if (!splitActiveId || !terminals.some((t) => t.id === splitActiveId)) {
        const other = terminals.find((t) => t.id !== activeId);
        if (other) {
          setSplitActiveId(other.id);
        } else {
          setIsSplit(false);
          setSplitActiveId(null);
        }
      }
    }
  }, [terminals, isSplit, splitActiveId, activeId]);

  return (
    <section style={{
      height: '100%',
      background: '#0d1117',
      borderTop: '1px solid #1f2937',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* ── Panel header ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: '#111827',
        borderBottom: '1px solid #1f2937',
        flexShrink: 0,
        height: '35px',
      }}>
        {/* Tabs */}
        <div style={{ display: 'flex', alignItems: 'stretch', flex: 1, height: '100%' }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`panel-tab-${tab.id}`}
                onClick={() => { setActiveTab(tab.id); if (collapsed) onToggle(); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '1px solid #3b82f6' : '1px solid transparent',
                  color: isActive ? '#e2e8f0' : '#6b7280',
                  fontSize: '11.5px',
                  fontWeight: 500,
                  padding: '0 14px',
                  cursor: 'pointer',
                  letterSpacing: '0.02em',
                  transition: 'color 120ms, border-color 120ms',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right-side controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', paddingRight: '8px' }}>
          {/* Shell Selector Dropdown */}
          {activeTab === 'terminal' && isElectron && activeId && (
            <div style={{ position: 'relative', marginRight: '4px', display: 'flex', alignItems: 'center' }}>
              <select
                value={activeId}
                onChange={(e) => setActiveId(e.target.value)}
                style={{
                  background: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '4px',
                  padding: '2px 18px 2px 6px',
                  fontSize: '11.5px',
                  color: '#e2e8f0',
                  outline: 'none',
                  cursor: 'pointer',
                  fontFamily: "'JetBrains Mono', monospace",
                  height: '22px',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                }}
              >
                {terminals.map((t) => (
                  <option key={t.id} value={t.id}>
                    🐚 {t.name}
                  </option>
                ))}
              </select>
              {/* Dropdown caret indicator */}
              <span style={{ position: 'absolute', right: '6px', pointerEvents: 'none', fontSize: '8px', color: '#6b7280' }}>▼</span>
            </div>
          )}

          {activeTab === 'terminal' && isElectron && (
            <>
              {/* Add shell */}
              <button
                onClick={createTerminal}
                title="New Terminal"
                style={iconBtnStyle}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#4b5563'; }}
              >
                <Plus size={14} />
              </button>
              {/* Split terminal button */}
              <button
                onClick={handleToggleSplit}
                title="Split Terminal"
                style={{
                  ...iconBtnStyle,
                  color: isSplit ? '#3b82f6' : '#4b5563',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = isSplit ? '#3b82f6' : '#4b5563'; }}
              >
                <Columns2 size={14} />
              </button>
              {/* Remove shell */}
              <button
                onClick={() => { if (activeId) removeTerminal(activeId); }}
                disabled={terminals.length <= 1}
                title="Kill Terminal"
                style={{
                  ...iconBtnStyle,
                  cursor: terminals.length <= 1 ? 'not-allowed' : 'pointer',
                  color: terminals.length <= 1 ? '#1f2937' : '#4b5563',
                }}
                onMouseEnter={(e) => { if (terminals.length > 1) (e.currentTarget as HTMLButtonElement).style.color = '#ff7b72'; }}
                onMouseLeave={(e) => { if (terminals.length > 1) (e.currentTarget as HTMLButtonElement).style.color = '#4b5563'; }}
              >
                <Trash2 size={14} />
              </button>
            </>
          )}

          {/* Chevron panel toggle */}
          <button
            onClick={onToggle}
            title={collapsed ? 'Maximize panel' : 'Minimize panel'}
            style={iconBtnStyle}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#4b5563'; }}
          >
            {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* ── Panel content ── */}
      <AnimatePresence mode="wait">
        {!collapsed && (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          >
            {/* TERMINAL CONCENTRIC DRAWER */}
            {activeTab === 'terminal' && (
              !isElectron ? (
                <BrowserTerminalFallback />
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'row', minHeight: 0, background: '#0d1117' }}>
                  {/* Left Pane (Active Terminal) */}
                  <div style={{ flex: 1, minWidth: 0, height: '100%', borderRight: isSplit ? '1px solid #1f2937' : 'none' }}>
                    {terminals.map((term) => (
                      <div
                        key={term.id}
                        style={{
                          display: activeId === term.id ? 'block' : 'none',
                          height: '100%',
                        }}
                      >
                        <RealTerminal id={term.id} />
                      </div>
                    ))}
                  </div>

                  {/* Right Pane (Split Terminal) */}
                  {isSplit && splitActiveId && (
                    <div style={{ flex: 1, minWidth: 0, height: '100%' }}>
                      {terminals.map((term) => (
                        <div
                          key={term.id}
                          style={{
                            display: splitActiveId === term.id ? 'block' : 'none',
                            height: '100%',
                          }}
                        >
                          <RealTerminal id={term.id} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            )}

            {/* PROBLEMS */}
            {activeTab === 'problems' && (
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {/* Summary row */}
                <div style={{
                  padding: '6px 14px',
                  fontSize: '11.5px',
                  color: '#6b7280',
                  borderBottom: '1px solid #1f2937',
                  display: 'flex',
                  gap: '12px',
                }}>
                  <span style={{ color: '#f87171' }}>● 1 error</span>
                  <span style={{ color: '#fbbf24' }}>⚠ 1 warning</span>
                  <span style={{ color: '#60a5fa' }}>ℹ 1 info</span>
                </div>
                {problemLines.map((p, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '7px 14px',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #111827',
                    transition: 'background 80ms',
                  }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                  >
                    <span style={{
                      flexShrink: 0,
                      color:
                        p.severity === 'error' ? '#f87171' :
                        p.severity === 'warning' ? '#fbbf24' : '#60a5fa',
                      fontSize: '14px',
                      lineHeight: 1,
                    }}>
                      {p.severity === 'error' ? '●' : p.severity === 'warning' ? '⚠' : 'ℹ'}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#c9d1d9' }}>{p.msg}</div>
                      <div style={{ color: '#4b5563', fontSize: '11.5px', marginTop: '1px', fontFamily: "'JetBrains Mono', monospace" }}>
                        {p.file}:{p.line}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* OUTPUT */}
            {activeTab === 'output' && (
              <div style={{
                flex: 1, overflowY: 'auto', padding: '10px 16px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12.5px', lineHeight: '1.7', color: '#6b7280',
              }}>
                {outputLines.map((line, i) => (
                  <div key={i} style={{ color: line.includes('[nexo]') ? '#9ca3af' : '#6b7280' }}>{line}</div>
                ))}
              </div>
            )}

            {/* DEBUG CONSOLE */}
            {activeTab === 'debug' && (
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#374151', fontSize: '12.5px', flexDirection: 'column', gap: '8px',
              }}>
                <Bug size={28} color="#1f2937" />
                <span>No debug session active</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

const iconBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: '4px',
  cursor: 'pointer',
  color: '#4b5563',
  borderRadius: '4px',
  display: 'flex',
  transition: 'color 100ms',
};
