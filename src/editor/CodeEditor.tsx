import { useMemo, useState } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { Bot, Save, Sparkles, SplitSquareHorizontal, WandSparkles } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { generateInlineSuggestion, InlineIntent } from '@/ai/inlineAssist';

function defineTheme(monaco: Monaco) {
  monaco.editor.defineTheme('nexo-neon', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '64748b' },
      { token: 'keyword', foreground: '22d3ee' },
      { token: 'string', foreground: '34d399' },
    ],
    colors: {
      'editor.background': '#020617',
      'editorLineNumber.foreground': '#334155',
      'editorLineNumber.activeForeground': '#67e8f9',
      'editorCursor.foreground': '#22d3ee',
    },
  });
}

function InlineActions({ onApply, onExplain }: { onApply: (intent: InlineIntent) => void; onExplain: () => void }) {
  return (
    <div className="flex items-center gap-2 border-b border-cyan-400/20 bg-slate-950/70 px-3 py-2 text-xs">
      <button onClick={() => onApply('ghostText')} className="rounded border border-cyan-300/25 px-2 py-1 text-cyan-200 hover:bg-cyan-500/10">Ghost Text</button>
      <button onClick={() => onApply('autocomplete')} className="rounded border border-cyan-300/25 px-2 py-1 text-cyan-200 hover:bg-cyan-500/10">Autocomplete</button>
      <button onClick={() => onApply('fix')} className="rounded border border-cyan-300/25 px-2 py-1 text-cyan-200 hover:bg-cyan-500/10">Inline Fix</button>
      <button onClick={() => onApply('rewrite')} className="rounded border border-cyan-300/25 px-2 py-1 text-cyan-200 hover:bg-cyan-500/10">Rewrite</button>
      <button onClick={onExplain} className="ml-auto flex items-center gap-1 rounded border border-emerald-300/30 px-2 py-1 text-emerald-200 hover:bg-emerald-500/10">
        <Bot className="h-3.5 w-3.5" /> Explain Selection
      </button>
    </div>
  );
}

export function CodeEditor() {
  const [explainText, setExplainText] = useState('');
  const { files, activeFile, splitFile, updateFileContent, saveFile, isDirty, toggleSplitFile } = useEditorStore();

  const active = activeFile ? files[activeFile] : null;
  const split = splitFile ? files[splitFile] : null;

  const editorOptions = useMemo(
    () => ({
      minimap: { enabled: true },
      fontSize: 13,
      smoothScrolling: true,
      cursorBlinking: 'phase' as const,
      automaticLayout: true,
      suggestOnTriggerCharacters: true,
      quickSuggestions: true,
      inlineSuggest: { enabled: true },
      wordWrap: 'on' as const,
    }),
    []
  );

  if (!active) {
    return <div className="flex h-full items-center justify-center text-slate-400">Open a file from explorer.</div>;
  }

  const applyInline = (intent: InlineIntent) => {
    const source = active.content;
    const suggestion = generateInlineSuggestion(intent, source);
    const next = intent === 'fix' || intent === 'rewrite' ? suggestion : `${source}${suggestion}`;
    updateFileContent(active.path, next);
    setExplainText('');
  };

  const explainSelection = () => {
    setExplainText(generateInlineSuggestion('explain', active.content));
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-cyan-400/15 bg-slate-900/50 px-3 py-2 text-xs text-slate-300">
        <div className="flex items-center gap-3">
          <span className="font-medium text-cyan-200">{active.path}</span>
          {isDirty(active.path) && <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-200">DIRTY</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleSplitFile} className="flex items-center gap-1 rounded border border-cyan-300/25 px-2 py-1 text-cyan-200 hover:bg-cyan-500/10">
            <SplitSquareHorizontal className="h-3.5 w-3.5" /> Split
          </button>
          <button onClick={() => saveFile(active.path)} className="flex items-center gap-1 rounded border border-emerald-300/25 px-2 py-1 text-emerald-200 hover:bg-emerald-500/10">
            <Save className="h-3.5 w-3.5" /> Save
          </button>
        </div>
      </div>

      <InlineActions onApply={applyInline} onExplain={explainSelection} />

      <div className={`grid flex-1 ${split ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <Editor
          height="100%"
          language={active.language}
          value={active.content}
          beforeMount={defineTheme}
          theme="nexo-neon"
          options={editorOptions}
          onChange={(value) => updateFileContent(active.path, value ?? '')}
        />

        {split && (
          <Editor
            height="100%"
            language={split.language}
            value={split.content}
            beforeMount={defineTheme}
            theme="nexo-neon"
            options={editorOptions}
            onChange={(value) => updateFileContent(split.path, value ?? '')}
          />
        )}
      </div>

      <div className="flex min-h-10 items-center gap-2 border-t border-cyan-400/15 bg-slate-950/70 px-3 text-xs text-slate-300">
        <WandSparkles className="h-3.5 w-3.5 text-cyan-300" />
        <span>{explainText || 'AI inline mode ready: ghost text, autocomplete, fixes, rewrites, and explain selection.'}</span>
        <Sparkles className="ml-auto h-3.5 w-3.5 animate-pulse text-fuchsia-300" />
      </div>
    </div>
  );
}
