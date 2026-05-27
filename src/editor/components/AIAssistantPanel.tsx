import { FormEvent, useRef, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  X, Send, Bot, User, Paperclip, AtSign, Mic,
  MessageSquare, Cpu, Database, Trash2,
  FileSearch, Wand2, Component, Bug, ChevronDown,
  Play, StopCircle, CheckCircle2, AlertCircle, Loader2,
  Search, Plus, PlusCircle, FileCode, Folder, Calendar, Info, Sparkles,
} from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';
import { NVIDIA_MODELS, NvidiaModel } from '@/services/aiStreamClient';
import { useEditorStore } from '@/store/useEditorStore';
import { useTerminalStore } from '@/store/useTerminalStore';
import { useFileSystemStore } from '@/store/useFileSystemStore';
import { useAgentStore, AGENT_CONFIGS } from '@/store/useAgentStore';
import { useMemoryStore } from '@/store/useMemoryStore';

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

  // `@`-Mentions autocomplete states
  const [mentionActive, setMentionActive] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);

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

  const tree = useFileSystemStore((s) => s.tree);
  const flatPaths = useMemo(() => {
    const paths: string[] = [];
    const walk = (nodes: any[]) => {
      nodes.forEach((node) => {
        if (node.type === 'file') paths.push(node.path);
        if (node.children) walk(node.children);
      });
    };
    walk(tree);
    return paths;
  }, [tree]);

  const filteredPaths = useMemo(() => {
    if (!mentionActive) return [];
    const q = mentionQuery.toLowerCase();
    return flatPaths
      .filter((p) => p.toLowerCase().includes(q))
      .slice(0, 8); // limit top suggestions to 8 items
  }, [flatPaths, mentionActive, mentionQuery]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);

    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = val.substring(0, cursorPosition);
    const lastAtSignIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtSignIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtSignIndex + 1);
      if (!textAfterAt.includes(' ')) {
        setMentionActive(true);
        setMentionQuery(textAfterAt);
        setMentionIndex(0);
        return;
      }
    }
    setMentionActive(false);
  };

  const handleSelectMention = (path: string) => {
    const ta = textareaRef.current;
    if (!ta) return;

    const val = input;
    const cursorPosition = ta.selectionStart;
    const textBeforeCursor = val.substring(0, cursorPosition);
    const textAfterCursor = val.substring(cursorPosition);
    const lastAtSignIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtSignIndex !== -1) {
      const nextText = val.substring(0, lastAtSignIndex) + `@${path} ` + textAfterCursor;
      setInput(nextText);
      setMentionActive(false);

      setTimeout(() => {
        ta.focus();
        const newCursorPos = lastAtSignIndex + path.length + 2; // account for '@' and space
        ta.setSelectionRange(newCursorPos, newCursorPos);
      }, 50);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const contextParts: string[] = [];

    // 1. Inject active file context
    if (activeFile && files[activeFile]) {
      contextParts.push(`\n\nCurrent active file (${activeFile}):\n\`\`\`${files[activeFile].language ?? ''}\n${files[activeFile].content?.slice(0, 3000) ?? ''}\n\`\`\``);
    }

    // 2. Inject terminal logs context
    const termStore = useTerminalStore.getState();
    const activeTerminal = termStore.terminals.find((t) => t.id === termStore.activeId);
    if (activeTerminal?.logs) {
      const logs = activeTerminal.logs.slice(-1500);
      contextParts.push(`\n\nRecent terminal logs from active shell (${activeTerminal.name}):\n\`\`\`\n${logs}\n\`\`\``);
    }

    // 3. Inject monaco compilation errors/diagnostics context
    if (typeof window !== 'undefined' && (window as any).monaco) {
      const monaco = (window as any).monaco;
      const markers = monaco.editor.getModelMarkers({});
      if (markers.length > 0) {
        const errors = markers
          .map((m: any) => `Line ${m.startLineNumber}: ${m.message} (${m.severity === 8 ? 'Error' : 'Warning'})`)
          .slice(0, 10)
          .join('\n');
        contextParts.push(`\n\nMonaco compiler diagnostics & linter markers:\n\`\`\`\n${errors}\n\`\`\``);
      }
    }

    // 4. Inject project tree overview context (flat files listing)
    const fsStore = useFileSystemStore.getState();
    const flatPaths = fsStore.flattenPaths();
    if (flatPaths.length > 0) {
      contextParts.push(`\n\nProject files listing:\n${flatPaths.slice(0, 50).join('\n')}`);
    }

    // 5. Fetch semantic memories
    let semanticMemoriesStr = '';
    try {
      const memories = await useMemoryStore.getState().searchMemory(input, undefined, 4);
      if (memories && memories.length > 0) {
        semanticMemoriesStr = memories
          .map((m) => `[${m.layer}] ${m.title}: ${m.content}`)
          .join('\n');
      }
    } catch (err) {
      console.error('Error fetching semantic memories:', err);
    }

    const fullContext = contextParts.join('\n');
    await sendMessage(fullContext, semanticMemoriesStr);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (mentionActive && filteredPaths.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex((idx) => (idx + 1) % filteredPaths.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex((idx) => (idx - 1 + filteredPaths.length) % filteredPaths.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        handleSelectMention(filteredPaths[mentionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionActive(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault(); 
      void submit(e as any); 
    }
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
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px 0', flexShrink: 0, justifyContent: 'space-between' }}>
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
            <div style={{ borderTop: '1px solid #1f2937', padding: '10px 12px', flexShrink: 0, position: 'relative' }}>
              
              {/* Sleek Glassmorphic Mentions Popover */}
              <AnimatePresence>
                {mentionActive && filteredPaths.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.12 }}
                    style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: '12px',
                      right: '12px',
                      marginBottom: '8px',
                      background: 'rgba(17, 24, 39, 0.92)',
                      backdropFilter: 'blur(16px)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '8px',
                      boxShadow: '0 -10px 25px rgba(0,0,0,0.5)',
                      maxHeight: '180px',
                      overflowY: 'auto',
                      zIndex: 1000,
                      padding: '4px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1px',
                    }}
                  >
                    <div style={{ padding: '6px 8px 4px', fontSize: '10px', fontWeight: 700, color: '#60a5fa', letterSpacing: '0.08em' }}>
                      WORKSPACE FILE MENTIONS
                    </div>
                    {filteredPaths.map((path, idx) => {
                      const isSelected = idx === mentionIndex;
                      const fileparts = path.split('/');
                      const filename = fileparts.pop() ?? path;
                      const dir = fileparts.join('/');

                      return (
                        <button
                          key={path}
                          type="button"
                          onClick={() => handleSelectMention(path)}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            textAlign: 'left',
                            background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '6px 8px',
                            cursor: 'pointer',
                            width: '100%',
                            transition: 'background 80ms',
                          }}
                          onMouseEnter={() => setMentionIndex(idx)}
                        >
                          <span style={{ fontSize: '12.5px', color: isSelected ? '#60a5fa' : '#e2e8f0', fontWeight: isSelected ? 600 : 400 }}>
                            📄 {filename}
                          </span>
                          {dir && (
                            <span style={{ fontSize: '10px', color: '#4b5563', marginTop: '1px' }}>
                              {dir}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

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
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKey}
                    placeholder="Ask anything... (type @ to mention files, Enter to send)"
                    disabled={isStreaming}
                    rows={1}
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
          <AgentWorkspace />
        )}

        {activeTab === 'memory' && (
          <MemoryExplorer />
        )}
      </AnimatePresence>
    </div>
  );
}

function AgentWorkspace() {
  const {
    status,
    currentGoal,
    tasks,
    discussion,
    logs,
    activeAgent,
    agentsState,
    submitGoal,
    cancelGoal,
  } = useAgentStore();

  const [inputGoal, setInputGoal] = useState('');
  const discussionEndRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    discussionEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [discussion]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputGoal.trim() || status !== 'idle') return;
    submitGoal(inputGoal);
    setInputGoal('');
  };

  const isRunning = status !== 'idle' && status !== 'success' && status !== 'failed';
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const progressPercent = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: '#0d1117' }}>
      
      {/* 1. AGENTS GRID STATUS COCKPIT */}
      <div style={{ padding: '12px 14px', background: '#111827', borderBottom: '1px solid #1f2937', flexShrink: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center' }}>
          {Object.entries(AGENT_CONFIGS).map(([id, conf]) => {
            const agentStatus = agentsState[id as any] ?? 'idle';
            const isActive = activeAgent === id;
            
            let statusColor = '#4b5563'; 
            let pulse = false;
            
            if (agentStatus === 'thinking' || agentStatus === 'discussing') {
              statusColor = '#facc15'; 
              pulse = true;
            } else if (agentStatus === 'working') {
              statusColor = '#3b82f6'; 
              pulse = true;
            } else if (agentStatus === 'success') {
              statusColor = '#10b981'; 
            } else if (agentStatus === 'failed') {
              statusColor = '#ef4444'; 
            }

            return (
              <div key={id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }} title={`${conf.name} (${conf.title}): ${agentStatus}`}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: isActive ? `${conf.color}20` : '#1f2937',
                  border: `1.5px solid ${isActive ? conf.color : '#374151'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', transition: 'all 200ms',
                  boxShadow: isActive ? `0 0 10px ${conf.color}40` : 'none'
                }}>
                  {conf.avatar}
                </div>
                
                {agentStatus !== 'idle' && (
                  <motion.span
                    animate={pulse ? { opacity: [0.3, 1, 0.3] } : { opacity: 1 }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    style={{
                      position: 'absolute', bottom: '12px', right: '4px',
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: statusColor,
                      border: '1.5px solid #111827',
                      boxShadow: `0 0 6px ${statusColor}`,
                    }}
                  />
                )}
                
                <span style={{ fontSize: '9px', color: isActive ? '#e2e8f0' : '#4b5563', marginTop: '4px', fontWeight: isActive ? 600 : 400 }}>
                  {id.toUpperCase()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. MAIN ACTIVE VIEWPORTS (DISCUSSIONS / CHECKLIST) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflowY: 'auto', padding: '14px', gap: '14px' }}>
        
        {/* Goal Description card */}
        {currentGoal && (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #1f2937', borderRadius: '8px', padding: '10px 12px', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.05em' }}>ACTIVE GOAL</span>
              <span style={{
                fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px',
                background: status === 'success' ? 'rgba(16,185,129,0.1)' : status === 'failed' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
                color: status === 'success' ? '#10b981' : status === 'failed' ? '#ef4444' : '#3b82f6',
              }}>
                {status.toUpperCase()}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: '1.4' }}>{currentGoal}</div>
            
            {/* Checklist progress bar */}
            {tasks.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#6b7280', marginBottom: '4px' }}>
                  <span>Progress Checklist</span>
                  <span>{progressPercent}% ({completedTasks}/{tasks.length})</span>
                </div>
                <div style={{ height: '4px', background: '#1f2937', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progressPercent}%`, background: '#3b82f6', borderRadius: '2px', transition: 'width 300ms ease' }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Roundtable Agent Discussion Chat */}
        {discussion.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '160px', flexShrink: 0 }}>
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#4b5563', letterSpacing: '0.05em', borderBottom: '1px solid #1f2937', paddingBottom: '4px' }}>
              AGENT ROUNDTABLE DISCUSSION
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
              {discussion.map((msg) => {
                const conf = AGENT_CONFIGS[msg.role] ?? AGENT_CONFIGS.planner;
                return (
                  <div key={msg.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                      background: `${conf.color}15`, border: `1.5px solid ${conf.color}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px'
                    }}>
                      {conf.avatar}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#e2e8f0' }}>{conf.name}</span>
                        <span style={{ fontSize: '9px', color: '#4b5563', background: '#111827', padding: '0px 4px', borderRadius: '3px' }}>{conf.title}</span>
                      </div>
                      <div style={{
                        fontSize: '11.5px', color: '#9ca3af', lineHeight: '1.5',
                        background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.02)',
                        borderRadius: '6px', padding: '6px 8px'
                      }}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={discussionEndRef} />
            </div>
          </div>
        )}

        {/* Live Activity checklist feed */}
        {tasks.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#4b5563', letterSpacing: '0.05em', borderBottom: '1px solid #1f2937', paddingBottom: '4px' }}>
              LIVE ACTIVITY CHECKLIST
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {tasks.map((task) => {
                let icon = <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '1.5px solid #4b5563' }} />;
                
                if (task.status === 'running') {
                  icon = <Loader2 size={12} className="animate-spin" color="#3b82f6" />;
                } else if (task.status === 'done') {
                  icon = <CheckCircle2 size={12} color="#10b981" />;
                } else if (task.status === 'error') {
                  icon = <AlertCircle size={12} color="#ef4444" />;
                }

                return (
                  <div key={task.id} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '8px',
                    background: task.status === 'running' ? 'rgba(59,130,246,0.03)' : 'transparent',
                    borderRadius: '6px', padding: '4px 6px', transition: 'background 150ms'
                  }}>
                    <div style={{ marginTop: '2px', flexShrink: 0 }}>{icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{
                        fontSize: '11.5px', fontWeight: task.status === 'running' ? 600 : 400,
                        color: task.status === 'done' ? '#6b7280' : '#e2e8f0',
                        textDecoration: task.status === 'done' ? 'line-through' : 'none'
                      }}>
                        {task.title}
                      </span>
                      <div style={{ fontSize: '10px', color: '#4b5563', marginTop: '1px' }}>{task.detail}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Execution Log Console */}
        {logs.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#4b5563', letterSpacing: '0.05em', borderBottom: '1px solid #1f2937', paddingBottom: '4px' }}>
              EXECUTION LOG FEED
            </div>
            <div style={{
              background: '#070a0f', border: '1px solid #1f2937', borderRadius: '6px',
              padding: '8px 10px', height: '100px', overflowY: 'auto',
              fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#4b5563',
              display: 'flex', flexDirection: 'column', gap: '4px', lineHeight: '1.4'
            }}>
              {logs.map((logStr, i) => (
                <div key={i} style={{ color: logStr.includes('❌') ? '#ef4444' : logStr.includes('🎉') ? '#10b981' : '#6b7280' }}>
                  {logStr}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}

        {/* Welcome state */}
        {!currentGoal && (
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '24px 0', color: '#4b5563' }}>
            <Cpu size={32} />
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#9ca3af' }}>Multi-Agent System Ready</span>
            <span style={{ fontSize: '11px', textAlign: 'center', maxWidth: '240px', lineHeight: '1.4' }}>
              Submit a coding goal to spawn the roundtable debate, checklist planning, and autonomous execution.
            </span>
          </div>
        )}
      </div>

      {/* 3. INPUT BLOCK CONTROLS */}
      <div style={{ borderTop: '1px solid #1f2937', padding: '10px 12px', flexShrink: 0 }}>
        {isRunning ? (
          <button
            onClick={cancelGoal}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              background: '#ef444415', border: '1px solid #ef444430', borderRadius: '6px',
              color: '#ef4444', fontSize: '12.5px', fontWeight: 600, padding: '7px 0', cursor: 'pointer',
              transition: 'background 120ms'
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#ef444425'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#ef444415'; }}
          >
            <StopCircle size={14} />
            Cancel Execution
          </button>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <textarea
                value={inputGoal}
                onChange={(e) => setInputGoal(e.target.value)}
                placeholder="What is your coding goal today? (e.g. build a search bar component)"
                rows={2}
                style={{
                  width: '100%', background: 'transparent', border: 'none', outline: 'none',
                  color: '#e2e8f0', fontSize: '12.5px', fontFamily: "'Inter', sans-serif",
                  padding: '8px 10px', resize: 'none', lineHeight: '1.5', boxSizing: 'border-box'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 8px 6px', background: '#090d16', borderTop: '1px solid #1f2937' }}>
                <button
                  type="submit"
                  disabled={!inputGoal.trim()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: !inputGoal.trim() ? '#1f2937' : '#3b82f6',
                    border: 'none', borderRadius: '4px',
                    color: !inputGoal.trim() ? '#4b5563' : 'white',
                    fontSize: '11.5px', fontWeight: 600, padding: '4px 10px',
                    cursor: !inputGoal.trim() ? 'not-allowed' : 'pointer',
                    transition: 'all 120ms ease'
                  }}
                >
                  <Play size={10} fill={inputGoal.trim() ? 'white' : 'none'} />
                  Start Agents
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

    </div>
  );
}

function MemoryExplorer() {
  const { entries, upsertMemory, searchMemory, syncFromBackend, getLayerCount } = useMemoryStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [formLayer, setFormLayer] = useState<'code' | 'project' | 'conversation' | 'short' | 'long'>('code');
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formSource, setFormSource] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync memories from backend on mount
  useEffect(() => {
    syncFromBackend();
  }, [syncFromBackend]);

  // Perform search when searchQuery or selectedLayer changes
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const layers = selectedLayer ? [selectedLayer as any] : undefined;
        const results = await searchMemory(searchQuery, layers, 8);
        setSearchResults(results);
      } catch (err) {
        console.error('Failed to search memory:', err);
      } finally {
        setIsSearching(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, selectedLayer, searchMemory]);

  // Determine what to display
  const displayedMemories = useMemo(() => {
    if (searchQuery.trim()) {
      return searchResults;
    }
    // Otherwise filter entries by selected layer if any
    return entries.filter(e => !selectedLayer || e.layer === selectedLayer);
  }, [searchQuery, searchResults, entries, selectedLayer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      setFormMessage({ type: 'error', text: 'Title and Content are required.' });
      return;
    }

    setFormSubmitting(true);
    setFormMessage(null);
    try {
      const tagsArray = formTags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      await upsertMemory({
        layer: formLayer,
        title: formTitle.trim(),
        content: formContent.trim(),
        source: formSource.trim() || undefined,
        tags: tagsArray,
      });

      setFormMessage({ type: 'success', text: 'Memory successfully saved!' });
      setFormTitle('');
      setFormContent('');
      setFormTags('');
      setFormSource('');
      setTimeout(() => {
        setShowAddForm(false);
        setFormMessage(null);
      }, 1500);
    } catch (err: any) {
      setFormMessage({ type: 'error', text: err.message || 'Failed to save memory.' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const getLayerColor = (layer: string) => {
    switch (layer) {
      case 'code': return '#60a5fa'; // Blue
      case 'project': return '#a78bfa'; // Purple
      case 'conversation': return '#34d399'; // Green
      default: return '#9ca3af'; // Grey
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: '#0d1117', color: '#e2e8f0', overflowY: 'auto' }}>
      
      {/* 1. Header & Stats Grid */}
      <div style={{ padding: '12px 14px', background: '#111827', borderBottom: '1px solid #1f2937', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em' }}>SECTORS OVERVIEW</span>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              background: showAddForm ? '#ef444420' : 'rgba(59,130,246,0.15)',
              border: `1px solid ${showAddForm ? '#ef444440' : 'rgba(59,130,246,0.3)'}`,
              borderRadius: '4px', color: showAddForm ? '#ef4444' : '#60a5fa',
              fontSize: '10.5px', fontWeight: 600, padding: '3px 8px', cursor: 'pointer',
              transition: 'all 150ms ease'
            }}
          >
            {showAddForm ? <X size={12} /> : <Plus size={12} />}
            {showAddForm ? 'Cancel' : 'Add Memory'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {[
            { id: 'code', label: 'Code', color: '#60a5fa', desc: 'Syntax/Patterns' },
            { id: 'project', label: 'Project', color: '#a78bfa', desc: 'Architecture' },
            { id: 'conversation', label: 'Chats', color: '#34d399', desc: 'Agent Logs' }
          ].map(layer => {
            const count = getLayerCount(layer.id as any);
            const isSelected = selectedLayer === layer.id;
            return (
              <button
                key={layer.id}
                onClick={() => setSelectedLayer(isSelected ? null : layer.id)}
                style={{
                  background: isSelected ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.01)',
                  border: `1.5px solid ${isSelected ? layer.color : '#1f2937'}`,
                  borderRadius: '6px', padding: '8px 6px', textAlign: 'left',
                  cursor: 'pointer', transition: 'all 200ms',
                  boxShadow: isSelected ? `0 0 8px ${layer.color}25` : 'none',
                }}
                onMouseEnter={(e) => { if(!isSelected) e.currentTarget.style.borderColor = '#374151'; }}
                onMouseLeave={(e) => { if(!isSelected) e.currentTarget.style.borderColor = '#1f2937'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: layer.color }}>{layer.label}</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#f3f4f6', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', padding: '0 4px' }}>
                    {count}
                  </span>
                </div>
                <div style={{ fontSize: '8px', color: '#6b7280', marginTop: '2px' }}>{layer.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Collapsible Form Drawer */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            onSubmit={handleSubmit}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              overflow: 'hidden', background: '#111827',
              borderBottom: '1px solid #1f2937', padding: '12px 14px',
              display: 'flex', flexDirection: 'column', gap: '8px'
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#60a5fa', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <PlusCircle size={12} />
              NEW MEMORY ENTRY
            </div>

            {formMessage && (
              <div style={{
                padding: '6px 8px', borderRadius: '4px', fontSize: '11px',
                background: formMessage.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${formMessage.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                color: formMessage.type === 'success' ? '#34d399' : '#ef4444',
              }}>
                {formMessage.text}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <label style={{ fontSize: '9px', color: '#9ca3af', fontWeight: 600 }}>LAYER</label>
                <select
                  value={formLayer}
                  onChange={(e) => setFormLayer(e.target.value as any)}
                  style={{
                    background: '#0d1117', border: '1px solid #1f2937', borderRadius: '4px',
                    color: '#e2e8f0', fontSize: '11.5px', padding: '4px', outline: 'none'
                  }}
                >
                  <option value="code">Code</option>
                  <option value="project">Project</option>
                  <option value="conversation">Conversation</option>
                  <option value="short">Short Term</option>
                  <option value="long">Long Term</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <label style={{ fontSize: '9px', color: '#9ca3af', fontWeight: 600 }}>SOURCE (OPTIONAL)</label>
                <input
                  type="text"
                  placeholder="e.g. src/App.tsx"
                  value={formSource}
                  onChange={(e) => setFormSource(e.target.value)}
                  style={{
                    background: '#0d1117', border: '1px solid #1f2937', borderRadius: '4px',
                    color: '#e2e8f0', fontSize: '11.5px', padding: '4px 6px', outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <label style={{ fontSize: '9px', color: '#9ca3af', fontWeight: 600 }}>TITLE</label>
              <input
                type="text"
                placeholder="Brief summary title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                style={{
                  background: '#0d1117', border: '1px solid #1f2937', borderRadius: '4px',
                  color: '#e2e8f0', fontSize: '11.5px', padding: '4px 6px', outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <label style={{ fontSize: '9px', color: '#9ca3af', fontWeight: 600 }}>CONTENT / GUIDELINE / CODE SNIPPET</label>
              <textarea
                rows={3}
                placeholder="Enter details to vectorize and remember..."
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                style={{
                  background: '#0d1117', border: '1px solid #1f2937', borderRadius: '4px',
                  color: '#e2e8f0', fontSize: '11.5px', padding: '6px', outline: 'none', resize: 'none',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <label style={{ fontSize: '9px', color: '#9ca3af', fontWeight: 600 }}>TAGS (COMMA SEPARATED)</label>
              <input
                type="text"
                placeholder="e.g. react, hooks, performance"
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
                style={{
                  background: '#0d1117', border: '1px solid #1f2937', borderRadius: '4px',
                  color: '#e2e8f0', fontSize: '11.5px', padding: '4px 6px', outline: 'none'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={formSubmitting}
              style={{
                background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px',
                padding: '6px 0', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                marginTop: '4px'
              }}
            >
              {formSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
              Index Embedding
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* 3. Search Bar */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #1f2937', flexShrink: 0, display: 'flex', gap: '6px', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={13} color="#4b5563" style={{ position: 'absolute', left: '8px' }} />
          <input
            type="text"
            placeholder="Search semantic memory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', background: '#111827', border: '1px solid #1f2937',
              borderRadius: '6px', padding: '6px 8px 6px 26px', fontSize: '12px',
              color: '#e2e8f0', outline: 'none', transition: 'border-color 150ms'
            }}
            onFocus={(e) => e.target.style.borderColor = '#374151'}
            onBlur={(e) => e.target.style.borderColor = '#1f2937'}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '8px', background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', fontSize: '11px' }}
            >
              ×
            </button>
          )}
        </div>
        {selectedLayer && (
          <button
            onClick={() => setSelectedLayer(null)}
            style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid #1f2937',
              borderRadius: '6px', fontSize: '10.5px', color: '#9ca3af', padding: '5px 8px',
              cursor: 'pointer'
            }}
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* 4. Memories List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {isSearching ? (
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#4b5563' }}>
            <Loader2 size={20} className="animate-spin" color="#3b82f6" />
            <span style={{ fontSize: '11.5px' }}>Searching database...</span>
          </div>
        ) : displayedMemories.length === 0 ? (
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '36px 0', color: '#4b5563' }}>
            <Info size={24} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af' }}>No Memories Found</span>
            <span style={{ fontSize: '11px', textAlign: 'center', maxWidth: '200px', lineHeight: '1.4' }}>
              {searchQuery ? 'Try adjusting your search keywords.' : 'No memory logs exist in this layer yet.'}
            </span>
          </div>
        ) : (
          displayedMemories.map((entry) => {
            const layerColor = getLayerColor(entry.layer);
            return (
              <div
                key={entry.id}
                style={{
                  background: 'rgba(255,255,255,0.02)', border: '1px solid #1f2937',
                  borderRadius: '8px', padding: '10px 12px', transition: 'all 200ms',
                  display: 'flex', flexDirection: 'column', gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#e2e8f0' }}>{entry.title}</span>
                  
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {entry.score !== undefined && (
                      <span style={{ fontSize: '9px', fontWeight: 700, color: '#facc15', background: 'rgba(250,204,21,0.1)', padding: '1px 4px', borderRadius: '3px' }}>
                        {Math.round(entry.score * 100)}% Match
                      </span>
                    )}
                    <span style={{
                      fontSize: '9px', fontWeight: 700, textTransform: 'uppercase',
                      color: layerColor, background: `${layerColor}15`,
                      padding: '1px 5px', borderRadius: '3px', border: `1px solid ${layerColor}25`
                    }}>
                      {entry.layer}
                    </span>
                  </div>
                </div>

                <div style={{
                  fontSize: '11.5px', color: '#9ca3af', lineHeight: '1.5',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  background: '#070a0f', border: '1px solid #141b24', borderRadius: '4px', padding: '6px 8px'
                }}>
                  {entry.content}
                </div>

                {(entry.source || (entry.tags && entry.tags.length > 0)) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                    {entry.source ? (
                      <span style={{ fontSize: '9px', color: '#4b5563', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Folder size={9} />
                        {entry.source}
                      </span>
                    ) : <div />}

                    {entry.tags && entry.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {entry.tags.map(tag => (
                          <span key={tag} style={{ fontSize: '9px', color: '#6b7280', background: 'rgba(255,255,255,0.03)', padding: '1px 4px', borderRadius: '3px' }}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', padding: '3px',
  cursor: 'pointer', color: '#4b5563', borderRadius: '4px',
  display: 'flex', transition: 'color 100ms',
};
