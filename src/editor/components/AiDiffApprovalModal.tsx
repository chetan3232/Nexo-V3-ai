import { AnimatePresence, motion } from 'framer-motion';
import { X, FileCode2, Check, AlertTriangle } from 'lucide-react';
import { DiffEditor, Monaco } from '@monaco-editor/react';

type Props = {
  isOpen: boolean;
  fileName: string;
  originalCode: string;
  proposedCode: string;
  onAccept: () => void;
  onReject: () => void;
};

function defineNexoTheme(monaco: Monaco) {
  monaco.editor.defineTheme('nexo-dark-diff', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '',                foreground: 'c9d1d9' },
      { token: 'comment',         foreground: '6e7681', fontStyle: 'italic' },
      { token: 'keyword',         foreground: 'ff7b72' },
      { token: 'keyword.control', foreground: 'ff7b72' },
      { token: 'string',          foreground: 'a5d6ff' },
      { token: 'string.escape',   foreground: '79c0ff' },
      { token: 'number',          foreground: '79c0ff' },
      { token: 'type',            foreground: 'ffa657' },
      { token: 'class',           foreground: 'ffa657' },
      { token: 'function',        foreground: 'd2a8ff' },
      { token: 'identifier',      foreground: 'c9d1d9' },
      { token: 'variable',        foreground: 'ffa657' },
      { token: 'operator',        foreground: 'ff7b72' },
      { token: 'delimiter',       foreground: 'c9d1d9' },
      { token: 'tag',             foreground: '7ee787' },
      { token: 'attribute.name',  foreground: '79c0ff' },
      { token: 'attribute.value', foreground: 'a5d6ff' },
      { token: 'metatag',         foreground: '7ee787' },
      { token: 'annotation',      foreground: 'ffa657' },
    ],
    colors: {
      'editor.background':                   '#0d1117',
      'editor.foreground':                   '#c9d1d9',
      'editor.lineHighlightBackground':      '#161b22',
      'editor.lineHighlightBorder':          '#00000000',
      'editor.selectionBackground':          '#264f78',
      'editor.inactiveSelectionBackground':  '#1f3a5a',
      'editorLineNumber.foreground':         '#3d444d',
      'editorLineNumber.activeForeground':   '#c9d1d9',
      'editorCursor.foreground':             '#c9d1d9',
      'editorWhitespace.foreground':         '#1f2937',
      'editorIndentGuide.background1':       '#1f2937',
      'editorIndentGuide.activeBackground1': '#2d3748',
      'editorGutter.background':             '#0d1117',
      'editorWidget.background':             '#161b22',
      'editorWidget.border':                 '#1f2937',
      'scrollbarSlider.background':          '#1f2937',
      'scrollbarSlider.hoverBackground':     '#2d3748',
      'scrollbarSlider.activeBackground':    '#3b82f6',
      'minimap.background':                  '#0d1117',
    },
  });
}

export function AiDiffApprovalModal({
  isOpen,
  fileName,
  originalCode,
  proposedCode,
  onAccept,
  onReject
}: Props) {
  const getLanguage = (name: string) => {
    const ext = name.split('.').pop() ?? '';
    if (ext === 'ts' || ext === 'tsx') return 'typescript';
    if (ext === 'js' || ext === 'jsx') return 'javascript';
    if (ext === 'json') return 'json';
    if (ext === 'css') return 'css';
    if (ext === 'html') return 'html';
    if (ext === 'md') return 'markdown';
    if (ext === 'py') return 'python';
    return 'plaintext';
  };

  const handleEditorWillMount = (monaco: Monaco) => {
    defineNexoTheme(monaco);
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
          background: 'rgba(3, 7, 18, 0.8)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '24px',
        }}>
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{
              width: '100%',
              maxWidth: '1280px',
              height: '85%',
              background: '#0d1117',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 50px rgba(59, 130, 246, 0.1)',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              borderBottom: '1px solid #1f2937',
              background: '#111827',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '30px', height: '30px', borderRadius: '50%',
                  background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6'
                }}>
                  <FileCode2 size={16} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '13.5px', fontWeight: 700, color: '#e2e8f0' }}>
                    Review Code Modification Proposal
                  </h3>
                  <span style={{ fontSize: '11px', color: '#8b949e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    File: <strong style={{ color: '#58a6ff' }}>{fileName}</strong>
                  </span>
                </div>
              </div>
              <button
                onClick={onReject}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 120ms',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#e2e8f0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#6b7280'; }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Side-by-side Monaco Diff Viewer */}
            <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
              <DiffEditor
                original={originalCode}
                modified={proposedCode}
                language={getLanguage(fileName)}
                theme="nexo-dark-diff"
                beforeMount={handleEditorWillMount}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  renderSideBySide: true,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </div>

            {/* Bottom Actions Banner */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderTop: '1px solid #1f2937',
              background: '#111827',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#8b949e' }}>
                <AlertTriangle size={15} color="#eab308" />
                <span>
                  Nexo AI proposed these edits. Accept to write modifications to disk, or reject to discard.
                </span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={onReject}
                  style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    borderRadius: '6px',
                    padding: '8px 18px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 120ms',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                  }}
                >
                  Reject & Discard
                </button>
                <button
                  onClick={onAccept}
                  style={{
                    background: '#238636',
                    border: '1px solid #308e41',
                    color: '#ffffff',
                    borderRadius: '6px',
                    padding: '8px 20px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 0 10px rgba(35, 134, 54, 0.3)',
                    transition: 'all 120ms',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#2ea043';
                    e.currentTarget.style.boxShadow = '0 0 15px rgba(35, 134, 54, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#238636';
                    e.currentTarget.style.boxShadow = '0 0 10px rgba(35, 134, 54, 0.3)';
                  }}
                >
                  <Check size={14} />
                  Accept & Apply Changes
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
