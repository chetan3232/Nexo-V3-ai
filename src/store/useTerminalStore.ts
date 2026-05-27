import { create } from 'zustand';

export type TerminalInstance = {
  id: string;
  name: string;
};

type TerminalState = {
  terminals: TerminalInstance[];
  activeId: string | null;

  createTerminal: () => void;
  removeTerminal: (id: string) => void;
  setActiveId: (id: string) => void;
};

export const useTerminalStore = create<TerminalState>((set, get) => ({
  terminals: [],
  activeId: null,

  createTerminal: () => {
    const isElectron = typeof window !== 'undefined' && !!(window as any).nexoDesktop;
    const desktop = isElectron ? (window as any).nexoDesktop : null;

    const id = `t-${Date.now()}`;
    const index = get().terminals.length + 1;
    const isWin = desktop?.platform === 'win32';
    const shellName = isWin ? 'powershell' : 'bash';
    const newTerm: TerminalInstance = {
      id,
      name: `${shellName} (${index})`,
    };

    // If in Electron, initialize native process shell matching this ID
    if (desktop) {
      desktop.initTerminal(id);
    }

    set((state) => ({
      terminals: [...state.terminals, newTerm],
      activeId: id,
    }));
  },

  removeTerminal: (id) => {
    const { terminals, activeId } = get();
    const isElectron = typeof window !== 'undefined' && !!(window as any).nexoDesktop;

    if (isElectron) {
      (window as any).nexoDesktop.killTerminal(id);
    }

    const filtered = terminals.filter((t) => t.id !== id);
    let nextActive = activeId;

    if (activeId === id) {
      nextActive = filtered[filtered.length - 1]?.id ?? null;
    }

    set({
      terminals: filtered,
      activeId: nextActive,
    });
  },

  setActiveId: (id) => {
    set({ activeId: id });
  },
}));
