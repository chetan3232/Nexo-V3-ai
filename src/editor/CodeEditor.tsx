import { useMemo, useRef } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { Save, SplitSquareHorizontal, FileCode2 } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';

// Define the clean dark theme matching our design system
function defineNexoTheme(monaco: Monaco) {
  monaco.editor.defineTheme('nexo-clean', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '',               foreground: 'c9d1d9' },
      { token: 'comment',        foreground: '4b5e78', fontStyle: 'italic' },
      { token: 'keyword',        foreground: '79c0ff' },
      { token: 'string',         foreground: 'a5d6ff' },
      { token: 'number',         foreground: 'f0883e' },
      { token: 'type',           foreground: 'ffa657' },
      { token: 'class',          foreground: 'ffa657' },
      { token: 'function',       foreground: 'd2a8ff' },
      { token: 'variable',       foreground: 'c9d1d9' },
      { token: 'parameter',      foreground: 'c9d1d9' },
      { token: 'operator',       foreground: '79c0ff' },
      { token: 'tag',            foreground: '7ee787' },
      { token: 'attribute.name', foreground: '79c0ff' },
      { token: 'attribute.value',foreground: 'a5d6ff' },
    ],
    colors: {
      'editor.background':              '#0d1117',
      'editor.foreground':              '#c9d1d9',
      'editor.lineHighlightBackground': '#161b22',
      'editor.selectionBackground':     '#264f78',
      'editor.inactiveSelectionBackground': '#1f2937',
      'editorLineNumber.foreground':    '#3d4a5c',
      'editorLineNumber.activeForeground': '#8b9ab2',
      'editorCursor.foreground':        '#3b82f6',
      'editorWhitespace.foreground':    '#1f2937',
      'editorIndentGuide.background':   '#1f2937',
      'editorIndentGuide.activeBackground': '#263346',
      'editorGutter.background':        '#0d1117',
      'editorWidget.background':        '#111827',
      'editorWidget.border':            '#1f2937',
      'editorSuggestWidget.background': '#111827',
      'editorSuggestWidget.border':     '#1f2937',
      'editorSuggestWidget.selectedBackground': '#1e3a5f',
      'editorHoverWidget.background':   '#111827',
      'editorHoverWidget.border':       '#1f2937',
      'input.background':               '#1a2233',
      'input.border':                   '#1f2937',
      'scrollbarSlider.background':     '#263346',
      'scrollbarSlider.hoverBackground':'#374151',
      'scrollbarSlider.activeBackground':'#3b82f6',
      'minimap.background':             '#0d1117',
      'breadcrumb.background':          '#0d1117',
      'breadcrumb.foreground':          '#4b5e78',
      'breadcrumb.activeSelectionForeground': '#8b9ab2',
      'statusBar.background':           '#3b82f6',
      'statusBar.foreground':           '#ffffff',
      'tab.activeBackground':           '#0d1117',
      'tab.inactiveBackground':         '#111827',
      'tab.border':                     '#1f2937',
      'tab.activeBorderTop':            '#3b82f6',
    },
  });
}

function getFileIcon(path: string) {
  const ext = path.split('.').pop() ?? '';
  const colors: Record<string, string> = {
    tsx: '#61dafb', ts: '#3178c6', jsx: '#f7df1e', js: '#f7df1e',
    css: '#264de4', json: '#fbc02d', md: '#a78bfa', py: '#3572A5',
  };
  return colors[ext] ?? '#8b9ab2';
}

function EmptyState() {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0d1117',
        gap: '12px',
      }}
    >
      <div
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '12px',
          background: '#111827',
          border: '1px solid #1f2937',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <FileCode2 size={24} color="#3b5e78" />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: '#4b5e78', marginBottom: '4px' }}>
          No file open
        </div>
        <div style={{ fontSize: '12px', color: '#263346' }}>
          Select a file from the Explorer
        </div>
      </div>
    </div>
  );
}

export function CodeEditor() {
  const { files, activeFile, splitFile, updateFileContent, saveFile, isDirty, toggleSplitFile } = useEditorStore();
  const editorRef = useRef<Parameters<NonNullable<Parameters<typeof Editor>[0]['onMount']>>[0] | null>(null);

  const active = activeFile ? files[activeFile] : null;
  const split  = splitFile  ? files[splitFile]  : null;

  const editorOptions = useMemo(
    () => ({
      minimap:                { enabled: true, scale: 1 },
      fontSize:               13.5,
      fontFamily:             "'JetBrains Mono', 'Fira Code', monospace",
      fontLigatures:          true,
      lineHeight:             22,
      smoothScrolling:        true,
      cursorBlinking:         'phase' as const,
      cursorSmoothCaretAnimation: 'on' as const,
      automaticLayout:        true,
      suggestOnTriggerCharacters: true,
      quickSuggestions:       true,
      inlineSuggest:          { enabled: true },
      wordWrap:               'off' as const,
      scrollBeyondLastLine:   false,
      renderLineHighlight:    'line' as const,
      padding:                { top: 12, bottom: 12 },
      lineNumbers:            'on' as const,
      glyphMargin:            false,
      folding:                true,
      renderWhitespace:       'none' as const,
      bracketPairColorization: { enabled: true },
      guides:                 { indentation: true },
      scrollbar: {
        vertical:             'auto' as const,
        horizontal:           'auto' as const,
        verticalScrollbarSize: 6,
        horizontalScrollbarSize: 6,
      },
    }),
    []
  );

  if (!active) return <EmptyState />;

  const langColor = getFileIcon(active.path);
  const fileName  = active.path.split('/').pop() ?? active.path;
  const dirPath   = active.path.split('/').slice(0, -1).join(' › ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0d1117' }}>
      {/* ── Breadcrumb bar ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          height: '30px',
          background: '#0d1117',
          borderBottom: '1px solid #1f2937',
          flexShrink: 0,
        }}
      >
        <div className="breadcrumb">
          <span className="breadcrumb-item" style={{ opacity: 0.6 }}>{dirPath}</span>
          {dirPath && <span className="breadcrumb-sep">›</span>}
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: langColor,
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            <span className="breadcrumb-item">{fileName}</span>
          </span>
          {isDirty(active.path) && (
            <span
              style={{
                marginLeft: '4px',
                fontSize: '10px',
                background: 'rgba(245,158,11,0.15)',
                color: '#f59e0b',
                border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: '3px',
                padding: '0 5px',
                lineHeight: '16px',
              }}
            >
              modified
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <button
            onClick={toggleSplitFile}
            className="icon-btn"
            title="Split editor"
          >
            <SplitSquareHorizontal size={14} />
          </button>
          <button
            onClick={() => saveFile(active.path)}
            className="icon-btn"
            title="Save (Ctrl+S)"
            style={{ color: isDirty(active.path) ? 'var(--accent)' : undefined }}
          >
            <Save size={14} />
          </button>
        </div>
      </div>

      {/* ── Editor(s) ── */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: split ? '1fr 1fr' : '1fr',
          minHeight: 0,
        }}
      >
        <Editor
          height="100%"
          language={active.language}
          value={active.content}
          beforeMount={defineNexoTheme}
          theme="nexo-clean"
          options={editorOptions}
          onMount={(editor) => { editorRef.current = editor; }}
          onChange={(value) => updateFileContent(active.path, value ?? '')}
        />

        {split && (
          <>
            <div style={{ borderLeft: '1px solid #1f2937' }}>
              <Editor
                height="100%"
                language={split.language}
                value={split.content}
                beforeMount={defineNexoTheme}
                theme="nexo-clean"
                options={{ ...editorOptions, minimap: { enabled: false } }}
                onChange={(value) => updateFileContent(split.path, value ?? '')}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
