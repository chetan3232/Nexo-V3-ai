import { FormEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, User, Sparkles } from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';
import { sendContextualMessage } from '@/ai/contextInjection';

const modelOptions = [
  'openrouter/claude-sonnet',
  'gemini-2.5-pro',
  'deepseek-chat',
  'ollama/qwen2.5-coder',
];

export function AIChatPanel() {
  const { messages, input, isStreaming, model, setInput, setModel } = useChatStore();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!input.trim() || isStreaming) return;
    await sendContextualMessage();
  };

  return (
    <section style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-base)' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 14px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
          <Sparkles size={14} color="var(--accent)" />
          AI Chat
        </div>
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
          {modelOptions.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.length === 0 && (
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
            No messages yet. Ask anything about your code.
          </div>
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
                <div
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '5px',
                    background: isUser ? 'var(--bg-input)' : 'var(--accent-dim)',
                    border: `1px solid ${isUser ? 'var(--border)' : 'rgba(59,130,246,0.3)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '1px',
                  }}
                >
                  {isUser
                    ? <User size={11} color="var(--text-muted)" />
                    : <Bot size={11} color="var(--accent)" />
                  }
                </div>
                <div
                  className="prose-ide"
                  style={{
                    flex: 1,
                    background: isUser ? 'var(--bg-input)' : 'transparent',
                    border: isUser ? '1px solid var(--border)' : 'none',
                    borderRadius: '6px',
                    padding: isUser ? '7px 10px' : '0',
                    minWidth: 0,
                  }}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content || (isStreaming ? '…' : '')}
                  </ReactMarkdown>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {isStreaming && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '30px' }}>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent)' }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={submit} style={{ borderTop: '1px solid var(--border)', padding: '10px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask with context…"
            rows={2}
            style={{
              flex: 1,
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--text-primary)',
              fontSize: '12.5px',
              fontFamily: 'var(--font-ui)',
              padding: '7px 10px',
              resize: 'none',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            style={{
              width: '32px',
              alignSelf: 'flex-end',
              height: '32px',
              borderRadius: '6px',
              background: (isStreaming || !input.trim()) ? 'var(--border)' : 'var(--accent)',
              border: 'none',
              color: 'white',
              cursor: (isStreaming || !input.trim()) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Send size={13} />
          </button>
        </div>
      </form>
    </section>
  );
}
