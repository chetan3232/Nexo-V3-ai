import { useMemo, useState, useRef, useCallback } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { Save, SplitSquareHorizontal, FileCode2, Wand2, X, Send } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { useChatStore } from '@/store/useChatStore';
import { streamNvidiaResponse } from '@/services/aiStreamClient';
import { motion, AnimatePresence } from 'framer-motion';

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

// File icons by extension for breadcrumb
function getBreadcrumbIcon(name: string) {
  const ext = name.split('.').pop() ?? '';
  const colors: Record<string, string> = {
    tsx: '#61dafb', ts: '#3178c6', jsx: '#f7df1e',
    js: '#f7df1e', css: '#a78bfa', json: '#fbbf24', md: '#94a3b8',
  };
  return colors[ext] ?? '#6b7280';
}

function EmptyState() {
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0d1117',
      gap: '12px',
    }}>
      <div style={{
        width: '52px', height: '52px', borderRadius: '12px',
        background: '#111827', border: '1px solid #1f2937',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <FileCode2 size={24} color="#3d444d" />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: '#4b5563', marginBottom: '4px' }}>No file open</div>
        <div style={{ fontSize: '12px', color: '#1f2937' }}>Select a file from Explorer</div>
      </div>
    </div>
  );
}

export function CodeEditor() {
  const {
    files, activeFile, splitFile,
    updateFileContent, saveFile, isDirty, toggleSplitFile,
  } = useEditorStore();

  const active = activeFile ? files[activeFile] : null;
  const split  = splitFile  ? files[splitFile]  : null;

  // Floating Inline AI state
  const [inlineAIActive, setInlineAIActive] = useState(false);
  const [inlineAIPosition, setInlineAIPosition] = useState<{ top: number; left: number } | null>(null);
  const [inlineAIInput, setInlineAIInput] = useState('');
  const [inlineAISelection, setInlineAISelection] = useState<any>(null);
  const [inlineAISubmitting, setInlineAISubmitting] = useState(false);
  const [inlineAIError, setInlineAIError] = useState<string | null>(null);

  const [editorInstance, setEditorInstance] = useState<any>(null);
  const [monacoInstance, setMonacoInstance] = useState<Monaco | null>(null);

  const triggerInlineAI = useCallback((editor: any, monaco: Monaco) => {
    const selection = editor.getSelection();
    if (!selection || selection.isEmpty()) {
      // If nothing selected, automatically select current active line
      const position = editor.getPosition();
      if (position) {
        const lineContent = editor.getModel()?.getLineContent(position.lineNumber) ?? '';
        const lineSelection = new monaco.Selection(
          position.lineNumber,
          1,
          position.lineNumber,
          lineContent.length + 1
        );
        editor.setSelection(lineSelection);
        editor.revealLine(position.lineNumber);
      }
    }

    const currentSelection = editor.getSelection();
    if (!currentSelection) return;

    const position = editor.getPosition();
    if (!position) return;

    // Get pixel coordinates of cursor visible position relative to the editor container
    const coords = editor.getScrolledVisiblePosition(position);
    if (!coords) return;

    setInlineAIPosition({
      top: coords.top + coords.height + 4,
      left: Math.max(10, coords.left - 150),
    });
    setInlineAISelection(currentSelection);
    setInlineAIActive(true);
    setInlineAIInput('');
    setInlineAIError(null);
  }, []);

  const handleEditorMount = (editor: any, monaco: Monaco) => {
    setEditorInstance(editor);
    setMonacoInstance(monaco);

    // Register Ctrl/Cmd + K shortcut
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
      triggerInlineAI(editor, monaco);
    });

    // Register Ctrl/Cmd + S shortcut for save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      const activePath = useEditorStore.getState().activeFile;
      if (activePath) {
        useEditorStore.getState().saveFile(activePath);
      }
    });
  };

  const submitInlineAI = async () => {
    if (!inlineAIInput.trim() || inlineAISubmitting || !editorInstance || !monacoInstance || !inlineAISelection) return;

    setInlineAISubmitting(true);
    setInlineAIError(null);

    const model = useChatStore.getState().model; // use current active NIM model
    const selectedText = editorInstance.getModel()?.getValueInRange(inlineAISelection) ?? '';

    const systemPrompt = `You are Nexo AI, an expert code refactoring assistant.
Your goal is to edit the provided code according to the developer's instructions.
You must output ONLY the raw refactored code.
- Do NOT include markdown code fences (no \`\`\`typescript, \`\`\`, etc.)
- Do NOT include explanations, comments, or conversational text.
- Do NOT wrap code in backticks.
- Preserve the exact indentation and style of the original code.
Only return the replacement code.`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: `Original Code:\n${selectedText}\n\nInstruction:\n${inlineAIInput}` }
    ];

    let accumulatedText = '';
    let currentRange = new monacoInstance.Range(
      inlineAISelection.startLineNumber,
      inlineAISelection.startColumn,
      inlineAISelection.endLineNumber,
      inlineAISelection.endColumn
    );

    try {
      await streamNvidiaResponse(messages, model, {
        onToken: (chunk) => {
          accumulatedText += chunk;

          // Replace selection live
          editorInstance.executeEdits('inline-ai', [{
            range: currentRange,
            text: accumulatedText,
            forceMoveMarkers: true,
          }]);

          // Recalculate end positions dynamically to expand range as stream prints
          const lines = accumulatedText.split('\n');
          const lineCount = lines.length;
          const lastLineLength = lines[lines.length - 1].length;

          currentRange = new monacoInstance.Range(
            inlineAISelection.startLineNumber,
            inlineAISelection.startColumn,
            inlineAISelection.startLineNumber + lineCount - 1,
            lineCount === 1 
              ? inlineAISelection.startColumn + lastLineLength 
              : lastLineLength + 1
          );

          // Keep selected area highlighted as it writes
          editorInstance.setSelection(currentRange);
        },
        onDone: () => {
          setInlineAISubmitting(false);
          setInlineAIActive(false);
          editorInstance.setSelection(currentRange);
          editorInstance.focus();
        },
        onError: (err) => {
          setInlineAISubmitting(false);
          setInlineAIError(err.message);
        }
      });
    } catch (err: any) {
      setInlineAISubmitting(false);
      setInlineAIError(err.message || String(err));
    }
  };

  const editorOptions = useMemo(() => ({
    minimap:                    { enabled: true, scale: 1, renderCharacters: false },
    fontSize:                   13.5,
    fontFamily:                 "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    fontLigatures:              true,
    lineHeight:                 22,
    smoothScrolling:            true,
    cursorBlinking:             'phase' as const,
    cursorSmoothCaretAnimation: 'on' as const,
    automaticLayout:            true,
    suggestOnTriggerCharacters: true,
    quickSuggestions:           true,
    inlineSuggest:              { enabled: true },
    wordWrap:                   'off' as const,
    scrollBeyondLastLine:       false,
    renderLineHighlight:        'line' as const,
    padding:                    { top: 10, bottom: 10 },
    lineNumbers:                'on' as const,
    glyphMargin:                true,
    folding:                    true,
    foldingHighlight:           true,
    renderWhitespace:           'none' as const,
    bracketPairColorization:    { enabled: true },
    guides:                     { indentation: true, bracketPairs: true },
    overviewRulerBorder:        false,
    hideCursorInOverviewRuler:  true,
    scrollbar: {
      vertical:              'auto' as const,
      horizontal:            'auto' as const,
      verticalScrollbarSize: 6,
      horizontalScrollbarSize: 6,
    },
  }), []);

  if (!active) return <EmptyState />;

  const fileParts = active.path.split('/');
  const fileName  = fileParts.pop() ?? active.path;
  const dirParts  = fileParts;
  const iconColor = getBreadcrumbIcon(fileName);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0d1117' }}>
      {/* ── Breadcrumb bar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        height: '28px',
        background: '#0d1117',
        borderBottom: '1px solid #1f2937',
        flexShrink: 0,
      }}>
        {/* Breadcrumb path */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#6e7681', overflow: 'hidden' }}>
          {dirParts.map((part, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ cursor: 'pointer' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLSpanElement).style.color = '#c9d1d9'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLSpanElement).style.color = '#6e7681'; }}
              >{part}</span>
              <span style={{ color: '#3d444d' }}>›</span>
            </span>
          ))}
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#c9d1d9' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: iconColor, display: 'inline-block', flexShrink: 0 }} />
            {fileName}
          </span>
          {isDirty(active.path) && (
            <span style={{
              marginLeft: '6px', fontSize: '10px',
              background: 'rgba(245,158,11,0.12)',
              color: '#f59e0b',
              border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: '3px',
              padding: '0 5px',
              lineHeight: '16px',
            }}>
              modified
            </span>
          )}
        </div>

        {/* Editor actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <button
            onClick={toggleSplitFile}
            title="Split Editor"
            style={{
              background: 'none', border: 'none', padding: '4px', cursor: 'pointer',
              color: '#4b5563', borderRadius: '4px', display: 'flex',
              transition: 'color 100ms',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#4b5563'; }}
          >
            <SplitSquareHorizontal size={14} />
          </button>
          <button
            onClick={() => saveFile(active.path)}
            title="Save (Ctrl+S)"
            style={{
              background: 'none', border: 'none', padding: '4px', cursor: 'pointer',
              color: isDirty(active.path) ? '#3b82f6' : '#4b5563',
              borderRadius: '4px', display: 'flex', transition: 'color 100ms',
            }}
          >
            <Save size={14} />
          </button>
        </div>
      </div>

      {/* ── Monaco Editor(s) ── */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: split ? '1fr 1fr' : '1fr',
        minHeight: 0,
        position: 'relative',
      }}>
        <Editor
          height="100%"
          path={active.path}
          language={active.language}
          value={active.content}
          beforeMount={defineNexoTheme}
          onMount={handleEditorMount}
          theme="nexo-dark"
          options={editorOptions}
          onChange={(v) => updateFileContent(active.path, v ?? '')}
        />

        {split && (
          <div style={{ borderLeft: '1px solid #1f2937' }}>
            <Editor
              height="100%"
              path={split.path}
              language={split.language}
              value={split.content}
              beforeMount={defineNexoTheme}
              theme="nexo-dark"
              options={{ ...editorOptions, minimap: { enabled: false } }}
              onChange={(v) => updateFileContent(split.path, v ?? '')}
            />
          </div>
        )}

        {/* ── Glassmorphic Floating Inline AI Prompt Panel ── */}
        <AnimatePresence>
          {inlineAIActive && inlineAIPosition && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 4 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                top: `${inlineAIPosition.top}px`,
                left: `${inlineAIPosition.left}px`,
                width: '340px',
                background: 'rgba(17, 24, 39, 0.85)',
                backdropFilter: 'blur(16px) saturate(140%)',
                border: '1px solid rgba(59, 130, 246, 0.35)',
                borderRadius: '8px',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.7), 0 0 16px rgba(59, 130, 246, 0.08)',
                padding: '10px',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#60a5fa', letterSpacing: '0.05em' }}>
                  <Wand2 size={12} className="animate-pulse" />
                  <span>INLINE AI REFACTOR</span>
                </div>
                <button
                  onClick={() => { setInlineAIActive(false); if (editorInstance) editorInstance.focus(); }}
                  style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', display: 'flex', padding: '2px', borderRadius: '4px' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#4b5563'; }}
                >
                  <X size={13} />
                </button>
              </div>

              {/* Error box */}
              {inlineAIError && (
                <div style={{ padding: '6px 8px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '4px', color: '#f87171', fontSize: '11px', lineHeight: '1.4' }}>
                  {inlineAIError}
                </div>
              )}

              {/* Input Area */}
              <div style={{ display: 'flex', gap: '6px', background: '#0d1117', border: '1px solid #1f2937', borderRadius: '6px', padding: '4px 6px', alignItems: 'center', transition: 'border-color 150ms' }}
                onFocusCapture={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#3b82f6'; }}
                onBlurCapture={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#1f2937'; }}
              >
                <input
                  value={inlineAIInput}
                  onChange={(e) => setInlineAIInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); void submitInlineAI(); }
                    if (e.key === 'Escape') { e.preventDefault(); setInlineAIActive(false); if (editorInstance) editorInstance.focus(); }
                  }}
                  placeholder="Ask AI to edit this code... (Enter to edit)"
                  disabled={inlineAISubmitting}
                  autoFocus
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#e2e8f0',
                    fontSize: '12px',
                    fontFamily: "'Inter', sans-serif",
                    padding: '4px',
                  }}
                />
                <button
                  onClick={() => void submitInlineAI()}
                  disabled={inlineAISubmitting || !inlineAIInput.trim()}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    background: (inlineAISubmitting || !inlineAIInput.trim()) ? '#1f2937' : '#3b82f6',
                    color: (inlineAISubmitting || !inlineAIInput.trim()) ? '#4b5563' : 'white',
                    border: 'none',
                    cursor: (inlineAISubmitting || !inlineAIInput.trim()) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 120ms',
                  }}
                >
                  <Send size={11} />
                </button>
              </div>

              {/* Status / Esc to exit */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', color: '#4b5563' }}>
                <span>NVIDIA NIM AI • Stream Active</span>
                <span>Esc to cancel</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
