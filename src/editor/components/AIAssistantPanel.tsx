import { FormEvent, useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  X, Send, Bot, User, Paperclip, AtSign, Mic,
  MessageSquare, Cpu, Database, Trash2,
  FileSearch, Wand2, Component, Bug, ChevronDown,
} from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';
import { NVIDIA_MODELS, NvidiaModel } from '@/services/aiStreamClient';
import { useEditorStore } from '@/store/useEditorStore';

type Props  = { onClose: () => void };
type PanelTab = 'chat' | 'agents' | 'memory';

const quickActions = [
  { icon: FileSearch, title: 'Explain this code',   desc: 'Explain the selected code in detail.',    color: '#60a5fa', prompt: 'Explain the current file code clearly and in detail.' },
  { icon: Wand2,      title: 'Refactor this code',  desc: 'Improve structure and readability.',       color: '#a78bfa', prompt: 'Refactor this code for better structure, readability, and performance.' },
  { icon: Component,  title: 'Generate component',  desc: 'Create a new React component.',            color: '#34d399', prompt: 'Generate a well-typed React component for this use case with TypeScript.' },
  { icon: Bug,        title: 'Find bugs',           desc: 'Detect and fix issues in code.',           color: '#f87171', prompt: 'Find all bugs, edge cases, and potential issues in the current file and fix them.' },
];

const CATEGORY_LABELS: Record<string, string> = {
  coding:    '⚡ Coding',
  reasoning: '🧠 Reasoning',
  general:   '💬 General',
  vision:    '👁️ Vision',
  mini:      '🚀 Mini / Fast',
};

export function AIAssistantPanel({ onClose }: Props) {
  const { messages, input, isStreaming, model, error, setInput, setModel, sendMessage, clearChat, clearError } = useChatStore();
  const { files, activeFile } = useEditorStore();
  const [activeTab, setActiveTab] = useState<PanelTab>('chat');
  const [modelOpen, setModelOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [input]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    // Inject active file context
    const activeContent = activeFile && files[activeFile]
      ? `\n\nCurrent file (${activeFile}):\n\`\`\`${files[activeFile].language ?? ''}\n${files[activeFile].content?.slice(0, 4000) ?? ''}\n\`\`\``
      : '';
    await sendMessage(activeContent);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void submit(e as any); }
  };

  const currentModel = NVIDIA_MODELS.find((m) => m.id === model) ?? NVIDIA_MODELS[0];

  // Group models by category
  const grouped = NVIDIA_MODELS.reduce<Record<string, NvidiaModel[]>>((acc, m) => {
    (acc[m.category] = acc[m.category] ?? []).push(m);
    return acc;
  }, {});

  const tabs: { id: PanelTab; label: string; icon: React.ElementType }[] = [
    { id: 'chat',   label: 'CHAT',   icon: MessageSquare },
    { id: 'agents', label: 'AGENTS', icon: Cpu },
    { id: 'memory', label: 'MEMORY', icon: Database },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#111827', borderLeft: '1px solid #1f2937', position: 'relative' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px 0', flexShrink: 0 }}>
        <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', color: '#e2e8f0' }}>NEXO AI</span>
        <div style={{ display: 'flex', gap: '2px' }}>
          <button onClick={clearChat} title="Clear chat" style={iconBtnStyle}>
            <Trash2 size={13} />
          </button>
          <button onClick={onClose} title="Close" style={iconBtnStyle}>
            <X size={13} />
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', padding: '8px 14px 0', borderBottom: '1px solid #1f2937', flexShrink: 0 }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              background: 'transparent', border: 'none',
              borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
              color: isActive ? '#e2e8f0' : '#6b7280',
              fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.05em',
              padding: '4px 12px 8px', cursor: 'pointer',
              transition: 'color 120ms, border-color 120ms', marginBottom: '-1px',
            }}>
              {tab.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'chat' && (
          <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
          >
            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* Error banner */}
              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', padding: '8px 10px', fontSize: '12px', color: '#f87171', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{error}</span>
                  <button onClick={clearError} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0 4px' }}>×</button>
                </div>
              )}

              {/* Welcome / Quick actions */}
              {messages.length === 0 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '16px', gap: '12px' }}
                >
                  <div style={{ fontSize: '28px', lineHeight: 1 }}>✦</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#e2e8f0', marginBottom: '4px' }}>Hello, Developer! 👋</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>How can I help you today?</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', width: '100%', marginTop: '4px' }}>
                    {quickActions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <motion.button key={action.title} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                          onClick={() => setInput(action.prompt)}
                          style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid #1f2937', borderRadius: '8px', padding: '9px 11px', cursor: 'pointer', textAlign: 'left', transition: 'all 150ms ease' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)'; }}
                        >
                          <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: `${action.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon size={14} color={action.color} />
                          </div>
                          <div>
                            <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#e2e8f0', marginBottom: '2px' }}>{action.title}</div>
                            <div style={{ fontSize: '11.5px', color: '#6b7280' }}>{action.desc}</div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Messages */}
              <AnimatePresence initial={false}>
                {messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <motion.div key={msg.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                      style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}
                    >
                      <div style={{ width: '24px', height: '24px', borderRadius: '6px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isUser ? 'rgba(255,255,255,0.08)' : 'rgba(59,130,246,0.15)', border: `1px solid ${isUser ? '#1f2937' : 'rgba(59,130,246,0.3)'}`, marginTop: '1px' }}>
                        {isUser ? <User size={12} color="#9ca3af" /> : <Bot size={12} color="#60a5fa" />}
                      </div>
                      <div style={{ flex: 1, fontSize: '13px', lineHeight: '1.6', color: '#c9d1d9', background: isUser ? 'rgba(255,255,255,0.04)' : 'transparent', border: isUser ? '1px solid #1f2937' : 'none', borderRadius: '8px', padding: isUser ? '7px 10px' : '0', minWidth: 0, overflow: 'hidden' }}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content || (isStreaming ? ' ' : '')}</ReactMarkdown>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Streaming dots */}
              {isStreaming && (
                <div style={{ display: 'flex', gap: '4px', paddingLeft: '32px' }}>
                  {[0, 1, 2].map((i) => (
                    <motion.div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#3b82f6' }}
                      animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
                  ))}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Input area ── */}
            <div style={{ borderTop: '1px solid #1f2937', padding: '10px 12px', flexShrink: 0 }}>
              {/* Model selector */}
              <div style={{ position: 'relative', marginBottom: '8px' }}>
                <button onClick={() => setModelOpen((v) => !v)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: '#0d1117', border: '1px solid #1f2937', borderRadius: '6px',
                  color: '#9ca3af', fontSize: '11.5px', padding: '5px 10px', cursor: 'pointer',
                  transition: 'border-color 150ms',
                }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#374151'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#1f2937'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#4b5563', fontSize: '10px' }}>{CATEGORY_LABELS[currentModel.category]?.split(' ')[0]}</span>
                    <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{currentModel.label}</span>
                    <span style={{ color: '#4b5563' }}>· {currentModel.provider}</span>
                    {currentModel.contextK && <span style={{ background: '#1f2937', borderRadius: '3px', padding: '0 4px', fontSize: '10px', color: '#6b7280' }}>{currentModel.contextK}k</span>}
                  </div>
                  <ChevronDown size={13} color="#4b5563" style={{ transform: modelOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
                </button>

                {/* Model dropdown */}
                <AnimatePresence>
                  {modelOpen && (
                    <motion.div initial={{ opacity: 0, y: -4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.98 }} transition={{ duration: 0.12 }}
                      style={{ position: 'absolute', bottom: '110%', left: 0, right: 0, background: '#111827', border: '1px solid #1f2937', borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', zIndex: 100, maxHeight: '320px', overflowY: 'auto' }}
                    >
                      {Object.entries(grouped).map(([cat, models]) => (
                        <div key={cat}>
                          <div style={{ padding: '7px 12px 4px', fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.08em', color: '#4b5563', background: '#0d1117', position: 'sticky', top: 0 }}>
                            {CATEGORY_LABELS[cat] ?? cat.toUpperCase()}
                          </div>
                          {models.map((m) => (
                            <button key={m.id} onClick={() => { setModel(m.id); setModelOpen(false); }}
                              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: m.id === model ? 'rgba(59,130,246,0.12)' : 'transparent', border: 'none', padding: '7px 12px', cursor: 'pointer', textAlign: 'left', transition: 'background 80ms' }}
                              onMouseEnter={(e) => { if (m.id !== model) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; }}
                              onMouseLeave={(e) => { if (m.id !== model) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                            >
                              <div>
                                <div style={{ fontSize: '12.5px', color: m.id === model ? '#60a5fa' : '#c9d1d9', fontWeight: m.id === model ? 600 : 400 }}>{m.label}</div>
                                <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '1px' }}>{m.provider}</div>
                              </div>
                              {m.contextK && (
                                <span style={{ background: '#1f2937', borderRadius: '3px', padding: '1px 5px', fontSize: '10px', color: '#6b7280', flexShrink: 0 }}>{m.contextK}k</span>
                              )}
                            </button>
                          ))}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Input */}
              <form onSubmit={submit}>
                <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: '8px', overflow: 'hidden', transition: 'border-color 150ms' }}
                  onFocusCapture={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#374151'; }}
                  onBlurCapture={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#1f2937'; }}
                >
                  <textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey}
                    placeholder="Ask anything... (Enter to send)" disabled={isStreaming} rows={1}
                    style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#e2e8f0', fontSize: '13px', fontFamily: "'Inter', sans-serif", padding: '10px 12px 4px', resize: 'none', lineHeight: '1.5', minHeight: '38px', boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px 6px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[Paperclip, AtSign, Mic].map((Icon, i) => (
                        <button key={i} type="button" style={{ ...iconBtnStyle, padding: '4px' }}>
                          <Icon size={14} />
                        </button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isStreaming && <span style={{ fontSize: '11px', color: '#4b5563' }}>streaming…</span>}
                      <button type="submit" disabled={isStreaming || !input.trim()} style={{ width: '28px', height: '28px', borderRadius: '6px', background: (isStreaming || !input.trim()) ? '#1f2937' : '#3b82f6', border: 'none', color: (isStreaming || !input.trim()) ? '#4b5563' : 'white', cursor: (isStreaming || !input.trim()) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 120ms ease' }}>
                        <Send size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {activeTab === 'agents' && (
          <motion.div key="agents" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}
          >
            <Cpu size={28} color="#1f2937" />
            <span style={{ fontSize: '12.5px', color: '#4b5563' }}>Agent runtime ready</span>
            <span style={{ fontSize: '11.5px', color: '#1f2937' }}>No active tasks</span>
          </motion.div>
        )}

        {activeTab === 'memory' && (
          <motion.div key="memory" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}
          >
            <Database size={28} color="#1f2937" />
            <span style={{ fontSize: '12.5px', color: '#4b5563' }}>Memory store</span>
            <span style={{ fontSize: '11.5px', color: '#1f2937' }}>0 embeddings stored</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', padding: '3px',
  cursor: 'pointer', color: '#4b5563', borderRadius: '4px',
  display: 'flex', transition: 'color 100ms',
};
