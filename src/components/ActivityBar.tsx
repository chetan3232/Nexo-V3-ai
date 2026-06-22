import React from 'react';
import { FolderOpen, Search, GitFork, Play, Settings } from 'lucide-react';
import { useIdeLayoutStore } from '@/store/useIdeLayoutStore';

export const ActivityBar: React.FC = () => {
  const sidebarCollapsed = useIdeLayoutStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useIdeLayoutStore((s) => s.setSidebarCollapsed);
  
  const aiPanelOpen = useIdeLayoutStore((s) => s.aiPanelOpen);
  const setAiPanelOpen = useIdeLayoutStore((s) => s.setAiPanelOpen);
  
  const bottomPanelCollapsed = useIdeLayoutStore((s) => s.bottomPanelCollapsed);
  const setBottomPanelCollapsed = useIdeLayoutStore((s) => s.setBottomPanelCollapsed);

  return (
    <div className="activity-bar flex flex-col items-center bg-[#1e1e1e] py-2 w-12 border-r border-[#252526]">
      <button className="mb-4 p-2 hover:bg-[#2a2d2e] rounded transition-colors" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} title="Explorer">
        <FolderOpen size={20} className={sidebarCollapsed ? "text-gray-400" : "text-cyan-400"} />
      </button>
      <button className="mb-4 p-2 hover:bg-[#2a2d2e] rounded transition-colors" onClick={() => setAiPanelOpen(!aiPanelOpen)} title="AI Panel">
        <Search size={20} className={!aiPanelOpen ? "text-gray-400" : "text-cyan-400"} />
      </button>
      <button className="mb-4 p-2 hover:bg-[#2a2d2e] rounded transition-colors" onClick={() => setBottomPanelCollapsed(!bottomPanelCollapsed)} title="Terminal">
        <Play size={20} className={bottomPanelCollapsed ? "text-gray-400" : "text-cyan-400"} />
      </button>
      <button className="mb-4 p-2 hover:bg-[#2a2d2e] rounded transition-colors" onClick={() => {/* settings placeholder */}} title="Settings">
        <Settings size={20} className="text-gray-400 hover:text-white" />
      </button>
    </div>
  );
};
