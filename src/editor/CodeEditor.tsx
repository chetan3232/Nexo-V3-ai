import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { Save, SplitSquareHorizontal, FileCode2, Wand2, X, Send, Settings } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { useChatStore } from '@/store/useChatStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { streamAIResponse, streamNvidiaResponse } from '@/services/aiStreamClient';
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

  // Custom Persisted Settings
  const {
    autoSave, fontSize, wordWrap, minimapEnabled,
    setAutoSave, setFontSize, setWordWrap, setMinimapEnabled
  } = useSettingsStore();

  // Floating Inline AI state
  const [inlineAIActive, setInlineAIActive] = useState(false);
  const [inlineAIPosition, setInlineAIPosition] = useState<{ top: number; left: number } | null>(null);
  const [inlineAIInput, setInlineAIInput] = useState('');
  const [inlineAISelection, setInlineAISelection] = useState<any>(null);
  const [inlineAISubmitting, setInlineAISubmitting] = useState(false);
  const [inlineAIError, setInlineAIError] = useState<string | null>(null);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editorInstance, setEditorInstance] = useState<any>(null);
  const [monacoInstance, setMonacoInstance] = useState<Monaco | null>(null);
  const saveTimeoutRef = useRef<any>(null);

  // Debounced auto-save triggers
  const handleContentChange = (val: string | undefined) => {
    if (!active) return;
    updateFileContent(active.path, val ?? '');

    if (autoSave) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveFile(active.path);
      }, 1000); // 1000ms debounce save
    }
  };

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

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

    // Set monaco globally so other components (like AI context engines) can query error diagnostics
    (window as any).monaco = monaco;

    // Register Ctrl/Cmd + K shortcut for inline AI panel
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

    // ── 1. Register Custom Right-Click Context Menu AI Actions ─────────────────
    editor.addAction({
      id: 'nexo-explain-selection',
      label: 'Nexo AI: Explain selection',
      contextMenuOrder: 1,
      contextMenuGroupId: 'navigation',
      run: (ed: any) => {
        const selectionText = ed.getModel()?.getValueInRange(ed.getSelection()) ?? '';
        if (selectionText) {
          useChatStore.getState().setInput(`Explain this selected code:\n\`\`\`\n${selectionText}\n\`\`\``);
        }
      }
    });

    editor.addAction({
      id: 'nexo-optimize-performance',
      label: 'Nexo AI: Optimize performance',
      contextMenuOrder: 2,
      contextMenuGroupId: 'navigation',
      run: (ed: any) => {
        const selectionText = ed.getModel()?.getValueInRange(ed.getSelection()) ?? '';
        if (selectionText) {
          useChatStore.getState().setInput(`Optimize this selected code for better performance, memory footprint, and CPU execution:\n\`\`\`\n${selectionText}\n\`\`\``);
        }
      }
    });

    editor.addAction({
      id: 'nexo-document-code',
      label: 'Nexo AI: Document code',
      contextMenuOrder: 3,
      contextMenuGroupId: 'navigation',
      run: (ed: any) => {
        const selectionText = ed.getModel()?.getValueInRange(ed.getSelection()) ?? '';
        if (selectionText) {
          useChatStore.getState().setInput(`Add high-quality comments, JSDoc/docstrings, and clear developer documentation to this code:\n\`\`\`\n${selectionText}\n\`\`\``);
        }
      }
    });

    // ── 2. Register Debounced Monaco Inline AI Ghost Text Autocomplete ─────────
    let autocompleteTimer: any = null;

    const nexoInlineProvider = {
      provideInlineCompletions: async (model: any, position: any, context: any, token: any) => {
        if (autocompleteTimer) clearTimeout(autocompleteTimer);

        const lineContent = model.getLineContent(position.lineNumber);
        const prefix = lineContent.substring(0, position.column - 1);

        // Only query if user typed at least 3 characters on this active line
        if (prefix.trim().length < 3) {
          return { items: [] };
        }

        return new Promise((resolve) => {
          autocompleteTimer = setTimeout(async () => {
            if (token.isCancellationRequested) {
              resolve({ items: [] });
              return;
            }

            try {
              const offset = model.getOffsetAt(position);
              const text = model.getValue();
              const beforeContext = text.substring(Math.max(0, offset - 1200), offset);

              const prompt = `You are a high-speed inline code autocompletion engine inside an AI-native IDE.
Complete the code immediately following the cursor.
Output ONLY the continuation of the code.
- Do NOT include markdown code fences (like \`\`\`js).
- Do NOT include conversational explanations or chat comments.
- Do NOT repeat the prefix code that is already there.

CODE CONTEXT BEFORE CURSOR:
${beforeContext}

CONTINUATION:`;

              let completionText = '';
              await streamAIResponse(
                [{ role: 'user', content: prompt }],
                'nexo-auto-router', // Route automatically to cheap model (Nemotron Nano / OpenAI Mini / Claude Haiku / local Ollama)
                {
                  onToken: (token) => {
                    completionText += token;
                  },
                  onDone: () => {
                    // Clean markdown and duplicate prefixes
                    completionText = completionText.replace(/^```(\w+)?\n/, '').replace(/```$/, '');
                    if (completionText.startsWith(prefix)) {
                      completionText = completionText.substring(prefix.length);
                    }

                    resolve({
                      items: [
                        {
                          insertText: completionText,
                          range: new monaco.Range(
                            position.lineNumber,
                            position.column,
                            position.lineNumber,
                            position.column
                          ),
                        },
                      ],
                    });
                  },
                  onError: () => {
                    resolve({ items: [] });
                  }
                },
                { temperature: 0.1, maxTokens: 48 }
              );
            } catch (e) {
              resolve({ items: [] });
            }
          }, 600); // 600ms debounce
        });
      },
      freeInlineCompletions: () => {},
    };

    if (!(window as any).nexoInlineProviderRegistered) {
      (window as any).nexoInlineProviderRegistered = true;
      const languages = ['typescript', 'javascript', 'python', 'html', 'css', 'json', 'markdown', 'plaintext'];
      languages.forEach((lang) => {
        try {
          monaco.languages.registerInlineCompletionsProvider(lang, nexoInlineProvider);
        } catch (e) {}
      });
    }
  };

  useEffect(() => {
    if (!editorInstance || !monacoInstance) return;

    const handleEditorCommand = (e: CustomEvent<{ command: string; payload?: any }>) => {
      const { command, payload } = e.detail;
      switch (command) {
        case 'undo':
          editorInstance.trigger('menu', 'undo', null);
          break;
        case 'redo':
          editorInstance.trigger('menu', 'redo', null);
          break;
        case 'cut':
          document.execCommand('cut');
          break;
        case 'copy':
          document.execCommand('copy');
          break;
        case 'paste':
          navigator.clipboard.readText().then((text) => {
            const selection = editorInstance.getSelection();
            if (selection) {
              editorInstance.executeEdits('paste-menu', [{
                range: selection,
                text: text,
                forceMoveMarkers: true
              }]);
            }
          }).catch(() => {
            document.execCommand('paste');
          });
          break;
        case 'select-all': {
          const model = editorInstance.getModel();
          if (model) {
            const lineCount = model.getLineCount();
            const lastLineLength = model.getLineContent(lineCount).length;
            editorInstance.setSelection(new monacoInstance.Selection(
              1, 1, lineCount, lastLineLength + 1
            ));
          }
          break;
        }
        case 'find':
          editorInstance.trigger('menu', 'actions.find', null);
          break;
        case 'replace':
          editorInstance.trigger('menu', 'editor.action.startFindReplaceAction', null);
          break;
        case 'go-to-line': {
          let targetLineStr = payload;
          if (targetLineStr === undefined || targetLineStr === null) {
            targetLineStr = prompt('Go to line (1-based):');
          }
          if (targetLineStr) {
            const lineNum = parseInt(targetLineStr, 10);
            if (!isNaN(lineNum)) {
              editorInstance.setPosition({ lineNumber: lineNum, column: 1 });
              editorInstance.revealLineInCenter(lineNum);
              editorInstance.focus();
            }
          }
          break;
        }
        case 'toggle-settings':
          setSettingsOpen((o) => !o);
          break;
        default:
          break;
      }
    };

    window.addEventListener('nexo-editor-command' as any, handleEditorCommand);
    return () => {
      window.removeEventListener('nexo-editor-command' as any, handleEditorCommand);
    };
  }, [editorInstance, monacoInstance]);

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
      await streamAIResponse(messages, model, {
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
    minimap:                    { enabled: minimapEnabled, scale: 1, renderCharacters: false },
    fontSize:                   fontSize,
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
    wordWrap:                   wordWrap,
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
  }), [fontSize, wordWrap, minimapEnabled]);

  if (!active) return <EmptyState />;

  const fileParts = active.path.split('/');
  const fileName  = fileParts.pop() ?? active.path;
  const dirParts  = fileParts;
  const iconColor = getBreadcrumbIcon(fileName);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0d1117', position: 'relative' }}>
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
          {/* Split Screen */}
          <button
            onClick={toggleSplitFile}
            title="Split Editor"
            style={actionBtnStyle}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#4b5563'; }}
          >
            <SplitSquareHorizontal size={14} />
          </button>
          
          {/* Editor Settings Cog */}
          <button
            onClick={() => setSettingsOpen((o) => !o)}
            title="Editor Settings"
            style={{
              ...actionBtnStyle,
              color: settingsOpen ? '#3b82f6' : '#4b5563',
            }}
            onMouseEnter={(e) => { if (!settingsOpen) (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af'; }}
            onMouseLeave={(e) => { if (!settingsOpen) (e.currentTarget as HTMLButtonElement).style.color = '#4b5563'; }}
          >
            <Settings size={14} />
          </button>

          {/* Manual Save */}
          <button
            onClick={() => saveFile(active.path)}
            title="Save (Ctrl+S)"
            style={{
              ...actionBtnStyle,
              color: isDirty(active.path) ? '#3b82f6' : '#4b5563',
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
          onChange={handleContentChange}
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

        {/* ── Interactive Settings Floating Panel ── */}
        <AnimatePresence>
          {settingsOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
              style={{
                position: 'absolute',
                top: '32px',
                right: '12px',
                width: '220px',
                background: 'rgba(17, 24, 39, 0.92)',
                backdropFilter: 'blur(16px)',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
                padding: '12px',
                zIndex: 1010,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#4b5563', letterSpacing: '0.08em', borderBottom: '1px solid #1f2937', paddingBottom: '6px' }}>EDITOR CONFIG</div>

              {/* Toggle Auto Save */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#c9d1d9' }}>
                <span>Auto Save</span>
                <input
                  type="checkbox"
                  checked={autoSave}
                  onChange={(e) => setAutoSave(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
              </div>

              {/* Change Font Size */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#c9d1d9' }}>
                <span>Font Size</span>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  style={{
                    background: '#0d1117',
                    border: '1px solid #1f2937',
                    color: '#c9d1d9',
                    fontSize: '11px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  {[12, 13, 14, 15, 16].map((sz) => (
                    <option key={sz} value={sz}>{sz}px</option>
                  ))}
                </select>
              </div>

              {/* Toggle Word Wrap */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#c9d1d9' }}>
                <span>Word Wrap</span>
                <input
                  type="checkbox"
                  checked={wordWrap === 'on'}
                  onChange={(e) => setWordWrap(e.target.checked ? 'on' : 'off')}
                  style={{ cursor: 'pointer' }}
                />
              </div>

              {/* Toggle Minimap */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#c9d1d9' }}>
                <span>Minimap</span>
                <input
                  type="checkbox"
                  checked={minimapEnabled}
                  onChange={(e) => setMinimapEnabled(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const actionBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: '4px',
  cursor: 'pointer',
  color: '#4b5563',
  borderRadius: '4px',
  display: 'flex',
  transition: 'color 100ms',
};
