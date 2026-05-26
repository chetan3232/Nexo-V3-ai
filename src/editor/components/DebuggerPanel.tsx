import { useState } from 'react';
import { TerminalSquare, AlertTriangle, Play, RefreshCw, CheckCircle2, Wrench, ShieldCheck, Code } from 'lucide-react';

export function DebuggerPanel() {
  const [hasError, setHasError] = useState(true);
  const [debugging, setDebugging] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [debugStep, setDebugStep] = useState(0);

  const startAutoFix = () => {
    setDebugging(true);
    setDebugStep(1);
    setDebugLogs(['[debugger] Analyzing active stack trace...']);

    setTimeout(() => {
      setDebugStep(2);
      setDebugLogs(prev => [...prev, '[debugger] Spawning reproduction test container in Docker Sandbox...']);
    }, 1200);

    setTimeout(() => {
      setDebugStep(3);
      setDebugLogs(prev => [...prev, '[debugger] Bug identified: TypeError inside NetflixPreview (movies is undefined before API fetch finishes).']);
    }, 2400);

    setTimeout(() => {
      setDebugStep(4);
      setDebugLogs(prev => [...prev, '[debugger] Applying safe fallback assignment patch: replace "movies.map" with "(movies || []).map".']);
    }, 3600);

    setTimeout(() => {
      setDebugStep(5);
      setDebugLogs(prev => [...prev, '[debugger] Patch applied successfully. Re-running integration test passes!']);
      setHasError(false);
      setDebugging(false);
    }, 5000);
  };

  return (
    <section className="flex h-full flex-col bg-slate-950/85 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-cyan-400/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300">
        <span className="flex items-center gap-2"><TerminalSquare className="h-4 w-4 text-cyan-300" /> Smart AI Debugger</span>
        {hasError ? (
          <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] text-rose-300 font-bold tracking-normal">1 Error Detected</span>
        ) : (
          <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-300 font-bold tracking-normal">System Stable</span>
        )}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(280px,0.85fr)_1.15fr] gap-3 p-3">
        {/* Error Terminal Log pane */}
        <div className="flex flex-col gap-3 min-h-0">
          <div className="flex-1 rounded border border-slate-800 bg-slate-950 p-4 font-mono text-[11px] leading-relaxed overflow-y-auto">
            {hasError ? (
              <div className="space-y-2.5 text-rose-400">
                <p className="text-rose-300 font-black flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" /> [CRITICAL ERROR] Compile Failure
                </p>
                <div className="border-l-2 border-rose-500 pl-3 space-y-1 text-slate-300">
                  <p className="text-rose-400 font-bold">TypeError: Cannot read properties of undefined (reading 'map')</p>
                  <p className="text-slate-400">at MovieRow (src/editor/components/NetflixPreview.tsx:84:22)</p>
                  <p className="text-slate-400">at renderWithHooks (node_modules/react-dom:12402)</p>
                  <p className="text-slate-400">at mountIndeterminateComponent (node_modules/react-dom:14820)</p>
                </div>
                <p className="text-slate-500 mt-2">// Click Auto-Fix to analyze and patch securely</p>
              </div>
            ) : (
              <div className="space-y-2.5 text-emerald-400">
                <p className="text-emerald-300 font-black flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" /> [SUCCESS] System Verified
                </p>
                <div className="border-l-2 border-emerald-500 pl-3 space-y-1 text-slate-300">
                  <p className="text-emerald-400 font-bold">All 14 integration test suites completed successfully.</p>
                  <p className="text-slate-400">Memory leaks: None detected</p>
                  <p className="text-slate-400">Active docker sandbox processes: stable</p>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={startAutoFix}
            disabled={!hasError || debugging}
            className="flex items-center justify-center gap-2 rounded border border-cyan-300/30 bg-cyan-400/15 py-2.5 text-xs font-bold text-cyan-100 hover:bg-cyan-400/25 disabled:opacity-40 transition"
          >
            {debugging ? (
              <RefreshCw className="h-4 w-4 animate-spin text-cyan-300" />
            ) : (
              <Wrench className="h-4 w-4" />
            )}
            AI Auto-Fix Bug
          </button>
        </div>

        {/* Diagnostics & Logs column */}
        <div className="rounded-xl border border-cyan-400/15 bg-slate-900/60 p-3 overflow-y-auto space-y-3 font-mono text-[11px] text-slate-300">
          <div className="text-[10px] uppercase tracking-wider text-cyan-300 font-bold border-b border-cyan-400/10 pb-1.5 flex items-center justify-between">
            <span>Diagnostics Pipeline</span>
            {debugging && <span className="animate-pulse">Active</span>}
          </div>

          {debugStep > 0 && (
            <div className="space-y-3">
              {[
                'Analyzing runtime stack trace logs',
                'Spawning isolated container reproduction tests',
                'Root cause: missing default values on asynchronous lists',
                'Inject safe list wrapper patch in active code',
                'Hot-reload and run verification passes'
              ].map((step, idx) => (
                <div key={idx} className="flex items-start gap-2 leading-tight">
                  <div className={`h-2 w-2 rounded-full mt-1.5 ${
                    debugStep > idx + 1 ? 'bg-cyan-400' : debugStep === idx + 1 ? 'bg-cyan-400 animate-ping' : 'bg-slate-700'
                  }`} />
                  <span className={debugStep > idx ? 'text-slate-100' : 'text-slate-500'}>{step}</span>
                  {debugStep > idx && <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 ml-auto shrink-0" />}
                </div>
              ))}
            </div>
          )}

          {debugStep >= 4 && (
            <div className="rounded border border-emerald-500/20 bg-emerald-950/20 p-2.5 space-y-2 mt-4">
              <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-emerald-400 font-black"><Code className="h-3.5 w-3.5" /> Proposed Patch</span>
              <pre className="text-[9px] leading-snug text-slate-300 bg-black/60 p-1.5 rounded overflow-x-auto">
{`- movies.map((movie) => (
+ (movies || []).map((movie) => (`}
              </pre>
            </div>
          )}

          <div className="border-t border-cyan-400/10 pt-2 space-y-1 text-slate-500">
            {debugLogs.map((log, i) => <p key={i}>{log}</p>)}
          </div>
        </div>
      </div>
    </section>
  );
}
