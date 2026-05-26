export type MemoryLayer = 'short' | 'long' | 'project' | 'conversation' | 'code';

export type MemoryEntry = {
  id: string;
  layer: MemoryLayer;
  title: string;
  content: string;
  source?: string;
  tags: string[];
  embedding: number[];
  createdAt: number;
  updatedAt: number;
};

export type RetrievedMemory = MemoryEntry & {
  score: number;
};
