import { create } from 'zustand';

export type ArchNode = {
  id: string;
  path: string;
  label: string;
  type: 'component' | 'store' | 'service' | 'route' | 'api' | 'page' | 'hook' | 'other';
  x?: number;
  y?: number;
  description?: string;
};

export type ArchEdge = {
  from: string;
  to: string;
  type: 'import' | 'uses' | 'calls';
};

type ArchMapState = {
  nodes: ArchNode[];
  edges: ArchEdge[];
  selectedNode: string | null;
  filterType: 'all' | 'component' | 'store' | 'service' | 'route' | 'api' | 'page' | 'hook';
  isBuilding: boolean;
  buildMap: () => Promise<void>;
  selectNode: (id: string | null) => void;
  setFilter: (type: ArchMapState['filterType']) => void;
};

const API_BASE = (import.meta as any).env?.VITE_NEXO_API_URL ?? 'http://localhost:8787';

export const useArchMapStore = create<ArchMapState>((set) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  filterType: 'all',
  isBuilding: false,

  selectNode: (id) => set({ selectedNode: id }),
  setFilter: (type) => set({ filterType: type }),

  buildMap: async () => {
    set({ isBuilding: true });
    try {
      const res = await fetch(`${API_BASE}/api/archmap/build`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error('Graph build failed');
      }

      const data = await res.json();
      if (data.success) {
        // Lay out nodes in a simple circle/grid pattern if they don't have coordinates
        const rawNodes: ArchNode[] = data.nodes || [];
        const mappedNodes = rawNodes.map((node, index) => {
          const angle = (index / rawNodes.length) * 2 * Math.PI;
          const radius = 150 + Math.random() * 50;
          return {
            ...node,
            x: 250 + radius * Math.cos(angle),
            y: 250 + radius * Math.sin(angle),
          };
        });

        set({
          nodes: mappedNodes,
          edges: data.edges || [],
        });
      }
    } catch (e) {
      console.error('[ArchMap Store] Error building map:', e);
    } finally {
      set({ isBuilding: false });
    }
  },
}));
