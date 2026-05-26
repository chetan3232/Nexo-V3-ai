import { FormEvent, useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Sparkles, Send, X, ChevronDown, Bot, User,
  Code2, RotateCcw, Copy, CheckCheck, Zap,
} from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';
import { sendContextualMessage } from '@/ai/contextInjection';

type Props = {
  onClose: () => void;
};

const modelOptions = [
  { label: 'Claude Sonnet 4.5', value: 'openrouter/claude-sonnet' },
  { label: 'Gemini 2.5 Pro',   value: 'gemini-2.5-pro' },
  { label: 'DeepSeek Coder',   value: 'deepseek-chat' },
  { label: 'Qwen 2.5 Coder',   value: 'ollama/qwen2.5-coder' },
];

const quickActions = [
  { label: 'Explain code',     prompt: 'Explain the selected code in detail.' },
  { label: 'Fix bugs',         prompt: 'Find and fix any bugs in the current file.' },
  { label: 'Add tests',        prompt: 'Generate unit tests for the current file.' },
  { label: 'Refactor',         prompt: 'Refactor this code for clarity and performance.' },
  { label: 'Add comments',     prompt: 'Add JSDoc comments to all functions.' },
  { label: 'Optimize',         prompt: 'Optimize this code for performance.' },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      style={{
        background: 'transparent',
        border: 'none',
        color: 'var(--text-muted)',
        cursor: 'pointer',
        padding: '2px',
        borderRadius: '3px',
        display: 'flex',
        alignItems: 'center',
        transition: 'color 100ms',
      }}
      title="Copy"
    >
      {copied ? <CheckCheck size={13} color="var(--green)" /> : <Copy size={13} />}
    </button>
  );
}

export function AIAssistantPanel({ onClose }: Props) {
  const { messages, input, isStreaming, model, setInput, setModel } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`;
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

  return (
    <div className="ai-panel" style={{ height: '100%' }}>
      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Sparkles size={13} color="white" />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Nexo AI
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
            Context-aware assistant
          </div>
        </div>

        {/* Model selector */}
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border)',
            borderRadius: '5px',
            color: 'var(--text-secondary)',
            fontSize: '11px',
            padding: '3px 6px',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          {modelOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <button className="icon-btn" onClick={onClose} title="Close AI Panel">
          <X size={14} />
        </button>
      </div>

      {/* ── Messages ── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              paddingTop: '24px',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'var(--accent-dim)',
                border: '1px solid var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={22} color="var(--accent)" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                How can I help?
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Ask anything about your code. I have full context of your workspace.
              </div>
            </div>

            {/* Quick actions */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginTop: '4px' }}>
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => setInput(action.prompt)}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    borderRadius: '20px',
                    padding: '5px 10px',
                    fontSize: '11.5px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 120ms ease',
                  }}
                  className="hover:!border-[color:var(--border-focus)] hover:!text-[color:var(--text-primary)]"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'flex-start',
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isUser ? 'var(--bg-input)' : 'var(--accent-dim)',
                    border: `1px solid ${isUser ? 'var(--border)' : 'rgba(59,130,246,0.3)'}`,
                  }}
                >
                  {isUser
                    ? <User size={13} color="var(--text-secondary)" />
                    : <Bot size={13} color="var(--accent)" />
                  }
                </div>

                {/* Message body */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: isUser ? 'var(--text-secondary)' : 'var(--accent)' }}>
                      {isUser ? 'You' : 'Nexo AI'}
                    </span>
                    {!isUser && <CopyButton text={msg.content} />}
                  </div>

                  <div
                    className="prose-ide"
                    style={{
                      background: isUser ? 'var(--bg-input)' : 'transparent',
                      border: isUser ? '1px solid var(--border)' : 'none',
                      borderRadius: isUser ? '8px' : '0',
                      padding: isUser ? '8px 10px' : '0',
                    }}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content || (isStreaming ? '…' : '')}
                    </ReactMarkdown>
                  </div>

                  {/* Token count */}
                  {typeof msg.tokens === 'number' && (
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>
                      {msg.tokens} tokens
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Streaming indicator */}
        {isStreaming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '34px' }}
          >
            <div style={{ display: 'flex', gap: '3px' }}>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent)' }}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Thinking…</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ── */}
      <div
        style={{
          borderTop: '1px solid var(--border)',
          padding: '10px 12px',
          flexShrink: 0,
        }}
      >
        <form onSubmit={submit}>
          <div
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              transition: 'border-color 150ms ease',
            }}
            className="focus-within:!border-[color:var(--border-focus)]"
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask AI… (Enter to send, Shift+Enter for new line)"
              disabled={isStreaming}
              rows={1}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontFamily: 'var(--font-ui)',
                padding: '10px 12px 4px',
                resize: 'none',
                lineHeight: '1.5',
                minHeight: '36px',
              }}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 8px 6px',
              }}
            >
              <div style={{ display: 'flex', gap: '4px' }}>
                <button type="button" className="icon-btn" title="Attach file">
                  <Code2 size={13} />
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                  ↵ Send
                </span>
                <button
                  type="submit"
                  disabled={isStreaming || !input.trim()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    background: (isStreaming || !input.trim()) ? 'var(--border)' : 'var(--accent)',
                    border: 'none',
                    cursor: (isStreaming || !input.trim()) ? 'not-allowed' : 'pointer',
                    color: 'white',
                    transition: 'all 120ms ease',
                  }}
                >
                  <Send size={13} />
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div style={{ marginTop: '6px', fontSize: '10.5px', color: 'var(--text-muted)', textAlign: 'center' }}>
          Nexo AI has context of your workspace, open files, and terminal output.
        </div>
      </div>
    </div>
  );
}
