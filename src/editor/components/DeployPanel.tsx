import { Rocket, ServerCog, Settings2 } from 'lucide-react';
import { deploymentProviders } from '@/deploy/providers';
import { useDeploymentStore } from '@/store/useDeploymentStore';

export function DeployPanel() {
  const { provider, status, plan, logs, setProvider, runDeployment } = useDeploymentStore();

  return (
    <section className="flex h-full flex-col bg-slate-950/85 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-cyan-400/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300">
        <span className="flex items-center gap-2">
          <Rocket className="h-4 w-4 text-cyan-300" /> One Click Deploy
        </span>
        <span className="text-cyan-200">{status}</span>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[280px_1fr] gap-3 p-3">
        <aside className="space-y-2">
          {deploymentProviders.map((item) => (
            <button
              key={item.id}
              onClick={() => setProvider(item.id)}
              className={`flex w-full items-center justify-between rounded border px-3 py-2 text-sm ${
                provider === item.id ? 'border-cyan-300/40 bg-cyan-400/15 text-cyan-100' : 'border-slate-700 bg-slate-900/60 text-slate-300'
              }`}
            >
              <span>{item.name}</span>
              <ServerCog className="h-4 w-4" />
            </button>
          ))}
          <button
            onClick={() => void runDeployment()}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded border border-emerald-300/30 bg-emerald-400/15 px-3 py-2 text-sm text-emerald-100"
          >
            <Rocket className="h-4 w-4" /> Deploy
          </button>
        </aside>

        <div className="grid min-h-0 grid-cols-2 gap-3">
          <div className="min-h-0 overflow-auto rounded border border-cyan-400/15 bg-slate-900/60 p-3 text-sm text-slate-200">
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-cyan-300">
              <Settings2 className="h-4 w-4" /> Generated Config
            </div>
            <pre className="whitespace-pre-wrap font-mono text-xs text-slate-300">{plan.buildConfig}</pre>
            <div className="mt-4 text-xs uppercase tracking-[0.2em] text-cyan-300">Env</div>
            <pre className="mt-2 whitespace-pre-wrap font-mono text-xs text-slate-300">{Object.entries(plan.env).map(([key, value]) => `${key}=${value}`).join('\n')}</pre>
          </div>

          <div className="min-h-0 overflow-auto rounded border border-cyan-400/15 bg-slate-900/60 p-3 text-sm text-slate-200">
            <div className="mb-2 text-xs uppercase tracking-[0.2em] text-cyan-300">Script</div>
            <pre className="whitespace-pre-wrap font-mono text-xs text-slate-300">{plan.deployScript}</pre>
            <div className="mt-4 text-xs uppercase tracking-[0.2em] text-cyan-300">Checklist</div>
            <ul className="mt-2 space-y-1 text-xs text-slate-300">
              {plan.checklist.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <div className="mt-4 text-xs uppercase tracking-[0.2em] text-cyan-300">Logs</div>
            <div className="mt-2 font-mono text-xs text-emerald-300">
              {logs.map((line) => <p key={line}>{line}</p>)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
