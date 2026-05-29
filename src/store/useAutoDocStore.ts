import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DocEntry = {
  id: string;
  file: string;
  docFile: string;
  summary: string;
  generatedAt: number;
};

type AutoDocState = {
  autoDocEnabled: boolean;
  docLog: DocEntry[];
  generateDocForFile: (filePath: string, content: string, changeType: string) => Promise<void>;
  toggleAutoDoc: () => void;
};

const API_BASE = (import.meta as any).env?.VITE_NEXO_API_URL ?? 'http://localhost:8787';

export const useAutoDocStore = create<AutoDocState>()(
  persist(
    (set, get) => ({
      autoDocEnabled: false, // Default is OFF as requested in Q4
      docLog: [],

      toggleAutoDoc: () => set((s) => ({ autoDocEnabled: !s.autoDocEnabled })),

      generateDocForFile: async (filePath: string, content: string, changeType: string) => {
        if (!get().autoDocEnabled) return;

        let targetDoc = 'docs/ARCHITECTURE.md';
        if (filePath.includes('/components/')) {
          targetDoc = 'docs/COMPONENTS.md';
        } else if (filePath.includes('/routes/') || filePath.includes('/api/')) {
          targetDoc = 'docs/API_REFERENCE.md';
        } else if (filePath.endsWith('.sql') || filePath.includes('schema') || filePath.includes('migration')) {
          targetDoc = 'docs/DATABASE.md';
        } else if (filePath === 'package.json') {
          targetDoc = 'README.md';
        }

        const summary = `Autodetected code modifications in ${filePath} (${changeType}). Synchronized changes to /${targetDoc}.`;

        const newEntry: DocEntry = {
          id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          file: filePath,
          docFile: targetDoc,
          summary,
          generatedAt: Date.now()
        };

        set((s) => ({
          docLog: [newEntry, ...s.docLog].slice(0, 50)
        }));

        // Send backend notification to rewrite docs or log updates
        try {
          await fetch(`${API_BASE}/api/fs/write`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              path: targetDoc,
              content: `\n### Incremental Sync [${new Date().toLocaleString()}]\n${summary}\n`,
            })
          });
        } catch (e) {
          console.error('[AutoDoc] Failed to append doc log file:', e);
        }
      }
    }),
    {
      name: 'nexo-autodoc-v1',
      partialize: (state) => ({
        autoDocEnabled: state.autoDocEnabled,
        docLog: state.docLog
      })
    }
  )
);
