import { useState } from 'react';
import { BrainCircuit, Database, Rocket, TerminalSquare, WandSparkles } from 'lucide-react';
import { AIChatPanel } from './AIChatPanel';
import { AgentTaskPanel } from './AgentTaskPanel';
import { MemoryPanel } from './MemoryPanel';
import { DeployPanel } from './DeployPanel';

export function BottomPanel() {
  const [tab, setTab] = useState<'terminal' | 'chat' | 'agent' | 'memory' | 'deploy'>('chat');

  return (
    <section className="h-full bg-slate-950/85 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-cyan-400/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300">
        <div className="flex items-center gap-2">
          <button onClick={() => setTab('terminal')} className={tab === 'terminal' ? 'text-cyan-200' : 'text-slate-400'}>
            <TerminalSquare className="mr-1 inline h-4 w-4" /> Terminal
          </button>
          <button onClick={() => setTab('chat')} className={tab === 'chat' ? 'text-cyan-200' : 'text-slate-400'}>
            <WandSparkles className="mr-1 inline h-4 w-4" /> AI Chat
          </button>
          <button onClick={() => setTab('agent')} className={tab === 'agent' ? 'text-cyan-200' : 'text-slate-400'}>
            <BrainCircuit className="mr-1 inline h-4 w-4" /> Agent
          </button>
          <button onClick={() => setTab('memory')} className={tab === 'memory' ? 'text-cyan-200' : 'text-slate-400'}>
            <Database className="mr-1 inline h-4 w-4" /> Memory
          </button>
          <button onClick={() => setTab('deploy')} className={tab === 'deploy' ? 'text-cyan-200' : 'text-slate-400'}>
            <Rocket className="mr-1 inline h-4 w-4" /> Deploy
          </button>
        </div>
        <div className="text-cyan-200">{tab === 'chat' ? 'Streaming Context' : tab === 'agent' ? 'Live Task Graph' : tab === 'memory' ? 'Retrieval Engine' : tab === 'deploy' ? 'Provider Handoff' : 'Live Agent Output'}</div>
      </div>
      {tab === 'chat' && <AIChatPanel />}
      {tab === 'agent' && <AgentTaskPanel />}
      {tab === 'memory' && <MemoryPanel />}
      {tab === 'deploy' && <DeployPanel />}
      {tab === 'terminal' && (
        <div className="p-4 font-mono text-xs text-emerald-300">
          <p>&gt; nexo-agent run --goal "scaffold deployment pipeline"</p>
          <p className="text-slate-400">streaming tokens...</p>
          <p className="typing-effect">[planner] Drafting dependency graph and runtime checks...</p>
        </div>
      )}
    </section>
  );
}
