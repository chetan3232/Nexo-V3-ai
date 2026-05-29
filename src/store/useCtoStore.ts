import { create } from 'zustand';
import { streamAIResponse } from '@/services/aiStreamClient';
import { useProjectBrainStore } from '@/store/useProjectBrainStore';

// ── Types ──────────────────────────────────────────────────────────────────
export type CtoFindingCategory =
  | 'missing_feature'
  | 'security'
  | 'performance'
  | 'architecture'
  | 'tech_debt'
  | 'accessibility';

export type CtoSeverity = 'critical' | 'warning' | 'info';

export type CtoFinding = {
  category: CtoFindingCategory;
  severity: CtoSeverity;
  title: string;
  description: string;
  suggestion: string;
  autoFixable: boolean;
};

export type CtoReport = {
  id: string;
  timestamp: number;
  goal: string;
  findings: CtoFinding[];
  overallScore: number; // 0-100
  recommendation: string;
  dismissed: boolean;
};

// ── Store ──────────────────────────────────────────────────────────────────
type CtoState = {
  ctoEnabled: boolean;
  isAnalyzing: boolean;
  lastReport: CtoReport | null;
  reports: CtoReport[];

  toggleCto: () => void;
  runCtoAnalysis: (goal: string, generatedCode: string, filePath: string) => Promise<CtoReport | null>;
  dismissReport: (id: string) => void;
  clearReports: () => void;
};

export const useCtoStore = create<CtoState>((set, get) => ({
  ctoEnabled: true,
  isAnalyzing: false,
  lastReport: null,
  reports: [],

  toggleCto: () => set((s) => ({ ctoEnabled: !s.ctoEnabled })),

  clearReports: () => set({ reports: [], lastReport: null }),

  dismissReport: (id) => {
    set((s) => ({
      reports: s.reports.map(r => r.id === id ? { ...r, dismissed: true } : r),
      lastReport: s.lastReport?.id === id ? { ...s.lastReport, dismissed: true } : s.lastReport,
    }));
  },

  runCtoAnalysis: async (goal, generatedCode, filePath) => {
    if (!get().ctoEnabled) return null;

    set({ isAnalyzing: true });

    try {
      const brainContext = useProjectBrainStore.getState().getBrainContext();

      const ctoPrompt = `You are the NEXO CTO Agent — a senior technical lead who reviews code with a strategic mindset.

A developer just asked: "${goal}"
Code was generated for file: "${filePath}"

Project context:
${brainContext || 'No brain scan available.'}

Generated code (first 3000 chars):
\`\`\`
${generatedCode.slice(0, 3000)}
\`\`\`

Analyze this from a CTO perspective. Find what's MISSING that the developer didn't ask for but SHOULD have.

Output ONLY a raw JSON object (no markdown code blocks) with this exact structure:
{
  "overallScore": <number 0-100>,
  "recommendation": "<one-line strategic recommendation>",
  "findings": [
    {
      "category": "<missing_feature|security|performance|architecture|tech_debt|accessibility>",
      "severity": "<critical|warning|info>",
      "title": "<short title>",
      "description": "<what's missing or wrong>",
      "suggestion": "<what to do about it>",
      "autoFixable": <true|false>
    }
  ]
}

Be specific and actionable. Find 3-7 real findings. Focus on things that would bite the developer later.`;

      let responseText = '';
      await streamAIResponse(
        [{ role: 'user', content: ctoPrompt }],
        'nexo-auto-router',
        {
          onToken: (tok) => { responseText += tok; },
          onDone: () => {},
          onError: () => {},
        },
        { temperature: 0.3, maxTokens: 1500 }
      );

      // Parse the JSON response
      let cleaned = responseText.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '').trim();
      }

      let parsed: any;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        // Try to extract JSON from response
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Failed to parse CTO response as JSON');
        }
      }

      const report: CtoReport = {
        id: `cto-${Date.now()}`,
        timestamp: Date.now(),
        goal,
        findings: (parsed.findings || []).map((f: any) => ({
          category: f.category || 'architecture',
          severity: f.severity || 'info',
          title: f.title || 'Unnamed Finding',
          description: f.description || '',
          suggestion: f.suggestion || '',
          autoFixable: f.autoFixable ?? false,
        })),
        overallScore: parsed.overallScore ?? 50,
        recommendation: parsed.recommendation || 'No recommendation available.',
        dismissed: false,
      };

      set((s) => ({
        lastReport: report,
        reports: [report, ...s.reports].slice(0, 20), // keep last 20 reports
        isAnalyzing: false,
      }));

      return report;
    } catch (err: any) {
      console.error('[CTO Engine] Analysis failed:', err);
      set({ isAnalyzing: false });
      return null;
    }
  },
}));
