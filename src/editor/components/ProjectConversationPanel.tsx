import { useState, useRef, useEffect } from 'react';
import { useProjectTalkStore } from '@/store/useProjectTalkStore';
import { useEditorStore } from '@/store/useEditorStore';
import { Send, FileCode, Bot, User, Trash2, Loader, Sparkles, Folder } from 'lucide-react';
import { motion } from 'framer-motion';

export function ProjectConversationPanel() {
  const { messages, isThinking, askProject, clearHistory } = useProjectTalkStore();
  const { openFile } = useEditorStore();
  const [query, setQuery] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isThinking) return;
    void askProject(query.trim());
    setQuery('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0d1117', color: '#e2e8f0', minHeight: 0 }}>
      
      {/* Dialogue area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: 0 }}>
        {messages.length === 0 && (
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#4b5563', padding: '36px 0', textAlign: 'center' }}>
            <Sparkles size={28} color="#a78bfa" />
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#9ca3af' }}>Nexo Conversational Explorer</span>
            <span style={{ fontSize: '11px', maxWidth: '240px', lineHeight: '1.4' }}>
              Ask where features are located, e.g., "Where does auth login happen?" or "Which files implement checkout logic?"
            </span>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div key={msg.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '6px', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isUser ? 'rgba(255,255,255,0.08)' : 'rgba(167, 139, 250, 0.12)',
                border: `1px solid ${isUser ? '#1f2937' : 'rgba(167, 139, 250, 0.3)'}`,
                fontSize: '12px'
              }}>
                {isUser ? <User size={11} color="#9ca3af" /> : <Bot size={11} color="#a78bfa" />}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '12.5px', lineHeight: '1.5', color: '#c9d1d9',
                  background: isUser ? 'rgba(255,255,255,0.02)' : 'transparent',
                  padding: isUser ? '6px 10px' : '0', borderRadius: '6px',
                  border: isUser ? '1px solid #1f2937' : 'none'
                }}>
                  {msg.content}
                </div>

                {/* Clickable file maps */}
                {msg.matchedFiles && msg.matchedFiles.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#4b5563', letterSpacing: '0.04em' }}>LOCATED MODULES:</span>
                    {msg.matchedFiles.map((file) => (
                      <button
                        key={file}
                        onClick={() => openFile(file)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          background: 'rgba(255,255,255,0.02)', border: '1px solid #1f2937',
                          borderRadius: '4px', padding: '6px 8px', width: '100%',
                          textAlign: 'left', cursor: 'pointer', transition: 'background 120ms'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      >
                        <FileCode size={12} color="#60a5fa" />
                        <span style={{ fontSize: '11px', color: '#e2e8f0', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {file.split('/').pop()}
                        </span>
                        <span style={{ fontSize: '9px', color: '#4b5563', marginLeft: 'auto' }}>/{file}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isThinking && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#a78bfa', paddingLeft: '32px' }}>
            <Loader size={12} className="animate-spin" />
            <span>Nexo is analyzing import layers...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input query tray */}
      <div style={{ borderTop: '1px solid #1f2937', padding: '10px 12px', flexShrink: 0 }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '6px', background: '#0d1117', border: '1px solid #1f2937', borderRadius: '6px', padding: '4px 6px' }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask for feature locations (e.g. login hooks)..."
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: '#e2e8f0', fontSize: '12px', padding: '4px 6px'
              }}
              disabled={isThinking}
            />
            {messages.length > 0 && (
              <button type="button" onClick={clearHistory} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}>
                <Trash2 size={13} />
              </button>
            )}
            <button
              type="submit"
              disabled={!query.trim() || isThinking}
              style={{
                width: '24px', height: '24px', borderRadius: '4px',
                background: (!query.trim() || isThinking) ? '#1f2937' : '#3b82f6',
                border: 'none', color: 'white', display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer'
              }}
            >
              <Send size={11} />
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
export default ProjectConversationPanel;
