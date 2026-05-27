import fs from 'node:fs/promises';
import path from 'node:path';
import { supabase, isMockDb } from './database/db.js';

const VECTOR_SIZE = 64;

export function createEmbedding(input) {
  const vector = Array.from({ length: VECTOR_SIZE }, () => 0);
  const tokens = String(input).toLowerCase().match(/[a-z0-9_./-]+/g) ?? [];

  tokens.forEach((token, tokenIndex) => {
    let hash = 2166136261;
    for (const char of token) {
      hash ^= char.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    const index = Math.abs(hash) % VECTOR_SIZE;
    vector[index] += 1 + Math.min(token.length / 24, 1);
    vector[(index + tokenIndex) % VECTOR_SIZE] += 0.25;
  });

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => Number((value / magnitude).toFixed(6)));
}

function cosineSimilarity(a, b) {
  let dot = 0;
  let aMagnitude = 0;
  let bMagnitude = 0;

  for (let index = 0; index < Math.min(a.length, b.length); index += 1) {
    dot += a[index] * b[index];
    aMagnitude += a[index] * a[index];
    bMagnitude += b[index] * b[index];
  }

  return dot / ((Math.sqrt(aMagnitude) || 1) * (Math.sqrt(bMagnitude) || 1));
}

export class FileMemoryEngine {
  constructor(workspaceRoot) {
    this.memoryPath = path.join(workspaceRoot, '.nexo', 'memory.json');
  }

  async readEntries() {
    try {
      return JSON.parse(await fs.readFile(this.memoryPath, 'utf8'));
    } catch {
      return [];
    }
  }

  async writeEntries(entries) {
    await fs.mkdir(path.dirname(this.memoryPath), { recursive: true });
    await fs.writeFile(this.memoryPath, JSON.stringify(entries, null, 2), 'utf8');
  }

  async upsert(input) {
    const chromaUrl = process.env.CHROMADB_URL || process.env.CHROMA_URL;
    const now = Date.now();
    const id = input.id ?? `${input.layer}-${now}`;

    // ── 1. Optional ChromaDB Router ──────────────────────────────────────────
    if (chromaUrl) {
      try {
        const embedding = createEmbedding(`${input.title}\n${input.content}\n${(input.tags ?? []).join(' ')}`);
        const response = await fetch(`${chromaUrl}/api/v1/collections/nexo_memories/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embeddings: [embedding],
            metadatas: [{
              layer: input.layer,
              title: input.title,
              content: input.content,
              source: input.source || '',
              tags: (input.tags ?? []).join(',')
            }],
            documents: [input.content],
            ids: [id]
          })
        });
        if (response.ok) {
          return { id, ...input, embedding, createdAt: now, updatedAt: now };
        }
      } catch (e) {
        console.error('[ChromaDB Router] Failed to upsert:', e.message);
      }
    }

    // ── 2. Supabase pgvector Router ──────────────────────────────────────────
    if (supabase && !isMockDb) {
      try {
        const embedding = createEmbedding(`${input.title}\n${input.content}\n${(input.tags ?? []).join(' ')}`);
        const upsertData = {
          layer: input.layer,
          title: input.title,
          content: input.content,
          source: input.source,
          tags: input.tags ?? [],
          embedding,
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from('nexo_memory_entries')
          .upsert(upsertData)
          .select()
          .single();

        if (!error && data) {
          return {
            id: data.id,
            layer: data.layer,
            title: data.title,
            content: data.content,
            source: data.source,
            tags: data.tags,
            createdAt: new Date(data.created_at).getTime(),
            updatedAt: new Date(data.updated_at).getTime()
          };
        }
        console.error('[Supabase pgvector Router] upsert error:', error?.message);
      } catch (e) {
        console.error('[Supabase pgvector Router] connection failed:', e.message);
      }
    }

    // ── 3. Fallback Local JSON Cache Router ──────────────────────────────────
    const entries = await this.readEntries();
    const existing = entries.find((entry) => entry.id === id);
    const nextEntry = {
      id,
      layer: input.layer,
      title: input.title,
      content: input.content,
      source: input.source,
      tags: input.tags ?? [],
      embedding: createEmbedding(`${input.title}\n${input.content}\n${(input.tags ?? []).join(' ')}`),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    await this.writeEntries([...entries.filter((entry) => entry.id !== id), nextEntry]);
    return nextEntry;
  }

  async search(query, layers, limit = 6) {
    const chromaUrl = process.env.CHROMADB_URL || process.env.CHROMA_URL;

    // ── 1. Optional ChromaDB Router ──────────────────────────────────────────
    if (chromaUrl) {
      try {
        const queryEmbedding = createEmbedding(query);
        const response = await fetch(`${chromaUrl}/api/v1/collections/nexo_memories/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query_embeddings: [queryEmbedding],
            n_results: limit,
            where: layers?.length ? { layer: { $in: layers } } : undefined
          })
        });
        if (response.ok) {
          const result = await response.json();
          const matches = [];
          const ids = result.ids?.[0] || [];
          const metadatas = result.metadatas?.[0] || [];
          const distances = result.distances?.[0] || [];
          for (let i = 0; i < ids.length; i++) {
            const meta = metadatas[i] || {};
            matches.push({
              id: ids[i],
              layer: meta.layer,
              title: meta.title,
              content: meta.content || '',
              source: meta.source,
              tags: meta.tags ? meta.tags.split(',') : [],
              score: 1 - (distances[i] || 0)
            });
          }
          return matches;
        }
      } catch (e) {
        console.error('[ChromaDB Router] Failed to search:', e.message);
      }
    }

    // ── 2. Supabase pgvector Router ──────────────────────────────────────────
    if (supabase && !isMockDb) {
      try {
        const queryEmbedding = createEmbedding(query);
        const { data, error } = await supabase.rpc('match_nexo_memory', {
          query_embedding: queryEmbedding,
          match_layers: layers || null,
          match_count: limit
        });

        if (!error && data) {
          return data.map((item) => ({
            id: item.id,
            layer: item.layer,
            title: item.title,
            content: item.content,
            source: item.source,
            tags: item.tags,
            score: item.score
          }));
        }
        console.error('[Supabase pgvector Router] RPC execution error:', error?.message);
      } catch (e) {
        console.error('[Supabase pgvector Router] search connection failed:', e.message);
      }
    }

    // ── 3. Fallback Local JSON Hashing Search Router ──────────────────────────
    const queryEmbedding = createEmbedding(query);
    const entries = await this.readEntries();

    return entries
      .filter((entry) => !layers?.length || layers.includes(entry.layer))
      .map((entry) => ({ ...entry, score: cosineSimilarity(queryEmbedding, entry.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}
