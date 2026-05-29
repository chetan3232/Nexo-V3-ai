import { create } from 'zustand';

export type ImpactReport = {
  id: string;
  targetFile: string;
  changeDescription: string;
  affectedFiles: {
    path: string;
    reason: string;
    risk: 'low' | 'medium' | 'high';
  }[];
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  breakageScenarios: string[];
  safeRefactorSteps: string[];
  timestamp: number;
};

type ImpactState = {
  isAnalyzing: boolean;
  report: ImpactReport | null;
  analyzeImpact: (targetFile: string, changeDesc: string) => Promise<void>;
  clearReport: () => void;
};

const API_BASE = (import.meta as any).env?.VITE_NEXO_API_URL ?? 'http://localhost:8787';

export const useImpactStore = create<ImpactState>((set) => ({
  isAnalyzing: false,
  report: null,

  clearReport: () => set({ report: null, isAnalyzing: false }),

  analyzeImpact: async (targetFile: string, changeDesc: string) => {
    set({ isAnalyzing: true, report: null });
    try {
      const res = await fetch(`${API_BASE}/api/impact/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetFile, changeDescription: changeDesc }),
      });

      if (!res.ok) {
        throw new Error('Analysis failed');
      }

      const data = await res.json();
      if (data.success && data.report) {
        set({ report: data.report });
      }
    } catch (err) {
      console.error('[Impact Store] Error analyzing:', err);
    } finally {
      set({ isAnalyzing: false });
    }
  },
}));
