import { create } from 'zustand';

export type PredictedIssue = {
  id: string;
  category: 'memory' | 'timeout' | 'bundle';
  file: string;
  title: string;
  description: string;
  severity: 'medium' | 'high';
};

type FailurePredictionState = {
  memoryLeakRisk: number;
  timeoutRisk: number;
  bundleBloatRisk: number;
  issues: PredictedIssue[];
  isPredicting: boolean;
  predictFailures: () => Promise<void>;
};

const API_BASE = (import.meta as any).env?.VITE_NEXO_API_URL ?? 'http://localhost:8787';

export const useFailurePredictionStore = create<FailurePredictionState>((set) => ({
  memoryLeakRisk: 0,
  timeoutRisk: 0,
  bundleBloatRisk: 0,
  issues: [],
  isPredicting: false,

  predictFailures: async () => {
    set({ isPredicting: true });
    try {
      const res = await fetch(`${API_BASE}/api/predict/failures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) throw new Error('Prediction query failed');

      const result = await res.json();
      if (result.success) {
        set({
          memoryLeakRisk: result.scores.memoryLeakRisk,
          timeoutRisk: result.scores.timeoutRisk,
          bundleBloatRisk: result.scores.bundleBloatRisk,
          issues: result.issues || []
        });
      }
    } catch (e) {
      console.error('[Failure Prediction Store] Error:', e);
    } finally {
      set({ isPredicting: false });
    }
  }
}));
