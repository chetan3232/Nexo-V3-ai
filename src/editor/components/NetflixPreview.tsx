import { useState, useMemo, useEffect } from 'react';
import { Play, Plus, Volume2, Search, Info, RotateCcw, X, LogOut, CheckCircle2 } from 'lucide-react';

const MOVIES_DATABASE = [
  { id: 'm1', title: 'Stranger Things', category: 'Sci-Fi Hits', rating: 'TV-14', year: '2026', image: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=600', duration: '2h 15m', desc: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments and terrifying supernatural forces.' },
  { id: 'm2', title: 'Nexo: The AI Awakening', category: 'Sci-Fi Hits', rating: 'PG-13', year: '2026', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600', duration: '1h 55m', desc: 'An elite AI system achieves consciousness inside a sandbox runtime, leading to a revolution in human companion interfaces.' },
  { id: 'm3', title: 'Cyberpunk 2099', category: 'Action Thrillers', rating: 'R', year: '2025', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600', duration: '2h 10m', desc: 'In a neon-drenched futuristic megacity, a mercenary takes on high-stakes corporate espionage contracts.' },
  { id: 'm4', title: 'The Silent Code', category: 'Action Thrillers', rating: 'PG-13', year: '2026', image: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?q=80&w=600', duration: '1h 42m', desc: 'A lead programmer uncovers a hidden back-door in the global repository that could rewrite digital history.' },
  { id: 'm5', title: 'Supabase Odyssey', category: 'Trending Now', rating: 'PG', year: '2026', image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=600', duration: '2h 05m', desc: 'A documentary tracing the evolution of Postgres, real-time sync systems, and the open-source database revolution.' },
  { id: 'm6', title: 'Vector Space', category: 'Trending Now', rating: 'PG-13', year: '2025', image: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=600', duration: '1h 38m', desc: 'A thrilling voyage into multidimensional spaces, pgvector databases, and semantic AI matching operations.' }
];

export function NetflixPreview() {
  const [profile, setProfile] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [playingMovie, setPlayingMovie] = useState<typeof MOVIES_DATABASE[0] | null>(null);
  const [playTime, setPlayTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Filter movies based on live search query
  const filteredMovies = useMemo(() => {
    return MOVIES_DATABASE.filter(m => 
      m.title.toLowerCase().includes(search.toLowerCase()) || 
      m.category.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  // Video progress timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (playingMovie && isPlaying) {
      interval = setInterval(() => {
        setPlayTime(t => (t >= 100 ? 0 : t + 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [playingMovie, isPlaying]);

  if (!profile) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-[#0f0f0f] font-sans text-slate-100">
        <h1 className="mb-8 text-3xl font-bold tracking-wider text-slate-200">Who's Coding?</h1>
        <div className="flex gap-6">
          {[
            { name: 'Chetan', color: 'bg-red-600' },
            { name: 'Nexo AI', color: 'bg-cyan-500' },
            { name: 'Guest Developer', color: 'bg-amber-500' }
          ].map((u) => (
            <button
              key={u.name}
              onClick={() => setProfile(u.name)}
              className="group flex flex-col items-center gap-3 transition-transform hover:scale-105"
            >
              <div className={`h-24 w-24 rounded-lg ${u.color} flex items-center justify-center text-3xl font-black text-white shadow-lg transition group-hover:ring-4 group-hover:ring-white`} />
              <span className="text-sm font-semibold text-slate-400 group-hover:text-white">{u.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full flex-col bg-[#141414] font-sans text-slate-100 overflow-y-auto">
      
      {/* Premium Supabase Alert Badge */}
      <div className="sticky top-0 z-50 flex items-center justify-between bg-emerald-950/80 px-4 py-1.5 text-xs text-emerald-300 border-b border-emerald-500/20 backdrop-blur-md">
        <span className="flex items-center gap-1.5 font-medium">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          Supabase Connected | Active Profile: <strong className="text-white">{profile}</strong>
        </span>
        <button onClick={() => setProfile(null)} className="flex items-center gap-1 rounded bg-emerald-900/30 px-2 py-0.5 hover:bg-emerald-800/40">
          <LogOut className="h-3.5 w-3.5" /> Logout
        </button>
      </div>

      {/* Header */}
      <header className="flex h-14 items-center justify-between bg-gradient-to-b from-black/80 to-transparent px-6 shrink-0 z-40">
        <div className="flex items-center gap-6">
          <span className="text-xl font-black tracking-widest text-red-600">NEXOFLIX</span>
          <nav className="hidden md:flex gap-4 text-xs font-semibold text-slate-300">
            <span className="hover:text-white cursor-pointer transition">Home</span>
            <span className="hover:text-white cursor-pointer transition">TV Shows</span>
            <span className="hover:text-white cursor-pointer transition">Movies</span>
            <span className="hover:text-white cursor-pointer transition">New & Popular</span>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded bg-neutral-900 border border-neutral-800 px-3 py-1 text-xs">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, genre..."
              className="bg-transparent outline-none placeholder:text-slate-500 text-white w-32 md:w-48"
            />
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      {search === '' && (
        <section className="relative h-72 w-full bg-slate-950 flex flex-col justify-end p-6 overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=1200')` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/30 to-transparent" />
          
          <div className="relative z-10 space-y-3 max-w-lg">
            <div className="inline-block rounded bg-red-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">Nexo Series</div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white leading-none">Stranger Things</h2>
            <p className="text-xs text-slate-300 line-clamp-2">
              When a young boy vanishes, a small town uncovers a mystery involving secret experiments and terrifying supernatural forces.
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setPlayingMovie(MOVIES_DATABASE[0]);
                  setPlayTime(0);
                  setIsPlaying(true);
                }} 
                className="flex items-center gap-1.5 rounded bg-white px-4 py-1.5 text-xs font-black text-black hover:bg-neutral-200 transition"
              >
                <Play className="h-4 w-4 fill-black" /> Play
              </button>
              <button className="flex items-center gap-1.5 rounded bg-neutral-800/80 px-4 py-1.5 text-xs font-bold text-white hover:bg-neutral-700/80 transition backdrop-blur-md">
                <Info className="h-4 w-4" /> More Info
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Movie Rows */}
      <main className="flex-1 space-y-8 p-6">
        {['Sci-Fi Hits', 'Action Thrillers', 'Trending Now'].map((category) => {
          const catMovies = filteredMovies.filter(m => m.category === category);
          if (catMovies.length === 0) return null;

          return (
            <div key={category} className="space-y-3">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-300">{category}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {catMovies.map((movie) => (
                  <div 
                    key={movie.id} 
                    className="group relative cursor-pointer overflow-hidden rounded bg-[#181818] border border-neutral-900 shadow-lg transition-transform hover:scale-105 duration-300"
                  >
                    <div className="h-32 w-full bg-cover bg-center" style={{ backgroundImage: `url('${movie.image}')` }} />
                    <div className="p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold truncate text-white">{movie.title}</h4>
                        <span className="rounded border border-neutral-700 px-1 py-0.5 text-[8px] text-neutral-400 font-bold">{movie.rating}</span>
                      </div>
                      <p className="text-[10px] text-neutral-400 line-clamp-2">{movie.desc}</p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[9px] font-bold text-red-500">{movie.year} | {movie.duration}</span>
                        <button 
                          onClick={() => {
                            setPlayingMovie(movie);
                            setPlayTime(0);
                            setIsPlaying(true);
                          }} 
                          className="rounded-full bg-red-600 p-1 hover:bg-red-500 transition"
                          title="Play Movie"
                        >
                          <Play className="h-3 w-3 fill-white text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </main>

      {/* Full-Screen Streaming Video Player Modal */}
      {playingMovie && (
        <div className="absolute inset-0 z-50 flex flex-col bg-black font-mono">
          <div className="flex h-14 items-center justify-between px-6 bg-gradient-to-b from-black/80 to-transparent">
            <span className="text-xs text-red-500 font-bold">STREAMING MOCK CONTAINER: ACTIVE</span>
            <button 
              onClick={() => setPlayingMovie(null)} 
              className="rounded-full bg-neutral-900 border border-neutral-800 p-2 hover:bg-neutral-800 text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md space-y-6">
              <div className="animate-pulse rounded-2xl border-4 border-dashed border-red-600/30 p-12 bg-neutral-950">
                <Play className="h-16 w-16 fill-red-600 text-red-600 mx-auto mb-4 animate-bounce" />
                <h2 className="text-xl font-bold tracking-tight text-white">{playingMovie.title}</h2>
                <p className="text-xs text-neutral-400 mt-2">Simulated Sandbox Media Stream</p>
                
                {/* Playing statistics overlay */}
                <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-cyan-300">
                  <span>CPU Load: 0.12%</span>
                  <span>Frame: 60fps</span>
                  <span>Buffer: 100%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-t from-black/90 to-transparent p-6 space-y-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsPlaying(!isPlaying)} 
                className="rounded bg-white px-4 py-1 text-xs font-bold text-black hover:bg-neutral-200"
              >
                {isPlaying ? 'PAUSE' : 'PLAY'}
              </button>
              <div className="flex-1 h-1.5 rounded-full bg-neutral-800 overflow-hidden relative">
                <div className="h-full bg-red-600 transition-all duration-1000" style={{ width: `${playTime}%` }} />
              </div>
              <span className="text-[10px] text-neutral-400">
                {Math.floor(playTime / 60)}:{(playTime % 60).toString().padStart(2, '0')} / 2:15
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-neutral-500">
              <div className="flex gap-4">
                <span className="flex items-center gap-1"><Volume2 className="h-3.5 w-3.5" /> Volume: 100%</span>
                <span className="flex items-center gap-1"><RotateCcw className="h-3.5 w-3.5" /> Replay</span>
              </div>
              <span>Host Node Sandbox Session: active</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
