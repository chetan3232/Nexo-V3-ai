import { MemoryLayer, RetrievedMemory } from '@/memory/types';

const API_BASE = import.meta.env.VITE_NEXO_API_URL ?? 'http://localhost:8787';

export async function searchBackendMemory(query: string, layers?: MemoryLayer[], limit = 6) {
  const response = await fetch(`${API_BASE}/api/memory/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, layers, limit }),
  });

  if (!response.ok) throw new Error('Memory search failed');
  return response.json() as Promise<{ results: RetrievedMemory[] }>;
}

export async function upsertBackendMemory(input: {
  layer: MemoryLayer;
  title: string;
  content: string;
  source?: string;
  tags?: string[];
}) {
  const response = await fetch(`${API_BASE}/api/memory/upsert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) throw new Error('Memory upsert failed');
  return response.json();
}
