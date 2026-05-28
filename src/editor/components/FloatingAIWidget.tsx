import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, Send, X, MessageSquare, Trash2, Minimize2 } from 'lucide-react';
import { streamAIResponse } from '@/services/aiStreamClient';
import { useNotificationStore } from '@/store/useNotificationStore';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export function FloatingAIWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const showToast = useNotificationStore((s) => s.showToast);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    const assistantMessage: ChatMessage = { role: 'assistant', content: '' };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const chatHistory = messages.concat(userMessage).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));

      let accumulated = '';
      await streamAIResponse(
        chatHistory,
        'nexo-auto-router',
        {
          onToken: (token) => {
            accumulated += token;
            setMessages((prev) => {
              const next = [...prev];
              if (next.length > 0) {
                next[next.length - 1] = { role: 'assistant', content: accumulated };
              }
              return next;
            });
          },
          onDone: () => {
            setLoading(false);
          },
          onError: (err) => {
            showToast(`Widget error: ${err.message}`, 'error');
            setLoading(false);
          }
        }
      );
    } catch (err: any) {
      showToast(`Widget error: ${err.message}`, 'error');
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    showToast('Widget chat history cleared.', 'info');
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '36px',
      right: '20px',
      zIndex: 999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '12px',
      fontFamily: 'var(--font-ui, sans-serif)',
    }}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            style={{
              width: '320px',
              height: '420px',
              background: 'rgba(13, 17, 23, 0.92)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Widget Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              background: 'rgba(17, 24, 39, 0.4)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} style={{ color: '#06b6d4' }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#f3f4f6', letterSpacing: '0.04em' }}>
                  NEXO WIDGET
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {messages.length > 0 && (
                  <button
                    onClick={handleClear}
                    title="Clear history"
                    style={{
                      background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', padding: '3px', borderRadius: '4px', display: 'flex'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#f3f4f6'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#4b5563'; }}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  title="Minimize"
                  style={{
                    background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', padding: '3px', borderRadius: '4px', display: 'flex'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#f3f4f6'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#4b5563'; }}
                >
                  <Minimize2 size={13} />
                </button>
              </div>
            </div>

            {/* Widget Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              {messages.length === 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#4b5563',
                  gap: '6px',
                  textAlign: 'center',
                  padding: '12px',
                }}>
                  <MessageSquare size={18} />
                  <span style={{ fontSize: '10px' }}>Quick workspace queries.<br />How can I assist you right now?</span>
                </div>
              ) : (
                messages.map((m, idx) => {
                  const isUser = m.role === 'user';
                  return (
                    <div
                      key={idx}
                      style={{
                        alignSelf: isUser ? 'flex-end' : 'flex-start',
                        background: isUser ? '#06b6d4' : 'rgba(255,255,255,0.03)',
                        border: isUser ? 'none' : '1px solid rgba(255,255,255,0.05)',
                        color: '#f3f4f6',
                        borderRadius: isUser ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
                        padding: '6px 10px',
                        fontSize: '11.5px',
                        lineHeight: '1.4',
                        maxWidth: '85%',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {m.content}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Widget Footer Input */}
            <form onSubmit={handleSend} style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              background: 'rgba(17, 24, 39, 0.2)',
              gap: '6px',
            }}>
              <input
                placeholder="Ask Nexo..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                style={{
                  flex: 1,
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '5px',
                  color: '#f3f4f6',
                  fontSize: '12px',
                  padding: '5px 10px',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                style={{
                  background: (loading || !input.trim()) ? 'transparent' : '#06b6d4',
                  border: 'none',
                  borderRadius: '5px',
                  color: '#ffffff',
                  padding: '6px',
                  cursor: (loading || !input.trim()) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: (loading || !input.trim()) ? 0.3 : 1,
                }}
              >
                <Send size={12} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button bubble */}
      {!isOpen && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          style={{
            background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            color: '#ffffff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(6, 182, 212, 0.3)',
          }}
        >
          <Sparkles size={16} />
        </motion.button>
      )}
    </div>
  );
}
