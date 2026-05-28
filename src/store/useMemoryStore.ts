import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cosineSimilarity, createDeterministicEmbedding } from '@/memory/embedding';
import { MemoryEntry, MemoryLayer, RetrievedMemory } from '@/memory/types';
import { searchBackendMemory, upsertBackendMemory } from '@/services/memoryClient';

type MemoryState = {
  entries: MemoryEntry[];
  upsertMemory: (input: Omit<MemoryEntry, 'id' | 'embedding' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<MemoryEntry>;
  retrieveRelevant: (query: string, layers?: MemoryLayer[], limit?: number) => RetrievedMemory[];
  searchMemory: (query: string, layers?: MemoryLayer[], limit?: number) => Promise<RetrievedMemory[]>;
  getLayerCount: (layer: MemoryLayer) => number;
  syncFromBackend: () => Promise<void>;
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

      syncFromBackend: async () => {
        try {
          // Retrieve top 100 memories from database to sync frontend cache
          const res = await searchBackendMemory('', undefined, 100);
          if (res.results && res.results.length > 0) {
            // Map backend fields (created_at/updated_at can be strings) to numerical timestamps
            const mapped = res.results.map((entry: any) => ({
              ...entry,
              createdAt: entry.createdAt || (entry.created_at ? new Date(entry.created_at).getTime() : Date.now()),
              updatedAt: entry.updatedAt || (entry.updated_at ? new Date(entry.updated_at).getTime() : Date.now()),
              tags: entry.tags || [],
              embedding: entry.embedding || createDeterministicEmbedding(`${entry.title}\n${entry.content}`),
            }));
            set({ entries: mapped });
          }
        } catch (e) {
          console.error('[Memory Store] syncFromBackend failed:', e);
        }
      },

      upsertMemory: async (input) => {
        const now = Date.now();
        const id = input.id ?? `${input.layer}-${now}`;

        // 1. Local optimistic update
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

        // 2. Sync to backend database (Supabase pgvector / ChromaDB / Local JSON file)
        try {
          const res = await upsertBackendMemory({
            layer: input.layer,
            title: input.title,
            content: input.content,
            source: input.source,
            tags: input.tags,
          });

          if (res.entry) {
            const syncedEntry: MemoryEntry = {
              ...res.entry,
              createdAt: res.entry.createdAt || (res.entry.created_at ? new Date(res.entry.created_at).getTime() : now),
              updatedAt: res.entry.updatedAt || (res.entry.updated_at ? new Date(res.entry.updated_at).getTime() : now),
              tags: res.entry.tags || [],
              embedding: res.entry.embedding || nextEntry.embedding,
            };
            set((state) => ({
              entries: [...state.entries.filter((entry) => entry.id !== syncedEntry.id), syncedEntry],
            }));
            return syncedEntry;
          }
        } catch (e) {
          console.error('[Memory Store] Backend sync upsert failed, using offline fallback:', e);
        }

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

      searchMemory: async (query, layers, limit = 6) => {
        try {
          const res = await searchBackendMemory(query, layers, limit);
          if (res.results && res.results.length > 0) {
            return res.results.map((entry: any) => ({
              ...entry,
              score: entry.score ?? 0.8,
              createdAt: entry.createdAt || (entry.created_at ? new Date(entry.created_at).getTime() : Date.now()),
              updatedAt: entry.updatedAt || (entry.updated_at ? new Date(entry.updated_at).getTime() : Date.now()),
              tags: entry.tags || [],
              embedding: entry.embedding || createDeterministicEmbedding(`${entry.title}\n${entry.content}`),
            }));
          }
        } catch (e) {
          console.error('[Memory Store] Backend search failed, falling back to local cosine match:', e);
        }
        return get().retrieveRelevant(query, layers, limit);
      },

      getLayerCount: (layer) => get().entries.filter((entry) => entry.layer === layer).length,
    }),
    {
      name: 'nexo-memory-v3',
      partialize: (state) => ({ entries: state.entries }),
    }
  )
);
