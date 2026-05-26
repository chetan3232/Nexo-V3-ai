import { BrainCircuit, CheckCircle2, Circle, Loader2, Play, Wrench } from 'lucide-react';
import { useAgentTaskStore } from '@/store/useAgentTaskStore';

function statusIcon(status: string) {
  if (status === 'done') return <CheckCircle2 className="h-4 w-4 text-emerald-300" />;
  if (status === 'running') return <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />;
  if (status === 'error') return <Wrench className="h-4 w-4 text-rose-300" />;
  return <Circle className="h-4 w-4 text-slate-500" />;
}

export function AgentTaskPanel() {
  const { goal, phase, plan, logs, setGoal, runAutonomousTask } = useAgentTaskStore();

  return (
    <section className="flex h-full flex-col bg-slate-950/85 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-cyan-400/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300">
        <span className="flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-cyan-300" /> Autonomous Coding
        </span>
        <span className="text-cyan-200">{phase}</span>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(280px,0.85fr)_1.15fr] gap-3 p-3">
        <div className="flex min-h-0 flex-col gap-3">
          <textarea
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            className="h-20 resize-none rounded border border-cyan-300/25 bg-slate-900 p-2 text-sm text-slate-100 outline-none focus:border-cyan-300"
          />
          <button
            onClick={() => void runAutonomousTask()}
            className="flex items-center justify-center gap-2 rounded border border-cyan-300/30 bg-cyan-400/15 px-3 py-2 text-sm text-cyan-100 hover:bg-cyan-400/20"
          >
            <Play className="h-4 w-4" /> Run Agent
          </button>
          <div className="min-h-0 flex-1 overflow-auto rounded border border-cyan-400/15 bg-slate-900/60 p-3 font-mono text-xs text-slate-300">
            {logs.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>

        <div className="min-h-0 overflow-auto rounded border border-cyan-400/15 bg-slate-900/60 p-3">
          <div className="mb-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
            <div>
              <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-cyan-300">Files</div>
              {(plan?.filePlan ?? []).map((file) => <div key={file} className="truncate">{file}</div>)}
            </div>
            <div>
              <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-cyan-300">Dependencies</div>
              {(plan?.dependencyPlan ?? []).map((dep) => <div key={dep} className="truncate">{dep}</div>)}
            </div>
          </div>
          <div className="space-y-2">
            {(plan?.taskGraph ?? []).map((task) => (
              <div key={task.id} className="flex items-start gap-3 rounded border border-slate-700/70 bg-slate-950/50 p-2 text-sm text-slate-200">
                {statusIcon(task.status)}
                <div className="min-w-0">
                  <div className="font-medium text-slate-100">{task.title}</div>
                  <div className="truncate text-xs text-slate-400">{task.file ?? task.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
