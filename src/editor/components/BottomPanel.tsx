import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TerminalSquare, AlertTriangle, AlignLeft, Bug,
  ChevronUp, ChevronDown, Plus, Trash2, Columns2,
} from 'lucide-react';
import { AIChatPanel } from './AIChatPanel';

type PanelTab = 'terminal' | 'problems' | 'output' | 'debug';

const terminalLines = [
  { type: 'prompt', text: 'nexo@v3 ~/my-awesome-app' },
  { type: 'cmd',    text: '> npm run dev' },
  { type: 'blank',  text: '' },
  { type: 'info',   text: '> my-awesome-app@1.0.0 dev' },
  { type: 'info',   text: '> vite' },
  { type: 'blank',  text: '' },
  { type: 'ready',  text: '  VITE v5.1.0  ready in 362 ms' },
  { type: 'blank',  text: '' },
  { type: 'local',  text: '  ➜  Local:   http://localhost:5173/' },
  { type: 'net',    text: '  ➜  Network: use --host to expose' },
  { type: 'net',    text: '  ➜  press h + enter to show help' },
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

export function BottomPanel({ collapsed, onToggle }: Props) {
  const [activeTab, setActiveTab] = useState<PanelTab>('terminal');
  const [termInput, setTermInput] = useState('');

  return (
    <section style={{
      height: '100%',
      background: '#0d1117',
      borderTop: '1px solid #1f2937',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* ── Panel header — matches reference screenshot ── */}
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

        {/* Right-side controls (matching reference: bash selector, +, split, trash, chevrons) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', paddingRight: '8px' }}>
          {/* Shell selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '4px',
            padding: '2px 8px',
            fontSize: '11px',
            color: '#9ca3af',
            cursor: 'pointer',
            marginRight: '4px',
          }}>
            <TerminalSquare size={11} />
            <span>bash</span>
            <ChevronDown size={10} />
          </div>

          {[
            { icon: Plus,        title: 'New Terminal' },
            { icon: Columns2,    title: 'Split Terminal' },
            { icon: Trash2,      title: 'Kill Terminal' },
          ].map(({ icon: Icon, title }) => (
            <button key={title} title={title} style={{
              background: 'none', border: 'none', padding: '4px', cursor: 'pointer',
              color: '#4b5563', borderRadius: '4px', display: 'flex',
              transition: 'color 100ms',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#4b5563'; }}
            >
              <Icon size={14} />
            </button>
          ))}

          {/* Chevron toggle */}
          <button
            onClick={onToggle}
            title={collapsed ? 'Maximize panel' : 'Minimize panel'}
            style={{
              background: 'none', border: 'none', padding: '4px', cursor: 'pointer',
              color: '#4b5563', borderRadius: '4px', display: 'flex',
              transition: 'color 100ms',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#4b5563'; }}
          >
            {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* ── Panel content ── */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1 }}
            style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          >
            {/* TERMINAL */}
            {activeTab === 'terminal' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '10px 16px 6px',
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  fontSize: '12.5px',
                  lineHeight: '1.7',
                }}>
                  {terminalLines.map((line, i) => (
                    <div key={i} style={{
                      color:
                        line.type === 'prompt' ? '#22c55e' :
                        line.type === 'cmd'    ? '#e2e8f0' :
                        line.type === 'ready'  ? '#93c5fd' :
                        line.type === 'local'  ? '#22c55e' :
                        line.type === 'net'    ? '#22c55e' :
                        line.type === 'info'   ? '#6b7280' :
                        'transparent',
                      height: line.type === 'blank' ? '6px' : 'auto',
                    }}>
                      {line.text}
                    </div>
                  ))}

                  {/* Active prompt line */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <span style={{ color: '#22c55e', fontFamily: 'monospace' }}>{'>'}</span>
                    <input
                      value={termInput}
                      onChange={(e) => setTermInput(e.target.value)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: '#e2e8f0',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '12.5px',
                        flex: 1,
                        caretColor: '#e2e8f0',
                      }}
                      spellCheck={false}
                    />
                  </div>
                </div>
              </div>
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
