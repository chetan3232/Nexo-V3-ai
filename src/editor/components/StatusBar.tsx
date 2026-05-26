import { Cpu, GitBranch, Wifi } from 'lucide-react';

export function StatusBar() {
  return (
    <footer className="flex h-8 items-center justify-between border-t border-cyan-400/20 bg-slate-950 px-3 text-[11px] text-slate-300">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1"><GitBranch className="h-3.5 w-3.5" /> codex/nexo-v3</span>
        <span>TypeScript React</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1"><Cpu className="h-3.5 w-3.5 text-cyan-300" /> AI Assist: ON</span>
        <span className="flex items-center gap-1"><Wifi className="h-3.5 w-3.5 text-emerald-300" /> Runtime Ready</span>
      </div>
    </footer>
  );
}
