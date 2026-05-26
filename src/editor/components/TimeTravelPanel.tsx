import { useState } from 'react';
import { Settings, RotateCcw, Clock, CheckCircle2, ChevronRight, FileCode, AlertCircle } from 'lucide-react';

const VERSION_HISTORY = [
  { id: 'v5', label: 'V5 (Active)', title: 'feat: added netflix user profile switcher page', time: '10 mins ago', author: 'Nexo Visual Builder', files: ['src/App.tsx', 'src/editor/components/NetflixPreview.tsx'], changes: '+58 lines, -12 lines' },
  { id: 'v4', label: 'V4', title: 'feat: designed interactive sliding movie lists', time: '30 mins ago', author: 'Programmer Bot', files: ['src/editor/components/NetflixPreview.tsx'], changes: '+94 lines, -4 lines' },
  { id: 'v3', label: 'V3', title: 'feat: integrated supabase auth forms', time: '1 hour ago', author: 'Database Bot', files: ['server/routes/auth.js', 'server/database/db.js'], changes: '+112 lines, -15 lines' },
  { id: 'v2', label: 'V2', title: 'feat: created hero movie glassmorphic player', time: '3 hours ago', author: 'Designer Bot', files: ['src/editor/components/NetflixPreview.tsx', 'src/App.tsx'], changes: '+42 lines, -8 lines' },
  { id: 'v1', label: 'V1', title: 'init: setup react app foundation', time: '5 hours ago', author: 'Chetan', files: ['package.json', 'src/main.tsx'], changes: '+180 lines' }
];

export function TimeTravelPanel() {
  const [selectedVer, setSelectedVer] = useState('v5');
  const [rollingBack, setRollingBack] = useState(false);
  const [activeVer, setActiveVer] = useState('v5');

  const triggerRollback = (verId: string) => {
    setRollingBack(true);
    setTimeout(() => {
      setActiveVer(verId);
      setRollingBack(false);
      alert(`Workspace rolled back to checkpoint: ${verId.toUpperCase()}! All files successfully restored.`);
    }, 2000);
  };

  const activeCheckpoint = VERSION_HISTORY.find(v => v.id === selectedVer)!;

  return (
    <section className="flex h-full flex-col bg-slate-950/85 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-cyan-400/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300">
        <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-cyan-300" /> Time Travel History</span>
        <span className="text-[10px] text-cyan-200 font-bold uppercase">{VERSION_HISTORY.length} Checkpoints</span>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[1.15fr_0.85fr] gap-3 p-3">
        {/* Timeline list */}
        <div className="space-y-2.5 overflow-y-auto pr-1">
          {VERSION_HISTORY.map((v) => {
            const isActive = activeVer === v.id;
            const isSelected = selectedVer === v.id;

            return (
              <div 
                key={v.id}
                onClick={() => setSelectedVer(v.id)}
                className={`relative rounded-xl border p-3 cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-cyan-400 bg-cyan-500/10 shadow-[0_0_12px_rgba(34,211,238,0.2)]' 
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-black tracking-wider uppercase ${
                    isActive ? 'text-emerald-400 font-extrabold' : 'text-slate-400'
                  }`}>
                    {v.label} {isActive && '● (Active)'}
                  </span>
                  <span className="text-[8px] text-slate-500">{v.time}</span>
                </div>
                <h4 className="text-xs font-semibold text-slate-200 mt-1 leading-snug line-clamp-1">{v.title}</h4>
                <div className="mt-2 flex items-center justify-between text-[8px] text-slate-400 border-t border-slate-800 pt-1.5">
                  <span>By {v.author}</span>
                  <span className="text-cyan-300 font-bold">{v.changes}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Details Side Column */}
        <div className="rounded-xl border border-cyan-400/15 bg-slate-900/60 p-3 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-cyan-300 font-black block mb-1">Checkpoint Info</span>
              <h4 className="text-xs font-bold text-slate-100">{activeCheckpoint.label}</h4>
              <p className="text-[10px] text-slate-400 mt-1 leading-snug">{activeCheckpoint.title}</p>
            </div>

            <div>
              <span className="text-[9px] uppercase tracking-wider text-cyan-300 font-black block mb-2">Affected Assets</span>
              <div className="space-y-1.5">
                {activeCheckpoint.files.map((file) => (
                  <div key={file} className="flex items-center gap-1.5 text-[9px] text-slate-300 font-mono truncate">
                    <FileCode className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{file.split('/').pop()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-800/80">
            {activeVer !== activeCheckpoint.id ? (
              <button
                onClick={() => triggerRollback(activeCheckpoint.id)}
                disabled={rollingBack}
                className="w-full flex items-center justify-center gap-1.5 rounded bg-red-600 px-3 py-2 text-[10px] font-black uppercase text-white hover:bg-red-500 disabled:opacity-40 transition"
              >
                {rollingBack ? (
                  <span className="animate-pulse">Restoring...</span>
                ) : (
                  <>
                    <RotateCcw className="h-3.5 w-3.5" /> Revert State
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center justify-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/25 py-2 text-[9px] font-bold text-emerald-400 uppercase">
                <CheckCircle2 className="h-3.5 w-3.5" /> Current Active
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
