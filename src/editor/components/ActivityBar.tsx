import { BrainCircuit, Files, Search, Settings, Sparkles, TerminalSquare } from 'lucide-react';

const actions = [Files, Search, BrainCircuit, TerminalSquare, Sparkles, Settings];

type Props = {
  activeIndex: number;
  onSelect: (index: number) => void;
};

export function ActivityBar({ activeIndex, onSelect }: Props) {
  return (
    <aside className="flex h-full flex-col items-center gap-3 border-r border-cyan-400/20 bg-slate-950/80 p-2 backdrop-blur-xl">
      {actions.map((Icon, index) => (
        <button
          key={index}
          onClick={() => onSelect(index)}
          className={`group relative rounded-xl p-2.5 transition ${
            activeIndex === index
              ? 'bg-cyan-400/20 text-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.35)]'
              : 'text-slate-400 hover:bg-slate-800/70 hover:text-cyan-200'
          }`}
          aria-label={`activity-${index}`}
        >
          <Icon className="h-5 w-5" />
          {activeIndex === index && <span className="absolute left-0 top-2 h-6 w-0.5 rounded bg-cyan-300" />}
        </button>
      ))}
    </aside>
  );
}
