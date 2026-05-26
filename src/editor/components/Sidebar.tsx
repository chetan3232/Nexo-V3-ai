import { FolderGit2, RefreshCw } from 'lucide-react';
import { useFileSystemStore } from '@/store/useFileSystemStore';
import { ExplorerTree } from './ExplorerTree';

type Props = {
  collapsed: boolean;
};

export function Sidebar({ collapsed }: Props) {
  const syncFromBackend = useFileSystemStore((state) => state.syncFromBackend);

  if (collapsed) {
    return <div className="h-full border-r border-cyan-400/10 bg-slate-900/40" />;
  }

  return (
    <aside className="h-full border-r border-cyan-400/20 bg-slate-900/40 p-3 text-sm text-slate-200 backdrop-blur-lg">
      <div className="mb-4 flex items-center justify-between gap-2 text-xs uppercase tracking-[0.2em] text-cyan-300/90">
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
      <ExplorerTree />
    </aside>
  );
}
