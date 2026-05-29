import { create } from 'zustand';

export type SimulationData = {
  labels: string[];
  activeSockets: number[];
  cpuLoad: number[];
  dbQueries: number[];
  latency: number[];
};

export type SimReport = {
  type: 'warning' | 'critical' | 'info';
  title: string;
  description: string;
};

type FutureSimState = {
  horizon: number; // months
  pathType: 'mvp' | 'scalable' | 'enterprise';
  data: SimulationData | null;
  reports: SimReport[];
  isSimulating: boolean;
  setHorizon: (months: number) => void;
  setPathType: (path: FutureSimState['pathType']) => void;
  simulateGrowth: () => Promise<void>;
};

const API_BASE = (import.meta as any).env?.VITE_NEXO_API_URL ?? 'http://localhost:8787';

export const useFutureSimStore = create<FutureSimState>((set, get) => ({
  horizon: 6,
  pathType: 'scalable',
  data: null,
  reports: [],
  isSimulating: false,

  setHorizon: (horizon) => set({ horizon }),
  setPathType: (pathType) => set({ pathType }),

  simulateGrowth: async () => {
    set({ isSimulating: true });
    try {
      const res = await fetch(`${API_BASE}/api/predict/simulation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          horizon: get().horizon,
          pathType: get().pathType
        })
      });

      if (!res.ok) throw new Error('Simulation failed');

      const result = await res.json();
      if (result.success) {
        set({
          data: result.data,
          reports: result.reports || []
        });
      }
    } catch (e) {
      console.error('[FutureSim Store] Error simulating:', e);
    } finally {
      set({ isSimulating: false });
    }
  }
}));
