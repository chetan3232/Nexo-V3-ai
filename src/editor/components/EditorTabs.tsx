import { X } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';

export function EditorTabs() {
  const { openedFiles, activeFile, setActiveFile, closeFile, isDirty } = useEditorStore();

  return (
    <div className="flex items-center border-b border-cyan-400/20 bg-slate-900/60">
      {openedFiles.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveFile(tab)}
          className={`group flex items-center gap-2 border-r border-cyan-400/10 px-4 py-2 text-xs ${
            activeFile === tab ? 'bg-slate-950/70 text-cyan-200' : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
          }`}
        >
          <span>{tab}</span>
          {isDirty(tab) && <span className="text-[10px] text-amber-300">●</span>}
          <span
            role="button"
            tabIndex={0}
            onClick={(event) => {
              event.stopPropagation();
              closeFile(tab);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.stopPropagation();
                closeFile(tab);
              }
            }}
          >
            <X className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100" />
          </span>
        </button>
      ))}
    </div>
  );
}
