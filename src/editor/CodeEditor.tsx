import { useMemo } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { Save, SplitSquareHorizontal, FileCode2 } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';

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
      }}>
        <Editor
          height="100%"
          language={active.language}
          value={active.content}
          beforeMount={defineNexoTheme}
          theme="nexo-dark"
          options={editorOptions}
          onChange={(v) => updateFileContent(active.path, v ?? '')}
        />

        {split && (
          <div style={{ borderLeft: '1px solid #1f2937' }}>
            <Editor
              height="100%"
              language={split.language}
              value={split.content}
              beforeMount={defineNexoTheme}
              theme="nexo-dark"
              options={{ ...editorOptions, minimap: { enabled: false } }}
              onChange={(v) => updateFileContent(split.path, v ?? '')}
            />
          </div>
        )}
      </div>
    </div>
  );
}
