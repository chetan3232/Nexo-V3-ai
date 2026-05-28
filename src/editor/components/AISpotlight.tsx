import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, Terminal, X, CornerDownLeft, FileText, ArrowRight } from 'lucide-react';
import { streamAIResponse } from '@/services/aiStreamClient';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useEditorStore } from '@/store/useEditorStore';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function AISpotlight({ isOpen, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const showToast = useNotificationStore((s) => s.showToast);
  const activeFile = useEditorStore((s) => s.activeFile);
  const files = useEditorStore((s) => s.files);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResponse('');
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Scroll to bottom on streaming text update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [response]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;
    setLoading(true);
    setResponse('');

    try {
      let activeFileContent = '';
      if (activeFile && files[activeFile]) {
        activeFileContent = `[Active File: ${activeFile}]\n${files[activeFile].content}`;
      }

      const promptMessages = [
        {
          role: 'system' as const,
          content: `You are Nexo AI Spotlight assistant.
Provide a quick, concise code helper, refactoring snippet, or response.
If you output code, format it cleanly inside markdown code fences with file language.`
        },
        {
          role: 'user' as const,
          content: `${activeFileContent ? `${activeFileContent}\n\n` : ''}User prompt: ${query.trim()}`
        }
      ];

      let accumulated = '';
      await streamAIResponse(
        promptMessages,
        'nexo-auto-router',
        {
          onToken: (token) => {
            accumulated += token;
            setResponse(accumulated);
          },
          onDone: () => {
            setLoading(false);
          },
          onError: (err) => {
            showToast(`Spotlight error: ${err.message}`, 'error');
            setLoading(false);
          }
        }
      );
    } catch (err: any) {
      showToast(`Spotlight error: ${err.message}`, 'error');
      setLoading(false);
    }
  };

  const handleApplyCode = () => {
    // Extract code block content from markdown response if present
    const match = response.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
    const codeToInsert = match ? match[1] : response;

    if (!codeToInsert.trim()) {
      showToast('No code snippet to apply.', 'info');
      return;
    }

    // Trigger editor text insert event
    window.dispatchEvent(
      new CustomEvent('nexo-editor-command', {
        detail: { command: 'insert-text', payload: codeToInsert }
      })
    );
    showToast('Applied generated code to active editor!', 'success');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && e.altKey) {
      e.preventDefault();
      handleApplyCode();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(3, 7, 18, 0.65)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'center',
          zIndex: 9999,
          paddingTop: '100px',
        }}>
          <motion.div
            initial={{ y: -20, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -15, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              width: '100%',
              maxWidth: '650px',
              height: response ? '380px' : '52px',
              background: '#0d1117',
              border: '1px solid #1f2937',
              borderRadius: '12px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              transition: 'height 180ms ease-in-out',
            }}
          >
            {/* Search Input Bar */}
            <form onSubmit={handleSubmit} style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              borderBottom: response ? '1px solid #1f2937' : 'none',
              background: '#111827',
              gap: '10px',
            }}>
              <Sparkles size={16} style={{ color: loading ? '#06b6d4' : '#6b7280' }} className={loading ? "animate-pulse" : ""} />
              <input
                ref={inputRef}
                placeholder="Ask Nexo AI Spotlight or type a command..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#f3f4f6',
                  fontSize: '13.5px',
                  fontFamily: 'inherit',
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                {query.trim() && (
                  <kbd style={{
                    background: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '4px',
                    padding: '2px 6px',
                    fontSize: '10px',
                    color: '#9ca3af',
                    fontFamily: 'monospace',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                  }}>
                    <span>Enter</span>
                    <CornerDownLeft size={10} />
                  </kbd>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#6b7280',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={15} />
                </button>
              </div>
            </form>

            {/* Answer Display */}
            {response && (
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                background: '#070a0f',
              }}>
                <div
                  ref={scrollRef}
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '14px 18px',
                    fontSize: '12px',
                    lineHeight: '1.6',
                    color: '#d1d5db',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {response}
                </div>

                {/* Footer Controls */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 16px',
                  borderTop: '1px solid #1f2937',
                  background: '#0d1117',
                  fontSize: '10.5px',
                  color: '#6b7280',
                }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <FileText size={12} />
                    <span>{activeFile ? `Target: ${activeFile.split('/').pop()}` : 'No active file'}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '9.5px', fontFamily: 'monospace' }}>Alt+Enter to Apply</span>
                    <button
                      onClick={handleApplyCode}
                      style={{
                        background: '#06b6d4',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#ffffff',
                        padding: '4px 10px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'background 120ms',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#0891b2'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#06b6d4'; }}
                    >
                      <span>Apply Code</span>
                      <ArrowRight size={11} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
