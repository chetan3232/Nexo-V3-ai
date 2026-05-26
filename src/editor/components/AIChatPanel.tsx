import { FormEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, Cpu, Send, Waves } from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';
import { sendContextualMessage } from '@/ai/contextInjection';

const modelOptions = [
  'openrouter/claude-sonnet',
  'gemini-2.5-pro',
  'deepseek-chat',
  'ollama/qwen2.5-coder',
];

export function AIChatPanel() {
  const { messages, input, isStreaming, model, streamMode, tokenUsage, setInput, setModel, setStreamMode } = useChatStore();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await sendContextualMessage();
  };

  return (
    <section className="flex h-full flex-col bg-slate-950/85 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-cyan-400/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300">
        <div className="flex items-center gap-2"><Bot className="h-4 w-4 text-cyan-300" /> AI Chat</div>
        <div className="flex items-center gap-3 text-[10px] normal-case tracking-normal">
          <select value={model} onChange={(e) => setModel(e.target.value)} className="rounded border border-cyan-300/30 bg-slate-900 px-2 py-1 text-slate-200">
            {modelOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={streamMode} onChange={(e) => setStreamMode(e.target.value as 'websocket' | 'sse')} className="rounded border border-cyan-300/30 bg-slate-900 px-2 py-1 text-slate-200">
            <option value="websocket">WebSocket</option>
            <option value="sse">SSE</option>
          </select>
          <span className="flex items-center gap-1 text-cyan-200"><Cpu className="h-3.5 w-3.5" /> {tokenUsage} tokens</span>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-auto p-4 text-sm">
        {messages.map((message) => (
          <div key={message.id} className={`rounded-xl border p-3 ${message.role === 'assistant' ? 'border-cyan-400/20 bg-slate-900/70 text-slate-100' : 'border-slate-700 bg-slate-800/60 text-slate-200'}`}>
            <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-400">
              <span>{message.role}</span>
              {message.model && <span>{message.model}</span>}
              {typeof message.tokens === 'number' && <span>{message.tokens} tok</span>}
              {message.mentions?.length ? <span>mentions: {message.mentions.join(', ')}</span> : null}
            </div>
            <div className="prose prose-invert max-w-none prose-pre:border prose-pre:border-cyan-300/20 prose-pre:bg-slate-950">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content || (isStreaming ? '...' : '')}</ReactMarkdown>
            </div>
          </div>
        ))}
        {isStreaming && <div className="flex items-center gap-2 text-xs text-cyan-300"><Waves className="h-4 w-4 animate-pulse" /> streaming response...</div>}
      </div>

      <form onSubmit={submit} className="border-t border-cyan-400/20 p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask with context, e.g. fix @src/editor/CodeEditor.tsx based on current errors"
            className="h-20 flex-1 resize-none rounded border border-cyan-300/25 bg-slate-900 p-2 text-sm text-slate-100 outline-none focus:border-cyan-300"
          />
          <button type="submit" disabled={isStreaming} className="rounded border border-cyan-300/30 bg-cyan-400/15 p-2 text-cyan-100 disabled:opacity-40">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </section>
  );
}
