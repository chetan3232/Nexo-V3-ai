import React from 'react';
import { ExplorerTree } from '@/explorer/ExplorerTree';
import { useIdeLayoutStore } from '@/store/useIdeLayoutStore';

export const SideBar: React.FC = () => {
  const sidebarCollapsed = useIdeLayoutStore((s) => s.sidebarCollapsed);

  if (sidebarCollapsed) return null;

  return (
    <aside className="w-64 bg-[#252526] text-[#d4d4d4] flex flex-col border-r border-[#1e1e1e] h-full select-none">
      <div className="p-3 uppercase text-xs font-bold tracking-wider text-gray-400 flex justify-between items-center">
        <span>Explorer</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        <ExplorerTree />
      </div>
    </aside>
  );
};
