import { AnimatePresence, motion } from 'framer-motion';
import { X, FileCode2 } from 'lucide-react';
import { DiffEditor, Monaco } from '@monaco-editor/react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  originalCode: string;
  modifiedCode: string;
  commitLabel: string;
};

function defineNexoTheme(monaco: Monaco) {
  monaco.editor.defineTheme('nexo-dark', {
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
      'editorSuggestWidget.background':      '#161b22',
      'editorSuggestWidget.border':          '#1f2937',
      'editorSuggestWidget.selectedBackground': '#1e3a5f',
      'editorHoverWidget.background':        '#161b22',
      'editorHoverWidget.border':            '#1f2937',
      'editorBracketMatch.background':       '#1f2937',
      'editorBracketMatch.border':           '#3d444d',
      'input.background':                    '#0d1117',
      'input.border':                        '#1f2937',
      'scrollbarSlider.background':          '#1f2937',
      'scrollbarSlider.hoverBackground':     '#2d3748',
      'scrollbarSlider.activeBackground':    '#3b82f6',
      'minimap.background':                  '#0d1117',
      'breadcrumb.background':               '#0d1117',
      'breadcrumb.foreground':               '#6e7681',
      'breadcrumb.activeSelectionForeground':'#c9d1d9',
      'tab.activeBackground':                '#0d1117',
      'tab.inactiveBackground':              '#111827',
      'tab.border':                          '#1f2937',
    },
  });
}

export function DiffModal({ isOpen, onClose, fileName, originalCode, modifiedCode, commitLabel }: Props) {
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
          background: 'rgba(3, 7, 18, 0.75)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '24px',
        }}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              width: '100%',
              maxWidth: '1200px',
              height: '80%',
              background: '#0d1117',
              border: '1px solid #1f2937',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid #1f2937',
              background: '#111827',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCode2 size={16} color="#3b82f6" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>{fileName}</span>
                <span style={{
                  fontSize: '9px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: '#60a5fa',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}>
                  Comparing with {commitLabel}
                </span>
              </div>
              <button
                onClick={onClose}
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
                  transition: 'color 120ms, background 120ms',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = '#e2e8f0';
                  (e.currentTarget as HTMLButtonElement).style.background = '#1f2937';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = '#6b7280';
                  (e.currentTarget as HTMLButtonElement).style.background = 'none';
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Editor Area */}
            <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
              <DiffEditor
                original={originalCode}
                modified={modifiedCode}
                language={getLanguage(fileName)}
                theme="nexo-dark"
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
            
            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 16px',
              borderTop: '1px solid #1f2937',
              background: '#0d1117',
              fontSize: '11px',
              color: '#6b7280',
            }}>
              <span>Left: {commitLabel} state &nbsp;|&nbsp; Right: Current state</span>
              <button
                onClick={onClose}
                style={{
                  background: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '5px',
                  color: '#e2e8f0',
                  padding: '4px 12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'background 120ms',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#2d3748'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#1f2937'; }}
              >
                Close View
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
