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
  History, GitFork, Brain, Moon, Shield, Map, Activity, BookOpen, ShieldAlert, MessageCircle, TrendingUp, Copy
} from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';
import { NVIDIA_MODELS, NvidiaModel } from '@/services/aiStreamClient';
import { useEditorStore } from '@/store/useEditorStore';
import { useTerminalStore } from '@/store/useTerminalStore';
import { useFileSystemStore } from '@/store/useFileSystemStore';
import { useAgentStore, AGENT_CONFIGS } from '@/store/useAgentStore';
import { useMemoryStore } from '@/store/useMemoryStore';
import ChatSidebar from './ChatSidebar';
import ProjectBrainPanel from './ProjectBrainPanel';
import CtoReportCard from './CtoReportCard';
import { useCtoStore } from '@/store/useCtoStore';
import { useDreamStore } from '@/store/useDreamStore';
import { useProjectBrainStore } from '@/store/useProjectBrainStore';
import { useHealthStore } from '@/store/useHealthStore';
import { ArchitectureMapPanel } from './ArchitectureMapPanel';
import { ImpactAnalysisPanel } from './ImpactAnalysisPanel';
import { ProjectHealthPanel } from './ProjectHealthPanel';
import { ProjectWikiPanel } from './ProjectWikiPanel';
import { AiLearningPanel } from './AiLearningPanel';
import { ProjectConversationPanel } from './ProjectConversationPanel';
import { FutureSimulationPanel } from './FutureSimulationPanel';
import { FailurePredictionPanel } from './FailurePredictionPanel';

type Props  = { onClose: () => void };
type PanelTab = 'chat' | 'agents' | 'memory' | 'brain' | 'archmap' | 'impact' | 'health' | 'wiki' | 'dna' | 'talk' | 'sim' | 'predict';

const quickActions = [
  { icon: FileSearch, title: 'Explain this code',   desc: 'Explain the selected code in detail.',    color: '#60a5fa', prompt: 'Explain the current file code clearly and in detail.' },
  { icon: Wand2,      title: 'Refactor this code',  desc: 'Improve structure and readability.',       color: '#a78bfa', prompt: 'Refactor this code for better structure, readability, and performance.' },
  { icon: Component,  title: 'Generate component',  desc: 'Create a new React component.',            color: '#34d399', prompt: 'Generate a well-typed React component for this use case with TypeScript.' },
  { icon: Bug,        title: 'Find bugs',           desc: 'Detect and fix issues in code.',           color: '#f87171', prompt: 'Find all bugs, edge cases, and potential issues in the current file and fix them.' },
];

const CATEGORY_LABELS: Record<string, string> = {
  coding:    'âš¡ Coding',
  reasoning: 'ðŸ§  Reasoning',
  general:   'ðŸ’¬ General',
  vision:    'ðŸ‘ï¸ Vision',
  mini:      'ðŸš€ Mini / Fast',
};

export function AIAssistantPanel({ onClose }: Props) {
  const {
    messages, input, isStreaming, model, error,
    setInput, setModel, sendMessage, clearChat, clearError,
    forkConversation, loadConversations
  } = useChatStore();
  const { files, activeFile } = useEditorStore();

  const { brain, scanStatus, scanProgress } = useProjectBrainStore();
  const { healthScore, categories, suggestions } = useHealthStore();

  const riskAreas = useMemo(() => {
    const list: string[] = [];
    const securityCat = categories.find(c => c.name === 'security');
    const performanceCat = categories.find(c => c.name === 'performance');
    const maintainabilityCat = categories.find(c => c.name === 'maintainability');
    if (securityCat && securityCat.score < 90) list.push('Auth & Credentials');
    if (brain.stack.stateManager === 'Unknown') list.push('State Management');
    if (performanceCat && performanceCat.score < 90) list.push('Performance');
    if (maintainabilityCat && maintainabilityCat.score < 90) list.push('Complexity & Nesting');
    if (list.length === 0) {
      list.push(brain.stack.framework === 'Unknown' ? 'Analysis Pending' : 'None detected');
    }
    return list;
  }, [categories, brain.stack.stateManager, brain.stack.framework]);

  const { lastReport, ctoEnabled, toggleCto, isAnalyzing } = useCtoStore();
  const { isDreamMode, toggleDreamMode, startDream } = useDreamStore();

  const [activeTab, setActiveTab] = useState<PanelTab>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const workspacePath = useFileSystemStore((s) => s.workspacePath);
  const openTabsCount = Object.keys(files).length;

  useEffect(() => { void loadConversations(); }, [workspacePath, loadConversations]);

  useEffect(() => {
    const handleTabChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.tab) setActiveTab(customEvent.detail.tab);
    };
    window.addEventListener('nexo-assistant-tab', handleTabChange);
    return () => window.removeEventListener('nexo-assistant-tab', handleTabChange);
  }, []);

  const [mentionActive, setMentionActive] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isStreaming]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [input]);

  const tree = useFileSystemStore((s) => s.tree);
  const flatPaths = useMemo(() => {
    const paths: string[] = [];
    const walk = (nodes: any[]) => { nodes.forEach((node) => { if (node.type === 'file') paths.push(node.path); if (node.children) walk(node.children); }); };
    walk(tree);
    return paths;
  }, [tree]);

  const filteredPaths = useMemo(() => {
    if (!mentionActive) return [];
    const q = mentionQuery.toLowerCase();
    return flatPaths.filter((p) => p.toLowerCase().includes(q)).slice(0, 8);
  }, [flatPaths, mentionActive, mentionQuery]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = val.substring(0, cursorPosition);
    const lastAtSignIndex = textBeforeCursor.lastIndexOf('@');
    if (lastAtSignIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtSignIndex + 1);
      if (!textAfterAt.includes(' ')) { setMentionActive(true); setMentionQuery(textAfterAt); setMentionIndex(0); return; }
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
      setTimeout(() => { ta.focus(); const pos = lastAtSignIndex + path.length + 2; ta.setSelectionRange(pos, pos); }, 50);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    if (isDreamMode) { const goalText = input.trim(); setInput(''); void startDream(goalText); return; }
    const contextParts: string[] = [];
    const brainStore = useProjectBrainStore.getState();
    const brainContext = brainStore.getBrainContext();
    if (brainContext) contextParts.push(`\n\n[Project DNA Brain Context]:\n${brainContext}`);
    if (activeFile && files[activeFile]) contextParts.push(`\n\nCurrent active file (${activeFile}):\n\`\`\`${files[activeFile].language ?? ''}\n${files[activeFile].content?.slice(0, 3000) ?? ''}\n\`\`\``);
    const termStore = useTerminalStore.getState();
    const activeTerminal = termStore.terminals.find((t) => t.id === termStore.activeId);
    if (activeTerminal?.logs) contextParts.push(`\n\nRecent terminal logs (${activeTerminal.name}):\n\`\`\`\n${activeTerminal.logs.slice(-1500)}\n\`\`\``);
    if (typeof window !== 'undefined' && (window as any).monaco) {
      const markers = (window as any).monaco.editor.getModelMarkers({});
      if (markers.length > 0) { const errors = markers.map((m: any) => `Line ${m.startLineNumber}: ${m.message} (${m.severity === 8 ? 'Error' : 'Warning'})`).slice(0, 10).join('\n'); contextParts.push(`\n\nMonaco diagnostics:\n\`\`\`\n${errors}\n\`\`\``); }
    }
    const fsFlat = useFileSystemStore.getState().flattenPaths();
    if (fsFlat.length > 0) contextParts.push(`\n\nProject files:\n${fsFlat.slice(0, 50).join('\n')}`);
    let semanticMemoriesStr = '';
    try {
      const memories = await useMemoryStore.getState().searchMemory(input, undefined, 4);
      if (memories?.length > 0) semanticMemoriesStr = memories.map((m) => `[${m.layer}] ${m.title}: ${m.content}`).join('\n');
    } catch (err) { console.error('Error fetching semantic memories:', err); }
    await sendMessage(contextParts.join('\n'), semanticMemoriesStr);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (mentionActive && filteredPaths.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIndex((idx) => (idx + 1) % filteredPaths.length); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setMentionIndex((idx) => (idx - 1 + filteredPaths.length) % filteredPaths.length); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); handleSelectMention(filteredPaths[mentionIndex]); return; }
      if (e.key === 'Escape') { e.preventDefault(); setMentionActive(false); return; }
    }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void submit(e as any); }
  };

  const currentModel = NVIDIA_MODELS.find((m) => m.id === model) ?? NVIDIA_MODELS[0];
  const grouped = NVIDIA_MODELS.reduce<Record<string, NvidiaModel[]>>((acc, m) => { (acc[m.category] = acc[m.category] ?? []).push(m); return acc; }, {});

  const tabs: { id: PanelTab; label: string; icon: React.ElementType }[] = [
    { id: 'chat',    label: 'CHAT',        icon: MessageSquare },
    { id: 'talk',    label: 'ASK PROJECT', icon: MessageCircle },
    { id: 'brain',   label: 'BRAIN',       icon: Brain },
    { id: 'impact',  label: 'RISK',        icon: ShieldAlert },
    { id: 'health',  label: 'HEALTH',      icon: Activity },
    { id: 'agents',  label: 'AGENTS',      icon: Cpu },
    { id: 'memory',  label: 'MEMORY',      icon: Database },
    { id: 'archmap', label: 'MAP',         icon: Map },
    { id: 'wiki',    label: 'WIKI',        icon: BookOpen },
    { id: 'dna',     label: 'DNA',         icon: Sparkles },
    { id: 'sim',     label: 'SIM',         icon: TrendingUp },
    { id: 'predict', label: 'PREDICT',     icon: AlertCircle },
  ];

  const panelIconBtn: React.CSSProperties = { background: 'transparent', border: 'none', borderRadius: '5px', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5px', transition: 'color 120ms' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0d1117', borderLeft: '1px solid #1f2937', position: 'relative', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderBottom: '1px solid #1f2937', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', color: '#e2e8f0' }}>NEXO AI</span>
          {isDreamMode && <span style={{ fontSize: '9px', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: '#a78bfa', padding: '1px 7px', borderRadius: '999px', fontWeight: 700 }}>DREAM</span>}
          {ctoEnabled && <span style={{ fontSize: '9px', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#c084fc', padding: '1px 7px', borderRadius: '999px', fontWeight: 700 }}>CTO</span>}
        </div>
        <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
          <button onClick={clearChat} title="Clear conversation" style={panelIconBtn}><Trash2 size={12} /></button>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} title="Chat history" style={{ ...panelIconBtn, color: sidebarOpen ? '#3b82f6' : '#6b7280' }}><History size={12} /></button>
          <button onClick={onClose} title="Close" style={panelIconBtn}><X size={12} /></button>
        </div>
      </div>

      {/* ── Tabs — icon only ── */}
      <div style={{ display: 'flex', padding: '6px 8px 0', borderBottom: '1px solid #1f2937', flexShrink: 0, overflowX: 'auto', gap: '2px', scrollbarWidth: 'none' }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} title={tab.label}
              style={{ background: isActive ? 'rgba(59,130,246,0.12)' : 'transparent', border: 'none', borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent', borderRadius: '4px 4px 0 0', color: isActive ? '#60a5fa' : '#6b7280', padding: '5px 9px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'color 120ms, border-color 120ms, background 120ms', marginBottom: '-1px' }}
              onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af'; }}
              onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = '#6b7280'; }}
            >
              <Icon size={13} />
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'chat' && (
          <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'row', minHeight: 0 }}
          >
            {sidebarOpen && <ChatSidebar />}

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

              {/* ── Messages ── */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* Error banner */}
                {error && (
                  <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#f87171', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{error}</span>
                    <button onClick={clearError} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}>×</button>
                  </div>
                )}

                {/* ── Welcome / empty state ── */}
                {messages.length === 0 && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 4px' }}
                  >
                    {/* NEXO greeting */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 600, color: '#e2e8f0', letterSpacing: '-0.01em' }}>
                        How can I help you today?
                      </span>
                      <p style={{ fontSize: '13px', color: '#8b9ab2', lineHeight: '1.6', margin: 0 }}>
                        Ask questions, refactor code, find bugs, or run tasks. I have full context of your workspace files and terminal.
                      </p>
                    </div>

                    {/* Compact Project status row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#8b9ab2', background: 'rgba(59,130,246,0.03)', border: '1px solid rgba(59,130,246,0.08)', borderRadius: '999px', padding: '4px 12px', width: 'fit-content' }}>
                      <Sparkles size={11} color="#60a5fa" />
                      <span>Workspace scanned</span>
                      {brain.stack.framework !== 'Unknown' && (
                        <>
                          <span style={{ color: '#1f2937' }}>·</span>
                          <span style={{ color: '#a78bfa', fontWeight: 500 }}>{brain.stack.framework}</span>
                        </>
                      )}
                      {suggestions.length > 0 && (
                        <>
                          <span style={{ color: '#1f2937' }}>·</span>
                          <span>{suggestions.length} suggestions</span>
                        </>
                      )}
                    </div>

                    {/* Quick actions row */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                      {quickActions.map((action) => {
                        const Icon = action.icon;
                        return (
                          <button key={action.title} onClick={() => setInput(action.prompt)}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.02)', border: '1px solid #1f2937', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', textAlign: 'left', transition: 'all 120ms', fontSize: '11.5px', color: '#c9d1d9', fontWeight: 500 }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#374151'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.02)'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#1f2937'; }}
                          >
                            <Icon size={12} color={action.color} />
                            <span>{action.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* ── Message list ── */}
                <AnimatePresence initial={false}>
                  {messages.map((msg) => {
                    const isUser = msg.role === 'user';

                    if (isUser) {
                      return (
                        <motion.div key={msg.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                          style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
                        >
                          {/* Label row */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                            <div style={{ width: '20px', height: '20px', borderRadius: '5px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <User size={11} color="#8b9ab2" />
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#8b9ab2', letterSpacing: '0.05em' }}>YOU</span>
                          </div>
                          {/* Content — no bubble */}
                          <div style={{ fontSize: '13.5px', lineHeight: '1.65', color: '#e2e8f0', paddingLeft: '27px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {msg.content}
                          </div>
                        </motion.div>
                      );
                    }

                    /* AI message — no bubble, clean block */
                    return (
                      <motion.div key={msg.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
                      >
                        {/* Label row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                          <div style={{ width: '20px', height: '20px', borderRadius: '5px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Bot size={11} color="#60a5fa" />
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#60a5fa', letterSpacing: '0.05em' }}>NEXO</span>
                          {msg.model && <span style={{ fontSize: '9.5px', color: '#4b5e78', fontFamily: "'JetBrains Mono', monospace" }}>{msg.model.split('/').pop()}</span>}
                        </div>

                        {/* Content — with prose class for styling code blocks and typography */}
                        <div className="prose-ide" style={{ paddingLeft: '27px', minWidth: 0 }}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content || (isStreaming ? ' ' : '')}</ReactMarkdown>
                        </div>

                        {/* Action strip */}
                        <div style={{ display: 'flex', gap: '12px', paddingLeft: '27px', marginTop: '4px' }}>
                          <button onClick={() => navigator.clipboard.writeText(msg.content)}
                            style={{ background: 'none', border: 'none', color: '#4b5e78', cursor: 'pointer', fontSize: '10.5px', fontWeight: 600, padding: 0, transition: 'color 120ms' }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#8b9ab2'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#4b5e78'; }}
                          >Copy</button>
                          {msg.content.includes('```') && (
                            <button
                              style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '10.5px', fontWeight: 600, padding: 0, transition: 'color 120ms' }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#60a5fa'; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#3b82f6'; }}
                            >Apply</button>
                          )}
                          <button onClick={() => setInput(`Explain this more simply: "${msg.content.slice(0, 160)}"`)}
                            style={{ background: 'none', border: 'none', color: '#4b5e78', cursor: 'pointer', fontSize: '10.5px', fontWeight: 600, padding: 0, transition: 'color 120ms' }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#8b9ab2'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#4b5e78'; }}
                          >Explain</button>
                          {msg.id && (
                            <button onClick={() => { const t = prompt('Branch name:', 'Forked branch'); if (t !== null) void forkConversation(msg.id, t); }}
                              style={{ background: 'none', border: 'none', color: '#4b5e78', cursor: 'pointer', fontSize: '10.5px', fontWeight: 600, padding: 0, transition: 'color 120ms' }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#8b9ab2'; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#4b5e78'; }}
                            >Fork</button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* ── AI Thinking Single-Line Progress ── */}
                {isStreaming && !messages[messages.length - 1]?.content && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 10px', background: 'rgba(59,130,246,0.03)', border: '1px solid rgba(59,130,246,0.08)', borderRadius: '6px', width: 'fit-content', marginLeft: '27px' }}
                  >
                    <Loader2 size={11} color="#60a5fa" className="animate-spin" />
                    <span style={{ fontSize: '11px', color: '#8b9ab2', fontFamily: 'var(--font-ui)' }}>
                      Nexo is thinking...
                    </span>
                  </motion.div>
                )}

                {/* CTO Report */}
                {lastReport && !lastReport.dismissed && (
                  <div style={{ marginTop: '4px' }}><CtoReportCard report={lastReport} /></div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* ── Context Bar ── */}
              <div style={{ padding: '5px 14px', background: '#080c14', borderTop: '1px solid #111827', display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: '#2d3748', letterSpacing: '0.1em' }}>CTX</span>
                <span style={{ fontSize: '10px', color: '#4b5e78' }}>
                  {workspacePath ? workspacePath.split(/[\\/]/).pop() : 'No project'}
                </span>
                {openTabsCount > 0 && (
                  <>
                    <span style={{ fontSize: '10px', color: '#1f2937' }}>·</span>
                    <span style={{ fontSize: '10px', color: '#4b5e78' }}>{openTabsCount} file{openTabsCount !== 1 ? 's' : ''}</span>
                  </>
                )}
                {activeFile && (
                  <>
                    <span style={{ fontSize: '10px', color: '#1f2937' }}>·</span>
                    <span style={{ fontSize: '10px', color: '#3b82f6', fontFamily: "'JetBrains Mono', monospace", maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {activeFile.split('/').pop()}
                    </span>
                  </>
                )}
              </div>

              {/* ── Input Area ── */}
              <div style={{ borderTop: '1px solid #1f2937', padding: '10px 12px 12px', flexShrink: 0, position: 'relative' }}>

                {/* @mention popover */}
                <AnimatePresence>
                  {mentionActive && filteredPaths.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }} transition={{ duration: 0.12 }}
                      style={{ position: 'absolute', bottom: '100%', left: '12px', right: '12px', marginBottom: '8px', background: 'rgba(14,20,36,0.97)', backdropFilter: 'blur(16px)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '10px', boxShadow: '0 -10px 25px rgba(0,0,0,0.5)', maxHeight: '180px', overflowY: 'auto', zIndex: 1000, padding: '4px', display: 'flex', flexDirection: 'column', gap: '1px' }}
                    >
                      <div style={{ padding: '6px 8px 4px', fontSize: '9px', fontWeight: 700, color: '#3b82f6', letterSpacing: '0.1em' }}>FILE MENTIONS</div>
                      {filteredPaths.map((path, idx) => {
                        const isSelected = idx === mentionIndex;
                        const parts = path.split('/');
                        const filename = parts.pop() ?? path;
                        const dir = parts.join('/');
                        return (
                          <button key={path} type="button" onClick={() => handleSelectMention(path)} onMouseEnter={() => setMentionIndex(idx)}
                            style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', background: isSelected ? 'rgba(59,130,246,0.1)' : 'transparent', border: 'none', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer', width: '100%', transition: 'background 80ms' }}
                          >
                            <span style={{ fontSize: '12px', color: isSelected ? '#60a5fa' : '#e2e8f0', fontWeight: isSelected ? 600 : 400 }}>{filename}</span>
                            {dir && <span style={{ fontSize: '10px', color: '#374151', marginTop: '1px' }}>{dir}</span>}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Rounded composer */}
                <form onSubmit={submit}>
                  <div
                    style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '12px', overflow: 'hidden', transition: 'border-color 150ms' }}
                    onFocusCapture={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#2d3748'; }}
                    onBlurCapture={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#1f2937'; }}
                  >
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={handleTextareaChange}
                      onKeyDown={handleKey}
                      placeholder={isDreamMode ? 'Describe your goal for autonomous execution...' : 'Ask NEXO anything...'}
                      disabled={isStreaming}
                      rows={1}
                      style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#e5e7eb', fontSize: '13px', fontFamily: "'Inter', sans-serif", padding: '11px 14px 4px', resize: 'none', lineHeight: '1.55', minHeight: '44px', boxSizing: 'border-box' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px 8px' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Integrated Model Selector */}
                        <div style={{ position: 'relative' }}>
                          <button type="button" onClick={() => setModelOpen((v) => !v)}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#0d1117', border: '1px solid #1f2937', borderRadius: '6px', color: '#8b9ab2', fontSize: '10px', padding: '3px 8px', cursor: 'pointer', transition: 'all 120ms', fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            {currentModel.label.split(' ')[0]}
                            <ChevronDown size={8} style={{ transform: modelOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
                          </button>
                          <AnimatePresence>
                            {modelOpen && (
                              <motion.div initial={{ opacity: 0, y: 4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.98 }} transition={{ duration: 0.12 }}
                                style={{ position: 'absolute', bottom: '120%', left: 0, width: '220px', background: '#0d1117', border: '1px solid #1f2937', borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.7)', zIndex: 100, maxHeight: '240px', overflowY: 'auto' }}
                              >
                                {Object.entries(grouped).map(([cat, models]) => (
                                  <div key={cat}>
                                    <div style={{ padding: '6px 10px 3px', fontSize: '8.5px', fontWeight: 700, letterSpacing: '0.08em', color: '#4b5e78', background: '#080c14', position: 'sticky', top: 0 }}>
                                      {CATEGORY_LABELS[cat] ?? cat.toUpperCase()}
                                    </div>
                                    {models.map((m) => (
                                      <button key={m.id} type="button" onClick={() => { setModel(m.id); setModelOpen(false); }}
                                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: m.id === model ? 'rgba(59,130,246,0.06)' : 'transparent', border: 'none', padding: '6px 10px', cursor: 'pointer', textAlign: 'left', transition: 'background 80ms' }}
                                        onMouseEnter={(e) => { if (m.id !== model) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.02)'; }}
                                        onMouseLeave={(e) => { if (m.id !== model) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                                      >
                                        <div>
                                          <div style={{ fontSize: '11.5px', color: m.id === model ? '#60a5fa' : '#e2e8f0', fontWeight: m.id === model ? 600 : 400 }}>{m.label}</div>
                                          <div style={{ fontSize: '9.5px', color: '#4b5e78', marginTop: '1px' }}>{m.provider}</div>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {(['@file', '@project', '@terminal'] as const).map((tag) => (
                          <button key={tag} type="button"
                            onClick={() => { setInput(input + tag + ' '); textareaRef.current?.focus(); }}
                            style={{ fontSize: '10px', color: '#8b9ab2', background: 'transparent', border: '1px solid #1f2937', borderRadius: '6px', padding: '3px 8px', cursor: 'pointer', fontWeight: 500, transition: 'all 120ms', fontFamily: "'Inter', sans-serif" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#e2e8f0'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#374151'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#8b9ab2'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#1f2937'; }}
                          >{tag}</button>
                        ))}
                        <button type="button" onClick={toggleDreamMode}
                          style={{ fontSize: '10px', color: isDreamMode ? '#a78bfa' : '#8b9ab2', background: isDreamMode ? 'rgba(139,92,246,0.06)' : 'transparent', border: isDreamMode ? '1px solid rgba(139,92,246,0.2)' : '1px solid #1f2937', borderRadius: '6px', padding: '3px 8px', cursor: 'pointer', fontWeight: 500, transition: 'all 120ms', fontFamily: "'Inter', sans-serif" }}
                        >◆ dream</button>
                      </div>
                      <button type="submit" disabled={isStreaming || !input.trim()}
                        style={{ width: '26px', height: '26px', borderRadius: '6px', background: (isStreaming || !input.trim()) ? '#111827' : '#3b82f6', border: (isStreaming || !input.trim()) ? '1px solid #1f2937' : 'none', color: (isStreaming || !input.trim()) ? '#4b5e78' : 'white', cursor: (isStreaming || !input.trim()) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 120ms ease', flexShrink: 0 }}
                      >
                        <Send size={11} />
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'agents'  && <AgentWorkspace />}
        {activeTab === 'memory'  && <MemoryExplorer />}
        {activeTab === 'brain'   && <ProjectBrainPanel />}
        {activeTab === 'archmap' && <ArchitectureMapPanel />}
        {activeTab === 'impact'  && <ImpactAnalysisPanel />}
        {activeTab === 'health'  && <ProjectHealthPanel />}
        {activeTab === 'wiki'    && <ProjectWikiPanel />}
        {activeTab === 'dna'     && <AiLearningPanel />}
        {activeTab === 'talk'    && <ProjectConversationPanel />}
        {activeTab === 'sim'     && <FutureSimulationPanel />}
        {activeTab === 'predict' && <FailurePredictionPanel />}
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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: 'var(--bg-base)' }}>
      
      {/* 1. AGENTS GRID STATUS COCKPIT */}
      <div style={{ padding: '12px 14px', background: 'var(--bg-sidebar)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
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
                  background: isActive ? `${conf.color}20` : 'var(--bg-input)',
                  border: `1.5px solid ${isActive ? conf.color : 'var(--border)'}`,
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
                      border: '1.5px solid var(--bg-sidebar)',
                      boxShadow: `0 0 6px ${statusColor}`,
                    }}
                  />
                )}
                
                <span style={{ fontSize: '9px', color: isActive ? 'var(--text-primary)' : 'var(--text-muted)', marginTop: '4px', fontWeight: isActive ? 600 : 400 }}>
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
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>ACTIVE GOAL</span>
              <span style={{
                fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px',
                background: status === 'success' ? 'rgba(16,185,129,0.1)' : status === 'failed' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
                color: status === 'success' ? '#10b981' : status === 'failed' ? '#ef4444' : '#3b82f6',
              }}>
                {status.toUpperCase()}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: '1.4' }}>{currentGoal}</div>
            
            {/* Checklist progress bar */}
            {tasks.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  <span>Progress Checklist</span>
                  <span>{progressPercent}% ({completedTasks}/{tasks.length})</span>
                </div>
                <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progressPercent}%`, background: 'var(--accent)', borderRadius: '2px', transition: 'width 300ms ease' }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Roundtable Agent Discussion Chat */}
        {discussion.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '160px', flexShrink: 0 }}>
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
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
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>{conf.name}</span>
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)', background: 'var(--bg-sidebar)', padding: '0px 4px', borderRadius: '3px' }}>{conf.title}</span>
                      </div>
                      <div style={{
                        fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: '1.5',
                        background: 'var(--bg-input)', border: '1px solid var(--border)',
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
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
              LIVE ACTIVITY CHECKLIST
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {tasks.map((task) => {
                let icon = <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '1.5px solid var(--border)' }} />;
                
                if (task.status === 'running') {
                  icon = <Loader2 size={12} className="animate-spin" color="var(--accent)" />;
                } else if (task.status === 'done') {
                  icon = <CheckCircle2 size={12} color="var(--green)" />;
                } else if (task.status === 'error') {
                  icon = <AlertCircle size={12} color="var(--red)" />;
                }

                return (
                  <div key={task.id} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '8px',
                    background: task.status === 'running' ? 'var(--bg-hover)' : 'transparent',
                    borderRadius: '6px', padding: '4px 6px', transition: 'background 150ms'
                  }}>
                    <div style={{ marginTop: '2px', flexShrink: 0 }}>{icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{
                        fontSize: '11.5px', fontWeight: task.status === 'running' ? 600 : 400,
                        color: task.status === 'done' ? 'var(--text-muted)' : 'var(--text-primary)',
                        textDecoration: task.status === 'done' ? 'line-through' : 'none'
                      }}>
                        {task.title}
                      </span>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>{task.detail}</div>
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
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
              EXECUTION LOG FEED
            </div>
            <div style={{
              background: 'var(--bg-sidebar)', border: '1px solid var(--border)', borderRadius: '6px',
              padding: '8px 10px', height: '100px', overflowY: 'auto',
              fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--text-muted)',
              display: 'flex', flexDirection: 'column', gap: '4px', lineHeight: '1.4'
            }}>
              {logs.map((logStr, i) => (
                <div key={i} style={{ color: logStr.includes('❌') ? 'var(--red)' : logStr.includes('🎉') ? 'var(--green)' : 'var(--text-secondary)' }}>
                  {logStr}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}

        {/* Welcome state */}
        {!currentGoal && (
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '24px 0', color: 'var(--text-muted)' }}>
            <Cpu size={32} />
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>Multi-Agent System Ready</span>
            <span style={{ fontSize: '11px', textAlign: 'center', maxWidth: '240px', lineHeight: '1.4' }}>
              Submit a coding goal to spawn the roundtable debate, checklist planning, and autonomous execution.
            </span>
          </div>
        )}
      </div>

      {/* 3. INPUT BLOCK CONTROLS */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '10px 12px', flexShrink: 0 }}>
        {isRunning ? (
          <button
            onClick={cancelGoal}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px',
              color: 'var(--red)', fontSize: '12.5px', fontWeight: 600, padding: '7px 0', cursor: 'pointer',
              transition: 'background 120ms'
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239, 68, 68, 0.12)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239, 68, 68, 0.06)'; }}
          >
            <StopCircle size={14} />
            Cancel Execution
          </button>
        ) : (
          <form onSubmit={handleSubmit}>
            <div
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 0 12px rgba(99, 102, 241, 0.04)',
                transition: 'all 200ms ease',
              }}
              onFocus={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = 'var(--accent)';
                el.style.boxShadow = '0 0 20px rgba(99, 102, 241, 0.12), 0 0 4px rgba(168, 85, 247, 0.08)';
              }}
              onBlur={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = 'var(--border)';
                el.style.boxShadow = '0 0 12px rgba(99, 102, 241, 0.04)';
              }}
            >
              <textarea
                value={inputGoal}
                onChange={(e) => setInputGoal(e.target.value)}
                placeholder="What is your coding goal today? (e.g. build a search bar component)"
                rows={2}
                style={{
                  width: '100%', background: 'transparent', border: 'none', outline: 'none',
                  color: 'var(--text-primary)', fontSize: '12.5px', fontFamily: "'Inter', sans-serif",
                  padding: '8px 10px', resize: 'none', lineHeight: '1.5', boxSizing: 'border-box'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 8px 6px', background: 'var(--bg-sidebar)', borderTop: '1px solid var(--border)' }}>
                <button
                  type="submit"
                  disabled={!inputGoal.trim()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: !inputGoal.trim() ? 'var(--border)' : 'var(--accent)',
                    border: 'none', borderRadius: '4px',
                    color: !inputGoal.trim() ? 'var(--text-muted)' : 'white',
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

  const getLayerStyle = (layer: string) => {
    switch (layer) {
      case 'code':
        return {
          color: 'var(--accent)',
          background: 'var(--accent-dim)',
          borderColor: 'rgba(59, 130, 246, 0.2)'
        };
      case 'project':
        return {
          color: 'var(--purple)',
          background: 'rgba(167, 139, 250, 0.08)',
          borderColor: 'rgba(167, 139, 250, 0.2)'
        };
      case 'conversation':
        return {
          color: 'var(--green)',
          background: 'rgba(16, 185, 129, 0.08)',
          borderColor: 'rgba(16, 185, 129, 0.2)'
        };
      default:
        return {
          color: 'var(--text-secondary)',
          background: 'var(--bg-active)',
          borderColor: 'var(--border)'
        };
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: 'var(--bg-base)', color: 'var(--text-primary)', overflowY: 'auto' }}>
      
      {/* 1. Header & Stats Grid */}
      <div style={{ padding: '12px 14px', background: 'var(--bg-sidebar)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>SECTORS OVERVIEW</span>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              background: showAddForm ? 'rgba(239, 68, 68, 0.08)' : 'var(--accent-dim)',
              border: `1px solid ${showAddForm ? 'rgba(239, 68, 68, 0.25)' : 'rgba(59, 130, 246, 0.25)'}`,
              borderRadius: '4px', color: showAddForm ? 'var(--red)' : 'var(--accent)',
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
            { id: 'code', label: 'Code', color: 'var(--accent)', desc: 'Syntax/Patterns' },
            { id: 'project', label: 'Project', color: 'var(--purple)', desc: 'Architecture' },
            { id: 'conversation', label: 'Chats', color: 'var(--green)', desc: 'Agent Logs' }
          ].map(layer => {
            const count = getLayerCount(layer.id as any);
            const isSelected = selectedLayer === layer.id;
            return (
              <button
                key={layer.id}
                onClick={() => setSelectedLayer(isSelected ? null : layer.id)}
                style={{
                  background: isSelected ? 'var(--bg-active)' : 'transparent',
                  border: '1.5px solid',
                  borderColor: isSelected ? layer.color : 'var(--border)',
                  borderRadius: '6px', padding: '8px 6px', textAlign: 'left',
                  cursor: 'pointer', transition: 'all 200ms',
                }}
                onMouseEnter={(e) => { if(!isSelected) e.currentTarget.style.borderColor = 'var(--border-light)'; }}
                onMouseLeave={(e) => { if(!isSelected) e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: layer.color }}>{layer.label}</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', background: 'var(--bg-active)', borderRadius: '3px', padding: '0 4px' }}>
                    {count}
                  </span>
                </div>
                <div style={{ fontSize: '8px', color: 'var(--text-muted)', marginTop: '2px' }}>{layer.desc}</div>
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
              overflow: 'hidden', background: 'var(--bg-sidebar)',
              borderBottom: '1px solid var(--border)', padding: '12px 14px',
              display: 'flex', flexDirection: 'column', gap: '8px'
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <PlusCircle size={12} />
              NEW MEMORY ENTRY
            </div>

            {formMessage && (
              <div style={{
                padding: '6px 8px', borderRadius: '4px', fontSize: '11px',
                background: formMessage.type === 'success' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                border: `1px solid ${formMessage.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                color: formMessage.type === 'success' ? 'var(--green)' : 'var(--red)',
              }}>
                {formMessage.text}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <label style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 600 }}>LAYER</label>
                <select
                  value={formLayer}
                  onChange={(e) => setFormLayer(e.target.value as any)}
                  style={{
                    background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '4px',
                    color: 'var(--text-primary)', fontSize: '11.5px', padding: '4px', outline: 'none'
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
                <label style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 600 }}>SOURCE (OPTIONAL)</label>
                <input
                  type="text"
                  placeholder="e.g. src/App.tsx"
                  value={formSource}
                  onChange={(e) => setFormSource(e.target.value)}
                  style={{
                    background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '4px',
                    color: 'var(--text-primary)', fontSize: '11.5px', padding: '4px 6px', outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <label style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 600 }}>TITLE</label>
              <input
                type="text"
                placeholder="Brief summary title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                style={{
                  background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '4px',
                  color: 'var(--text-primary)', fontSize: '11.5px', padding: '4px 6px', outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <label style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 600 }}>CONTENT / GUIDELINE / CODE SNIPPET</label>
              <textarea
                rows={3}
                placeholder="Enter details to vectorize and remember..."
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                style={{
                  background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '4px',
                  color: 'var(--text-primary)', fontSize: '11.5px', padding: '6px', outline: 'none', resize: 'none',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <label style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 600 }}>TAGS (COMMA SEPARATED)</label>
              <input
                type="text"
                placeholder="e.g. react, hooks, performance"
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
                style={{
                  background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '4px',
                  color: 'var(--text-primary)', fontSize: '11.5px', padding: '4px 6px', outline: 'none'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={formSubmitting}
              style={{
                background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '4px',
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
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0, display: 'flex', gap: '6px', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: '8px' }} />
          <input
            type="text"
            placeholder="Search semantic memory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', background: 'var(--bg-sidebar)', border: '1px solid',
              borderColor: 'var(--border)',
              borderRadius: '6px', padding: '6px 8px 6px 26px', fontSize: '12px',
              color: 'var(--text-primary)', outline: 'none', transition: 'border-color 150ms'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--border-light)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '8px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11px' }}
            >
              ×
            </button>
          )}
        </div>
        {selectedLayer && (
          <button
            onClick={() => setSelectedLayer(null)}
            style={{
              background: 'var(--bg-active)', border: '1px solid var(--border)',
              borderRadius: '6px', fontSize: '10.5px', color: 'var(--text-secondary)', padding: '5px 8px',
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
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)' }}>
            <Loader2 size={20} className="animate-spin" color="var(--accent)" />
            <span style={{ fontSize: '11.5px' }}>Searching database...</span>
          </div>
        ) : displayedMemories.length === 0 ? (
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '36px 0', color: 'var(--text-muted)' }}>
            <Info size={24} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>No Memories Found</span>
            <span style={{ fontSize: '11px', textAlign: 'center', maxWidth: '200px', lineHeight: '1.4' }}>
              {searchQuery ? 'Try adjusting your search keywords.' : 'No memory logs exist in this layer yet.'}
            </span>
          </div>
        ) : (
          displayedMemories.map((entry) => {
            const layerStyle = getLayerStyle(entry.layer);
            return (
              <div
                key={entry.id}
                style={{
                  background: 'var(--bg-active)', border: '1px solid var(--border)',
                  borderRadius: '8px', padding: '10px 12px', transition: 'all 200ms',
                  display: 'flex', flexDirection: 'column', gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>{entry.title}</span>
                  
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {entry.score !== undefined && (
                      <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--amber)', background: 'rgba(245, 158, 11, 0.08)', padding: '1px 4px', borderRadius: '3px' }}>
                        {Math.round(entry.score * 100)}% Match
                      </span>
                    )}
                    <span style={{
                      fontSize: '9px', fontWeight: 700, textTransform: 'uppercase',
                      color: layerStyle.color, background: layerStyle.background,
                      padding: '1px 5px', borderRadius: '3px', border: `1px solid ${layerStyle.borderColor}`
                    }}>
                      {entry.layer}
                    </span>
                  </div>
                </div>

                <div style={{
                  fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: '1.5',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: '4px', padding: '6px 8px'
                }}>
                  {entry.content}
                </div>

                {(entry.source || (entry.tags && entry.tags.length > 0)) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                    {entry.source ? (
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Folder size={9} />
                        {entry.source}
                      </span>
                    ) : <div />}

                    {entry.tags && entry.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {entry.tags.map(tag => (
                          <span key={tag} style={{ fontSize: '9px', color: 'var(--text-muted)', background: 'var(--bg-active)', padding: '1px 4px', borderRadius: '3px' }}>
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
  cursor: 'pointer', color: 'var(--text-muted)', borderRadius: '4px',
  display: 'flex', transition: 'color 100ms',
};
