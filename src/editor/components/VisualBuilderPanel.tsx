import { useState, useRef } from 'react';
import { Sparkles, Mic, Play, RefreshCw, WandSparkles, CheckCircle2, SplitSquareHorizontal } from 'lucide-react';

type Props = {
  onToggleSplit: () => void;
  isSplitActive: boolean;
};

export function VisualBuilderPanel({ onToggleSplit, isSplitActive }: Props) {
  const [prompt, setPrompt] = useState('make netflix clone with active profile switcher and full video player');
  const [isListening, setIsListening] = useState(false);
  const [buildLogs, setBuildLogs] = useState<string[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildStep, setBuildStep] = useState(0);

  const recognitionRef = useRef<any>(null);

  // Web Speech API Voice Coding Integration
  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Web Speech Recognition API is not supported in this browser.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setIsListening(true);
    };

    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setPrompt(prev => prev ? `${prev} ${transcript}` : transcript);
    };

    rec.onerror = () => {
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;
    rec.start();
  };

  const handleBuild = () => {
    if (!prompt.trim() || isBuilding) return;

    setIsBuilding(true);
    setBuildStep(1);
    setBuildLogs(['[builder] Analyzing visual prompt...']);

    setTimeout(() => {
      setBuildStep(2);
      setBuildLogs(prev => [...prev, '[builder] Creating modular React page structures...']);
    }, 1500);

    setTimeout(() => {
      setBuildStep(3);
      setBuildLogs(prev => [...prev, '[builder] Installing styling dependencies: framer-motion, lucide-react...']);
    }, 3000);

    setTimeout(() => {
      setBuildStep(4);
      setBuildLogs(prev => [...prev, '[builder] Spawning isolated Node container inside Docker Sandbox...']);
    }, 4500);

    setTimeout(() => {
      setBuildStep(5);
      setBuildLogs(prev => [...prev, '[builder] Hot-reloaded visual bundle. Click split view to display canvas!']);
      setIsBuilding(false);
      if (!isSplitActive) {
        onToggleSplit();
      }
    }, 6000);
  };

  return (
    <section className="flex h-full flex-col bg-slate-950/85 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-cyan-400/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300">
        <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-cyan-300" /> Visual Builder</span>
        {isBuilding && <RefreshCw className="h-3.5 w-3.5 animate-spin text-cyan-300" />}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm">
        
        {/* Visual prompt textarea */}
        <div className="relative rounded border border-cyan-300/25 bg-slate-900/60 p-2.5">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type code request, e.g. 'make netflix clone'"
            className="w-full bg-transparent text-sm text-slate-100 outline-none resize-none h-24 placeholder:text-slate-600 leading-relaxed pr-10"
          />
          
          {/* Neon Dictation speech trigger mic */}
          <button 
            onClick={startSpeechRecognition}
            className={`absolute bottom-2.5 right-2.5 rounded-full p-2 border transition ${
              isListening 
                ? 'bg-rose-500/20 border-rose-400 text-rose-300 animate-pulse' 
                : 'bg-cyan-500/10 border-cyan-400/25 text-cyan-300 hover:bg-cyan-500/20'
            }`}
            title={isListening ? 'Listening... click to stop' : 'Dictate with Web Speech API'}
          >
            <Mic className="h-4 w-4" />
          </button>
        </div>

        {/* Action Triggers */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleBuild}
            disabled={isBuilding}
            className="flex items-center justify-center gap-2 rounded border border-cyan-300/30 bg-cyan-400/15 py-2.5 text-xs font-bold text-cyan-100 hover:bg-cyan-400/25 disabled:opacity-40 transition"
          >
            <Play className="h-4 w-4 fill-cyan-400" /> Assemble App
          </button>
          
          <button
            onClick={onToggleSplit}
            className={`flex items-center justify-center gap-2 rounded border py-2.5 text-xs font-bold transition ${
              isSplitActive 
                ? 'bg-fuchsia-500/20 border-fuchsia-400 text-fuchsia-300 hover:bg-fuchsia-500/35' 
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700/80'
            }`}
          >
            <SplitSquareHorizontal className="h-4 w-4" /> {isSplitActive ? 'Hide Canvas' : 'Show Canvas'}
          </button>
        </div>

        {/* Build execution checklist logs */}
        {buildStep > 0 && (
          <div className="rounded border border-cyan-400/15 bg-slate-900/40 p-3 space-y-3 font-mono text-[11px] text-slate-300">
            <div className="text-[10px] uppercase tracking-wider text-cyan-300 font-bold border-b border-cyan-400/10 pb-1.5 flex items-center justify-between">
              <span>Execution Pipeline</span>
              <span>{Math.round((buildStep / 5) * 100)}%</span>
            </div>
            
            <div className="space-y-2">
              {[
                'Analyze design layout specification',
                'Create responsive page files',
                'Load styling and lucide libraries',
                'Mount execution environment sandbox',
                'Expose live preview browser canvas'
              ].map((step, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${
                    buildStep > idx + 1 ? 'bg-cyan-400' : buildStep === idx + 1 ? 'bg-cyan-400 animate-ping' : 'bg-slate-700'
                  }`} />
                  <span className={buildStep > idx ? 'text-slate-100' : 'text-slate-500'}>{step}</span>
                  {buildStep > idx && <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 ml-auto" />}
                </div>
              ))}
            </div>

            <div className="border-t border-cyan-400/10 pt-2 space-y-1 text-slate-400">
              {buildLogs.map((log, i) => <p key={i}>{log}</p>)}
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
