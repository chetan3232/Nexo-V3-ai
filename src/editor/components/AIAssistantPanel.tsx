import { FormEvent, useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  X, Send, Bot, User, Paperclip, AtSign, Mic,
  MessageSquare, Cpu, Database,
  FileSearch, Wand2, Component, Bug,
} from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';
import { sendContextualMessage } from '@/ai/contextInjection';

type Props = { onClose: () => void };

type PanelTab = 'chat' | 'agents' | 'memory';

const modelOptions = [
  { label: 'Claude Sonnet 4.5', value: 'openrouter/claude-sonnet' },
  { label: 'Gemini 2.5 Pro',   value: 'gemini-2.5-pro' },
  { label: 'DeepSeek Coder',   value: 'deepseek-chat' },
  { label: 'Qwen 2.5 Coder',   value: 'ollama/qwen2.5-coder' },
];

const quickActions = [
  {
    icon: FileSearch,
    title: 'Explain this code',
    desc: 'Explain the selected code in detail.',
    color: '#60a5fa',
    prompt: 'Explain the current file code in detail.',
  },
  {
    icon: Wand2,
    title: 'Refactor this code',
    desc: 'Improve code structure and readability.',
    color: '#a78bfa',
    prompt: 'Refactor this code for better structure and readability.',
  },
  {
    icon: Component,
    title: 'Generate component',
    desc: 'Create a new React component.',
    color: '#34d399',
    prompt: 'Generate a new React component for this use case.',
  },
  {
    icon: Bug,
    title: 'Find bugs',
    desc: 'Detect and fix issues in code.',
    color: '#f87171',
    prompt: 'Find and fix all bugs in the current file.',
  },
];

export function AIAssistantPanel({ onClose }: Props) {
  const { messages, input, isStreaming, model, setInput, setModel } = useChatStore();
  const [activeTab, setActiveTab] = useState<PanelTab>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [input]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    await sendContextualMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void submit(e as unknown as FormEvent);
    }
  };

  const tabs: { id: PanelTab; label: string; icon: React.ElementType }[] = [
    { id: 'chat',   label: 'CHAT',   icon: MessageSquare },
    { id: 'agents', label: 'AGENTS', icon: Cpu },
    { id: 'memory', label: 'MEMORY', icon: Database },
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#111827',
      borderLeft: '1px solid #1f2937',
    }}>
      {/* ── Header ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px 0',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', color: '#e2e8f0' }}>
          NEXO AI
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '3px', borderRadius: '4px', display: 'flex' }} title="More options">
            <span style={{ fontSize: '16px', lineHeight: 1 }}>⋯</span>
          </button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '3px', borderRadius: '4px', display: 'flex' }} title="Close">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── Tabs: CHAT / AGENTS / MEMORY ── */}
      <div style={{
        display: 'flex',
        gap: '0px',
        padding: '8px 14px 0',
        borderBottom: '1px solid #1f2937',
        flexShrink: 0,
      }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
                color: isActive ? '#e2e8f0' : '#6b7280',
                fontSize: '11.5px',
                fontWeight: 600,
                letterSpacing: '0.05em',
                padding: '4px 12px 8px',
                cursor: 'pointer',
                transition: 'color 120ms, border-color 120ms',
                marginBottom: '-1px',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Chat Content ── */}
      <AnimatePresence mode="wait">
        {activeTab === 'chat' && (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
          >
            {/* Messages area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '20px', gap: '12px' }}
                >
                  {/* Diamond sparkle icon */}
                  <div style={{ fontSize: '32px', lineHeight: 1 }}>✦</div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#e2e8f0', marginBottom: '4px' }}>
                      Hello, Developer! 👋
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#6b7280', lineHeight: 1.5 }}>
                      How can I help you today?
                    </div>
                  </div>

                  {/* Quick action cards — exactly matching reference */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '8px' }}>
                    {quickActions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <motion.button
                          key={action.title}
                          whileHover={{ scale: 1.01, background: 'rgba(255,255,255,0.05)' }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => setInput(action.prompt)}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid #1f2937',
                            borderRadius: '8px',
                            padding: '10px 12px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 150ms ease',
                          }}
                        >
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            background: `${action.color}18`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            <Icon size={15} color={action.color} />
                          </div>
                          <div>
                            <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#e2e8f0', marginBottom: '2px' }}>
                              {action.title}
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#6b7280', lineHeight: 1.4 }}>
                              {action.desc}
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              <AnimatePresence initial={false}>
                {messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}
                    >
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '6px', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isUser ? 'rgba(255,255,255,0.08)' : 'rgba(59,130,246,0.15)',
                        border: `1px solid ${isUser ? '#1f2937' : 'rgba(59,130,246,0.3)'}`,
                        marginTop: '1px',
                      }}>
                        {isUser
                          ? <User size={12} color="#9ca3af" />
                          : <Bot size={12} color="#60a5fa" />
                        }
                      </div>
                      <div style={{
                        flex: 1,
                        fontSize: '13px',
                        lineHeight: '1.6',
                        color: '#c9d1d9',
                        background: isUser ? 'rgba(255,255,255,0.04)' : 'transparent',
                        border: isUser ? '1px solid #1f2937' : 'none',
                        borderRadius: isUser ? '8px' : '0',
                        padding: isUser ? '8px 10px' : '0',
                      }}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content || (isStreaming ? '…' : '')}
                        </ReactMarkdown>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Streaming dots */}
              {isStreaming && (
                <div style={{ display: 'flex', gap: '4px', paddingLeft: '32px', alignItems: 'center' }}>
                  {[0, 1, 2].map((i) => (
                    <motion.div key={i}
                      style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#3b82f6' }}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Input area ── */}
            <div style={{ borderTop: '1px solid #1f2937', padding: '10px 12px', flexShrink: 0 }}>
              {/* Model selector */}
              <div style={{ marginBottom: '8px' }}>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  style={{
                    background: '#0d1117',
                    border: '1px solid #1f2937',
                    borderRadius: '5px',
                    color: '#6b7280',
                    fontSize: '11px',
                    padding: '3px 8px',
                    cursor: 'pointer',
                    outline: 'none',
                    width: '100%',
                  }}
                >
                  {modelOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Input box */}
              <form onSubmit={submit}>
                <div style={{
                  background: '#0d1117',
                  border: '1px solid #1f2937',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  transition: 'border-color 150ms',
                }}>
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything..."
                    disabled={isStreaming}
                    rows={1}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#e2e8f0',
                      fontSize: '13px',
                      fontFamily: "'Inter', sans-serif",
                      padding: '10px 12px 4px',
                      resize: 'none',
                      lineHeight: '1.5',
                      minHeight: '38px',
                    }}
                  />
                  {/* Bottom icon row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px 6px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[Paperclip, AtSign, Mic].map((Icon, i) => (
                        <button key={i} type="button" style={{
                          background: 'none', border: 'none', padding: '4px',
                          cursor: 'pointer', color: '#4b5563', borderRadius: '4px',
                          display: 'flex', transition: 'color 100ms',
                        }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#4b5563'; }}
                        >
                          <Icon size={14} />
                        </button>
                      ))}
                    </div>
                    <button
                      type="submit"
                      disabled={isStreaming || !input.trim()}
                      style={{
                        width: '28px', height: '28px', borderRadius: '6px',
                        background: (isStreaming || !input.trim()) ? '#1f2937' : '#3b82f6',
                        border: 'none',
                        color: (isStreaming || !input.trim()) ? '#4b5563' : 'white',
                        cursor: (isStreaming || !input.trim()) ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 120ms ease',
                        flexShrink: 0,
                      }}
                    >
                      <Send size={13} />
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {activeTab === 'agents' && (
          <motion.div key="agents" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ flex: 1, overflowY: 'auto', padding: '16px' }}
          >
            <div style={{ color: '#6b7280', fontSize: '12.5px', textAlign: 'center', paddingTop: '32px' }}>
              <Cpu size={28} color="#374151" style={{ margin: '0 auto 10px' }} />
              <div>Agent runtime ready</div>
              <div style={{ marginTop: '4px', fontSize: '11.5px', color: '#374151' }}>No active tasks</div>
            </div>
          </motion.div>
        )}

        {activeTab === 'memory' && (
          <motion.div key="memory" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ flex: 1, overflowY: 'auto', padding: '16px' }}
          >
            <div style={{ color: '#6b7280', fontSize: '12.5px', textAlign: 'center', paddingTop: '32px' }}>
              <Database size={28} color="#374151" style={{ margin: '0 auto 10px' }} />
              <div>Memory store</div>
              <div style={{ marginTop: '4px', fontSize: '11.5px', color: '#374151' }}>0 embeddings stored</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
