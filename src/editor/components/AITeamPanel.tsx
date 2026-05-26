import { useState } from 'react';
import { Send, Users, Sparkles, MessageCircle, Bot } from 'lucide-react';

type Message = {
  agent: string;
  avatar: string;
  color: string;
  role: string;
  text: string;
};

const AGENT_EXPERTS = [
  { name: 'Designer Bot', role: 'UX/UI Specialist', avatar: '🎨', color: 'text-rose-300 border-rose-400/40 bg-rose-950/20' },
  { name: 'Architect Bot', role: 'System Orchestrator', avatar: '⚙️', color: 'text-purple-300 border-purple-400/40 bg-purple-950/20' },
  { name: 'Database Bot', role: 'Supabase Engineer', avatar: '💾', color: 'text-emerald-300 border-emerald-400/40 bg-emerald-950/20' },
  { name: 'Programmer Bot', role: 'Lead Developer', avatar: '🚀', color: 'text-cyan-300 border-cyan-400/40 bg-cyan-950/20' }
];

export function AITeamPanel() {
  const [input, setInput] = useState('how should we design the database and login page logic for the netflix clone?');
  const [messages, setMessages] = useState<Message[]>([
    { agent: 'Designer Bot', avatar: '🎨', role: 'UX/UI Specialist', color: 'text-rose-300 border-rose-400/40 bg-rose-950/20', text: 'Let’s use a gorgeous glassmorphic profile switcher layout. Dark background with vivid red accent glows to preserve the premium feel.' }
  ]);
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);

  const startLiveDebate = () => {
    if (!input.trim()) return;

    setMessages([]);
    setInput('');
    setActiveSpeaker('Architect Bot');

    // Dialogue sequence simulating live agent debates
    setTimeout(() => {
      setMessages(prev => [...prev, {
        agent: 'Architect Bot', avatar: '⚙️', role: 'System Orchestrator', color: 'text-purple-300 border-purple-400/40 bg-purple-950/20',
        text: 'Agreed. From an orchestration standpoint, let’s keep page structures modular: split Profiles, Hero lists, and the Video Player into reusable sub-components.'
      }]);
      setActiveSpeaker('Database Bot');
    }, 1500);

    setTimeout(() => {
      setMessages(prev => [...prev, {
        agent: 'Database Bot', avatar: '💾', role: 'Supabase Engineer', color: 'text-emerald-300 border-emerald-400/40 bg-emerald-950/20',
        text: 'For user profiles, I will hook up a simulated Supabase DB synchronization mapping owner IDs, keeping session tokens intact in the global layout context.'
      }]);
      setActiveSpeaker('Programmer Bot');
    }, 3200);

    setTimeout(() => {
      setMessages(prev => [...prev, {
        agent: 'Programmer Bot', avatar: '🚀', role: 'Lead Developer', color: 'text-cyan-300 border-cyan-400/40 bg-cyan-950/20',
        text: 'Awesome details. Writing the clean React TSX component matching all spec guidelines now and pushing vector indices to local semantic memory engines.'
      }]);
      setActiveSpeaker(null);
    }, 5000);
  };

  return (
    <section className="flex h-full flex-col bg-slate-950/85 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-cyan-400/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300">
        <span className="flex items-center gap-2"><Users className="h-4 w-4 text-cyan-300" /> AI Team Roundtable</span>
        <span className="text-[10px] text-slate-500 font-bold uppercase">4 Specialists Active</span>
      </div>

      {/* Visual roundtable representation */}
      <div className="bg-slate-950/40 border-b border-cyan-400/10 p-3 grid grid-cols-4 gap-2">
        {AGENT_EXPERTS.map((agent) => (
          <div 
            key={agent.name}
            className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
              activeSpeaker === agent.name 
                ? 'scale-105 border-cyan-400 bg-cyan-500/10 shadow-[0_0_12px_rgba(34,211,238,0.25)]' 
                : 'border-slate-800/80 bg-slate-950/40 opacity-70'
            }`}
          >
            <span className="text-xl mb-1">{agent.avatar}</span>
            <span className="text-[9px] font-black text-slate-100 truncate w-full">{agent.name}</span>
            <span className="text-[7px] text-slate-400 truncate w-full">{agent.role}</span>
            {activeSpeaker === agent.name && <span className="mt-1 flex h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />}
          </div>
        ))}
      </div>

      {/* Dialogue chat thread */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
        {messages.map((message, i) => (
          <div 
            key={i} 
            className={`rounded-xl border p-3 flex gap-3 animate-in slide-in-from-bottom-2 ${message.color}`}
          >
            <div className="text-2xl pt-1">{message.avatar}</div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2 text-[9px] uppercase tracking-wider text-slate-300 font-black">
                <span>{message.agent}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">{message.role}</span>
              </div>
              <p className="text-slate-200 text-xs leading-relaxed">{message.text}</p>
            </div>
          </div>
        ))}
        {activeSpeaker && (
          <div className="flex items-center gap-2 text-xs text-cyan-300 font-mono italic animate-pulse p-2">
            <Bot className="h-4 w-4 animate-spin text-cyan-400" />
            {activeSpeaker} is typing...
          </div>
        )}
      </div>

      {/* Inputs */}
      <div className="border-t border-cyan-400/20 p-3 bg-slate-950/60">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && startLiveDebate()}
            placeholder="Introduce goal to agents (e.g. design netflix clone)..."
            className="flex-1 rounded border border-cyan-300/20 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-cyan-300 placeholder:text-slate-600"
          />
          <button 
            onClick={startLiveDebate}
            className="rounded bg-cyan-400/10 border border-cyan-400/25 p-2 text-cyan-300 hover:bg-cyan-500/20 transition shrink-0"
            title="Send request to team roundtable"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
