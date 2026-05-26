import fs from 'node:fs/promises';
import path from 'node:path';

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
    const entries = await this.readEntries();
    const now = Date.now();
    const id = input.id ?? `${input.layer}-${now}`;
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
    const queryEmbedding = createEmbedding(query);
    const entries = await this.readEntries();

    return entries
      .filter((entry) => !layers?.length || layers.includes(entry.layer))
      .map((entry) => ({ ...entry, score: cosineSimilarity(queryEmbedding, entry.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}
