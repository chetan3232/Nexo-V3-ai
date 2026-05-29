import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type HealthCategory = {
  name: 'security' | 'performance' | 'maintainability' | 'testing' | 'documentation';
  score: number;
  weight: number;
  icon: string;
  details: string[];
  trend: 'up' | 'down' | 'stable';
};

export type HealthSuggestion = {
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  action: string;
  autoFixable: boolean;
};

type HealthState = {
  healthScore: number;
  categories: HealthCategory[];
  suggestions: HealthSuggestion[];
  isCalculating: boolean;
  lastCalculatedAt: number | null;
  scoreHistory: { score: number; timestamp: number }[];
  calculateHealth: () => Promise<void>;
  autoRefresh: boolean;
  toggleAutoRefresh: () => void;
};

const API_BASE = (import.meta as any).env?.VITE_NEXO_API_URL ?? 'http://localhost:8787';

export const useHealthStore = create<HealthState>()(
  persist(
    (set, get) => ({
      healthScore: 100,
      categories: [],
      suggestions: [],
      isCalculating: false,
      lastCalculatedAt: null,
      scoreHistory: [],
      autoRefresh: false,

      toggleAutoRefresh: () => set((s) => ({ autoRefresh: !s.autoRefresh })),

      calculateHealth: async () => {
        set({ isCalculating: true });
        try {
          const res = await fetch(`${API_BASE}/api/health/calculate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });

          if (!res.ok) {
            throw new Error('Health check calculation failed');
          }

          const data = await res.json();
          if (data.success) {
            const nextHistory = [
              ...get().scoreHistory,
              { score: data.healthScore, timestamp: Date.now() }
            ].slice(-10); // keep last 10 audits

            set({
              healthScore: data.healthScore,
              categories: data.categories || [],
              suggestions: data.suggestions || [],
              lastCalculatedAt: data.lastCalculatedAt,
              scoreHistory: nextHistory
            });
          }
        } catch (e) {
          console.error('[Health Store] Calculate error:', e);
        } finally {
          set({ isCalculating: false });
        }
      },
    }),
    {
      name: 'nexo-project-health-v1',
      partialize: (state) => ({
        healthScore: state.healthScore,
        categories: state.categories,
        suggestions: state.suggestions,
        scoreHistory: state.scoreHistory,
        lastCalculatedAt: state.lastCalculatedAt,
      }),
    }
  )
);
