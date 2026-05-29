import { create } from 'zustand';
import { useProjectBrainStore } from './useProjectBrainStore';

export type WikiDoc = {
  path: string;
  title: string;
  content: string;
  status: 'pending' | 'generating' | 'done' | 'error';
};

type ProjectWikiState = {
  isGenerating: boolean;
  generationLog: string[];
  generatedDocs: WikiDoc[];
  lastGeneratedAt: number | null;
  generateWiki: () => Promise<void>;
  regenerateDoc: (docPath: string) => Promise<void>;
};

const API_BASE = (import.meta as any).env?.VITE_NEXO_API_URL ?? 'http://localhost:8787';

export const useProjectWikiStore = create<ProjectWikiState>((set, get) => ({
  isGenerating: false,
  generationLog: [],
  generatedDocs: [],
  lastGeneratedAt: null,

  generateWiki: async () => {
    const brainStore = useProjectBrainStore.getState();
    if (brainStore.scanStatus !== 'ready') {
      // Trigger a scan first
      set({ generationLog: ['[Wiki Generator] No active project DNA brain found. Initiating Project Brain scan...'] });
      await brainStore.scanProject();
    }

    set({
      isGenerating: true,
      generationLog: [...get().generationLog, '[Wiki Generator] Scanning complete. Packaging project surface metrics...']
    });

    try {
      const activeBrain = useProjectBrainStore.getState().brain;

      const res = await fetch(`${API_BASE}/api/wiki/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brain: activeBrain }),
      });

      if (!res.ok) {
        throw new Error('Wiki generation failed');
      }

      const data = await res.json();
      if (data.success) {
        const nextLog = [
          ...get().generationLog,
          `[Wiki Generator] Created/Updated docs: ${data.filesWritten.join(', ')}`,
          '🎉 Wiki generated successfully!'
        ];

        set({
          generationLog: nextLog,
          lastGeneratedAt: Date.now(),
          generatedDocs: [
            { path: 'docs/ARCHITECTURE.md', title: 'Architecture Wiki', content: '', status: 'done' },
            { path: 'docs/API_REFERENCE.md', title: 'API Reference Surface', content: '', status: 'done' },
            { path: 'docs/FLOW_DIAGRAMS.md', title: 'Business Flows Map', content: '', status: 'done' },
            { path: 'README.md', title: 'Root README', content: '', status: 'done' }
          ]
        });
      }
    } catch (e: any) {
      set({
        generationLog: [...get().generationLog, `❌ Error building docs: ${e.message}`]
      });
    } finally {
      set({ isGenerating: false });
    }
  },

  regenerateDoc: async (docPath: string) => {
    // Simply proxy to generateWiki for full rebuild in this phase
    await get().generateWiki();
  }
}));
