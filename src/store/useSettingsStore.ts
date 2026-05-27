import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type SettingsState = {
  autoSave: boolean;
  fontSize: number;
  wordWrap: 'on' | 'off';
  minimapEnabled: boolean;

  setAutoSave: (v: boolean) => void;
  setFontSize: (v: number) => void;
  setWordWrap: (v: 'on' | 'off') => void;
  setMinimapEnabled: (v: boolean) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      autoSave: true,
      fontSize: 13.5,
      wordWrap: 'off',
      minimapEnabled: true,

      setAutoSave: (v) => set({ autoSave: v }),
      setFontSize: (v) => set({ fontSize: v }),
      setWordWrap: (v) => set({ wordWrap: v }),
      setMinimapEnabled: (v) => set({ minimapEnabled: v }),
    }),
    {
      name: 'nexo-settings-v3',
    }
  )
);
