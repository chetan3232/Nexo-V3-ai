import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cosineSimilarity, createDeterministicEmbedding } from '@/memory/embedding';
import { MemoryEntry, MemoryLayer, RetrievedMemory } from '@/memory/types';

type MemoryState = {
  entries: MemoryEntry[];
  upsertMemory: (input: Omit<MemoryEntry, 'id' | 'embedding' | 'createdAt' | 'updatedAt'> & { id?: string }) => MemoryEntry;
  retrieveRelevant: (query: string, layers?: MemoryLayer[], limit?: number) => RetrievedMemory[];
  getLayerCount: (layer: MemoryLayer) => number;
};

const seedEntries: MemoryEntry[] = [
  {
    id: 'architecture-phase-order',
    layer: 'project',
    title: 'NEXO phase order',
    content: 'Build order: Foundation, IDE Core, AI Layer, Agent Layer, Runtime, Deploy System.',
    source: 'roadmap',
    tags: ['architecture', 'roadmap'],
    embedding: createDeterministicEmbedding('Foundation IDE Core AI Layer Agent Layer Runtime Deploy System'),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'code-editor-monaco',
    layer: 'code',
    title: 'Monaco editor integration',
    content: 'CodeEditor.tsx owns Monaco theme, split editor, dirty state, save, and inline AI actions.',
    source: 'src/editor/CodeEditor.tsx',
    tags: ['monaco', 'editor'],
    embedding: createDeterministicEmbedding('Monaco split editor dirty save inline AI CodeEditor'),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export const useMemoryStore = create<MemoryState>()(
  persist(
    (set, get) => ({
      entries: seedEntries,
      upsertMemory: (input) => {
        const now = Date.now();
        const id = input.id ?? `${input.layer}-${now}`;
        const nextEntry: MemoryEntry = {
          ...input,
          id,
          embedding: createDeterministicEmbedding(`${input.title}\n${input.content}\n${input.tags.join(' ')}`),
          createdAt: get().entries.find((entry) => entry.id === id)?.createdAt ?? now,
          updatedAt: now,
        };

        set((state) => ({
          entries: [...state.entries.filter((entry) => entry.id !== id), nextEntry],
        }));

        return nextEntry;
      },
      retrieveRelevant: (query, layers, limit = 6) => {
        const queryEmbedding = createDeterministicEmbedding(query);
        return get()
          .entries.filter((entry) => !layers || layers.includes(entry.layer))
          .map((entry) => ({ ...entry, score: cosineSimilarity(queryEmbedding, entry.embedding) }))
          .sort((a, b) => b.score - a.score)
          .slice(0, limit);
      },
      getLayerCount: (layer) => get().entries.filter((entry) => entry.layer === layer).length,
    }),
    {
      name: 'nexo-memory-v3',
      partialize: (state) => ({ entries: state.entries }),
    }
  )
);
