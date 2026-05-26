import { FolderGit2, RefreshCw, Search, Users, TerminalSquare, Sparkles, Clock, AlertTriangle } from 'lucide-react';
import { useFileSystemStore } from '@/store/useFileSystemStore';
import { ExplorerTree } from './ExplorerTree';
import { AITeamPanel } from './AITeamPanel';
import { DebuggerPanel } from './DebuggerPanel';
import { VisualBuilderPanel } from './VisualBuilderPanel';
import { TimeTravelPanel } from './TimeTravelPanel';

type Props = {
  collapsed: boolean;
  activeTab: number;
  onToggleCanvas: () => void;
  isCanvasOpen: boolean;
};

export function Sidebar({ collapsed, activeTab, onToggleCanvas, isCanvasOpen }: Props) {
  const syncFromBackend = useFileSystemStore((state) => state.syncFromBackend);

  if (collapsed) {
    return <div className="h-full border-r border-cyan-400/10 bg-slate-900/40" />;
  }

  // 1. FILE EXPLORER TAB (Index 0)
  if (activeTab === 0) {
    return (
      <aside className="h-full flex flex-col border-r border-cyan-400/20 bg-slate-900/40 p-3 text-sm text-slate-200 backdrop-blur-lg">
        <div className="mb-4 flex items-center justify-between gap-2 text-xs uppercase tracking-[0.2em] text-cyan-300/90 shrink-0">
          <span className="flex items-center gap-2">
            <FolderGit2 className="h-4 w-4" /> Explorer
          </span>
          <button
            onClick={() => void syncFromBackend().catch(() => undefined)}
            className="rounded p-1 text-slate-400 hover:bg-cyan-500/10 hover:text-cyan-100"
            title="Refresh from backend filesystem"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ExplorerTree />
        </div>
      </aside>
    );
  }

  // 2. SEARCH TAB (Index 1)
  if (activeTab === 1) {
    return (
      <aside className="h-full flex flex-col border-r border-cyan-400/20 bg-slate-900/40 p-3 text-sm text-slate-200 backdrop-blur-lg">
        <div className="mb-4 flex items-center justify-between gap-2 text-xs uppercase tracking-[0.2em] text-cyan-300/90 shrink-0">
          <span className="flex items-center gap-2">
            <Search className="h-4 w-4" /> Search Files
          </span>
        </div>
        <div className="space-y-3">
          <input
            placeholder="Search string"
            className="w-full rounded border border-cyan-300/20 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-cyan-300 placeholder:text-slate-600 font-mono"
          />
          <p className="text-[10px] text-slate-500 font-mono">// Press Enter to search references</p>
        </div>
      </aside>
    );
  }

  // 3. AI TEAM ROUNDTABLE DEBATES (Index 2)
  if (activeTab === 2) {
    return (
      <aside className="h-full border-r border-cyan-400/20 bg-slate-900/40 backdrop-blur-lg overflow-hidden">
        <AITeamPanel />
      </aside>
    );
  }

  // 4. SMART AI DEBUGGER & CONSOLE (Index 3)
  if (activeTab === 3) {
    return (
      <aside className="h-full border-r border-cyan-400/20 bg-slate-900/40 backdrop-blur-lg overflow-hidden">
        <DebuggerPanel />
      </aside>
    );
  }

  // 5. AI VISUAL BUILDER (Index 4)
  if (activeTab === 4) {
    return (
      <aside className="h-full border-r border-cyan-400/20 bg-slate-900/40 backdrop-blur-lg overflow-hidden">
        <VisualBuilderPanel onToggleSplit={onToggleCanvas} isSplitActive={isCanvasOpen} />
      </aside>
    );
  }

  // 6. TIME TRAVEL HISTORY (Index 5)
  if (activeTab === 5) {
    return (
      <aside className="h-full border-r border-cyan-400/20 bg-slate-900/40 backdrop-blur-lg overflow-hidden">
        <TimeTravelPanel />
      </aside>
    );
  }

  return <div className="h-full border-r border-cyan-400/10 bg-slate-900/40" />;
}
