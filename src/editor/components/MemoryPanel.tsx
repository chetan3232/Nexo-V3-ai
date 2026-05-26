import { useMemo, useState } from 'react';
import { Database, Search } from 'lucide-react';
import { MemoryLayer } from '@/memory/types';
import { useMemoryStore } from '@/store/useMemoryStore';

const layers: MemoryLayer[] = ['short', 'long', 'project', 'conversation', 'code'];

export function MemoryPanel() {
  const [query, setQuery] = useState('monaco editor context');
  const { entries, getLayerCount, retrieveRelevant } = useMemoryStore();
  const results = useMemo(() => retrieveRelevant(query, layers, 8), [entries, query, retrieveRelevant]);

  return (
    <section className="flex h-full flex-col bg-slate-950/85 backdrop-blur-xl">
      <div className="grid grid-cols-5 border-b border-cyan-400/20 text-xs text-slate-300">
        {layers.map((layer) => (
          <div key={layer} className="flex items-center justify-between border-r border-cyan-400/10 px-3 py-2">
            <span className="capitalize">{layer}</span>
            <span className="text-cyan-200">{getLayerCount(layer)}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 border-b border-cyan-400/15 p-3">
        <Search className="h-4 w-4 text-cyan-300" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
          placeholder="Search memory layers"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-3">
        <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-cyan-300">
          <Database className="h-4 w-4" /> Retrieved Context
        </div>
        <div className="grid gap-2">
          {results.map((entry) => (
            <article key={entry.id} className="rounded border border-cyan-400/15 bg-slate-900/60 p-3 text-sm text-slate-200">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-cyan-200">{entry.layer} / {entry.title}</span>
                <span className="text-slate-400">{entry.score.toFixed(2)}</span>
              </div>
              <p className="line-clamp-2 text-slate-300">{entry.content}</p>
              <div className="mt-2 text-[10px] text-slate-500">{entry.source ?? 'local memory'} | {entry.tags.join(', ')}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
