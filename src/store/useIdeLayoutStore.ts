import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type IdeLayoutState = {
  leftPanelSizes: number[];
  setLeftPanelSizes: (sizes: number[]) => void;
  mainPanelSizes: number[];
  setMainPanelSizes: (sizes: number[]) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  bottomPanelCollapsed: boolean;
  setBottomPanelCollapsed: (collapsed: boolean) => void;
};

export const useIdeLayoutStore = create<IdeLayoutState>()(
  persist(
    (set) => ({
      leftPanelSizes: [8, 20, 72],
      setLeftPanelSizes: (sizes) => set({ leftPanelSizes: sizes }),
      mainPanelSizes: [72, 28],
      setMainPanelSizes: (sizes) => set({ mainPanelSizes: sizes }),
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      bottomPanelCollapsed: false,
      setBottomPanelCollapsed: (collapsed) => set({ bottomPanelCollapsed: collapsed }),
    }),
    {
      name: 'nexo-ide-layout-v3',
      partialize: (state) => ({
        leftPanelSizes: state.leftPanelSizes,
        mainPanelSizes: state.mainPanelSizes,
        sidebarCollapsed: state.sidebarCollapsed,
        bottomPanelCollapsed: state.bottomPanelCollapsed,
      }),
    }
  )
);
