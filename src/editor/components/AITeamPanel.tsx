import { useState } from 'react';
import { Send, Users, Sparkles, MessageCircle, Bot } from 'lucide-react';
import { useTeamRoomStore, TEAM_AGENT_CONFIGS, TeamAgent } from '@/store/useTeamRoomStore';

const AGENT_EXPERTS = [
  { id: 'frontend', name: 'Frontend Architect', role: 'React/UX Specialist', avatar: '🎨', color: 'text-rose-300 border-rose-400/40 bg-rose-950/20' },
  { id: 'backend', name: 'Backend Systems Engineer', role: 'API Architect', avatar: '⚙️', color: 'text-purple-300 border-purple-400/40 bg-purple-950/20' },
  { id: 'security', name: 'Security Officer', role: 'Security Auditor', avatar: '🛡️', color: 'text-yellow-300 border-yellow-400/40 bg-yellow-950/20' },
  { id: 'ui', name: 'UI/UX Specialist', role: 'Design Expert', avatar: '🖌️', color: 'text-emerald-300 border-emerald-400/40 bg-emerald-950/20' },
  { id: 'cto', name: 'CTO Decision Maker', role: 'Project CTO', avatar: '🧠', color: 'text-cyan-300 border-cyan-400/40 bg-cyan-950/20' }
];

export function AITeamPanel() {
  const { messages, isDiscussing, startDiscussion } = useTeamRoomStore();
  const [input, setInput] = useState('how should we design the database and login page logic for the netflix clone?');

  const startLiveDebate = () => {
    if (!input.trim() || isDiscussing) return;
    void startDiscussion(input);
    setInput('');
  };

  const activeSpeakerMsg = messages.find(m => m.isStreaming);
  const activeSpeaker = activeSpeakerMsg ? activeSpeakerMsg.agent : null;

  const getAgentColor = (agent: string) => {
    const found = AGENT_EXPERTS.find(x => x.id === agent);
    return found?.color ?? 'text-slate-300 border-slate-800/80 bg-slate-950/40';
  };

  return (
    <section className="flex h-full flex-col bg-slate-950/85 backdrop-blur-xl" style={{ height: '100%' }}>
      <div className="flex items-center justify-between border-b border-cyan-400/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300">
        <span className="flex items-center gap-2"><Users className="h-4 w-4 text-cyan-300" /> AI Team Roundtable</span>
        <span className="text-[10px] text-slate-500 font-bold uppercase">5 Specialists Active</span>
      </div>

      {/* Visual roundtable representation */}
      <div className="bg-slate-950/40 border-b border-cyan-400/10 p-3 grid grid-cols-5 gap-2">
        {AGENT_EXPERTS.map((agent) => (
          <div 
            key={agent.id}
            className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
              activeSpeaker === agent.id 
                ? 'scale-105 border-cyan-400 bg-cyan-500/10 shadow-[0_0_12px_rgba(34,211,238,0.25)]' 
                : 'border-slate-800/80 bg-slate-950/40 opacity-70'
            }`}
          >
            <span className="text-xl mb-1">{agent.avatar}</span>
            <span className="text-[9px] font-black text-slate-100 truncate w-full">{agent.name.split(' ')[0]}</span>
            <span className="text-[7px] text-slate-400 truncate w-full">{agent.role}</span>
            {activeSpeaker === agent.id && <span className="mt-1 flex h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />}
          </div>
        ))}
      </div>

      {/* Dialogue chat thread */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm" style={{ overflowY: 'auto' }}>
        {messages.length === 0 && !isDiscussing && (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 gap-2 p-6">
            <Users size={32} className="text-slate-600" />
            <div className="text-xs font-semibold text-slate-400">Roundtable Debate Ready</div>
            <div className="text-[10px] max-w-[240px] leading-relaxed">
              Introduce a feature proposal below to trigger sequential analysis from all five agent personas.
            </div>
          </div>
        )}

        {messages.map((message, i) => {
          const config = TEAM_AGENT_CONFIGS[message.agent];
          const colorClass = getAgentColor(message.agent);

          return (
            <div 
              key={message.id || i} 
              className={`rounded-xl border p-3 flex gap-3 animate-in slide-in-from-bottom-2 ${colorClass}`}
            >
              <div className="text-2xl pt-1">{message.avatar}</div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2 text-[9px] uppercase tracking-wider text-slate-300 font-black">
                  <span>{config?.name || message.name}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">{message.agent.toUpperCase()}</span>
                </div>
                <p className="text-slate-200 text-xs leading-relaxed whitespace-pre-wrap">{message.content || 'Generating thoughts...'}</p>
              </div>
            </div>
          );
        })}

        {activeSpeaker && (
          <div className="flex items-center gap-2 text-xs text-cyan-300 font-mono italic animate-pulse p-2">
            <Bot className="h-4 w-4 animate-spin text-cyan-400" />
            {TEAM_AGENT_CONFIGS[activeSpeaker]?.name || activeSpeaker} is drafting feedback...
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
            disabled={isDiscussing}
          />
          <button 
            onClick={startLiveDebate}
            className="rounded bg-cyan-400/10 border border-cyan-400/25 p-2 text-cyan-300 hover:bg-cyan-500/20 transition shrink-0"
            title="Send request to team roundtable"
            disabled={isDiscussing || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
export default AITeamPanel;
