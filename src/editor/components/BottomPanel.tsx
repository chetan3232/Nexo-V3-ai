import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TerminalSquare, Sparkles, Bug, ChevronUp, ChevronDown, X } from 'lucide-react';
import { AIChatPanel } from './AIChatPanel';

type PanelTab = 'terminal' | 'problems' | 'output' | 'chat';

const tabs: { id: PanelTab; label: string; icon: React.ElementType }[] = [
  { id: 'terminal', label: 'Terminal',  icon: TerminalSquare },
  { id: 'problems', label: 'Problems',  icon: Bug },
  { id: 'output',   label: 'Output',    icon: TerminalSquare },
  { id: 'chat',     label: 'AI Chat',   icon: Sparkles },
];

// Simulated terminal lines
const terminalLines = [
  { type: 'cmd',  text: '$ npm run dev' },
  { type: 'info', text: '  VITE v6.2.0  ready in 312 ms' },
  { type: 'info', text: '' },
  { type: 'ok',   text: '  ➜  Local:   http://localhost:5173/' },
  { type: 'ok',   text: '  ➜  Network: http://192.168.1.42:5173/' },
  { type: 'muted',text: '  ➜  press h + enter to show help' },
];

const problemLines = [
  { severity: 'error',   file: 'src/editor/CodeEditor.tsx', line: 42, msg: "Cannot find name 'Monaco'." },
  { severity: 'warning', file: 'src/store/useChatStore.ts',  line: 17, msg: "Variable 'tokens' is assigned but never read." },
  { severity: 'info',    file: 'vite.config.ts',             line: 5,  msg: "Module resolution uses bundler mode." },
];

const outputLines = [
  '[nexo] Starting AI agent runtime...',
  '[nexo] Loaded 4 tools: read_file, write_file, run_command, search',
  '[nexo] Context window: 128k tokens',
  '[nexo] Ready.',
];

type Props = {
  collapsed: boolean;
  onToggle: () => void;
};

export function BottomPanel({ collapsed, onToggle }: Props) {
  const [activeTab, setActiveTab] = useState<PanelTab>('terminal');

  return (
    <section
      style={{
        height: '100%',
        background: 'var(--bg-base)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Panel header with tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-sidebar)',
          flexShrink: 0,
          paddingLeft: '4px',
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              id={`panel-tab-${tab.id}`}
              className={`panel-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(tab.id);
                if (collapsed) onToggle();
              }}
            >
              <Icon size={13} />
              {tab.label}
            </button>
          );
        })}

        {/* Spacer + collapse button */}
        <div style={{ flex: 1 }} />
        <button
          className="icon-btn"
          onClick={onToggle}
          style={{ marginRight: '6px' }}
          title={collapsed ? 'Expand panel' : 'Collapse panel'}
        >
          {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Panel content */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          >
            {/* ── TERMINAL ── */}
            {activeTab === 'terminal' && (
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '10px 16px',
                  fontFamily: 'var(--font-code)',
                  fontSize: '12.5px',
                  lineHeight: '1.7',
                }}
              >
                {terminalLines.map((line, i) => (
                  <div
                    key={i}
                    style={{
                      color:
                        line.type === 'cmd'   ? '#e2e8f0'  :
                        line.type === 'ok'    ? '#22c55e'  :
                        line.type === 'info'  ? '#93c5fd'  :
                        '#4b5e78',
                    }}
                  >
                    {line.text}
                  </div>
                ))}
                {/* Cursor */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                  <span style={{ color: '#22c55e' }}>$</span>
                  <span
                    style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '15px',
                      background: '#e2e8f0',
                      borderRadius: '1px',
                    }}
                    className="blink"
                  />
                </div>
              </div>
            )}

            {/* ── PROBLEMS ── */}
            {activeTab === 'problems' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
                {problemLines.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      padding: '5px 14px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'background 100ms',
                    }}
                    className="hover:bg-[var(--bg-hover)]"
                  >
                    <span
                      style={{
                        flexShrink: 0,
                        fontSize: '11px',
                        fontWeight: 600,
                        width: '48px',
                        color:
                          p.severity === 'error'   ? '#ef4444' :
                          p.severity === 'warning' ? '#f59e0b' : '#3b82f6',
                      }}
                    >
                      {p.severity.toUpperCase()}
                    </span>
                    <span style={{ color: 'var(--text-primary)', flex: 1 }}>{p.msg}</span>
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)', fontSize: '11px', flexShrink: 0 }}>
                      {p.file}:{p.line}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* ── OUTPUT ── */}
            {activeTab === 'output' && (
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '10px 16px',
                  fontFamily: 'var(--font-code)',
                  fontSize: '12px',
                  lineHeight: '1.7',
                  color: 'var(--text-secondary)',
                }}
              >
                {outputLines.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            )}

            {/* ── AI CHAT ── */}
            {activeTab === 'chat' && <AIChatPanel />}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
