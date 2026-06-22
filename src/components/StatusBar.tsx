import React from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { Terminal, Cpu, GitBranch } from 'lucide-react';

export const StatusBar: React.FC = () => {
  const activeFile = useEditorStore((s) => s.activeFile);
  const files = useEditorStore((s) => s.files);

  const fileDetail = activeFile ? files[activeFile] : null;
  const fileName = activeFile ? activeFile.split(/[\\/]/).pop() : 'No File Open';
  const language = fileDetail?.language ? fileDetail.language.toUpperCase() : 'PLAINTEXT';

  return (
    <footer className="h-6 bg-[#007acc] text-white flex items-center justify-between px-3 text-xs select-none">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 bg-[#1f8ad2] px-2 h-full py-0.5 font-bold">
          <Cpu size={12} />
          <span>NEXO V3</span>
        </div>
        <div className="flex items-center gap-1">
          <GitBranch size={12} />
          <span>master</span>
        </div>
        <div className="truncate max-w-xs font-mono text-[11px] opacity-90">
          {activeFile || 'Ready'}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="opacity-90">{language}</span>
        <span className="opacity-90">UTF-8</span>
        <span className="opacity-90">LF</span>
        <div className="flex items-center gap-1 opacity-90">
          <Terminal size={12} />
          <span>Port: 8787</span>
        </div>
      </div>
    </footer>
  );
};
