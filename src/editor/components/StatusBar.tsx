import { GitBranch, Wifi, Cpu, AlertTriangle, Info, CheckCircle2, Zap } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';

type Props = {
  aiPanelOpen?: boolean;
  sidebarOpen?: boolean;
};

export function StatusBar({ aiPanelOpen, sidebarOpen }: Props) {
  const { activeFile, files } = useEditorStore();
  const activeFileData = activeFile ? files[activeFile] : null;

  const getLanguageLabel = (lang?: string) => {
    const map: Record<string, string> = {
      typescript: 'TypeScript',
      javascript: 'JavaScript',
      tsx: 'TypeScript React',
      jsx: 'JavaScript React',
      css: 'CSS',
      json: 'JSON',
      markdown: 'Markdown',
      python: 'Python',
      plaintext: 'Plain Text',
    };
    return lang ? (map[lang] ?? lang) : 'Plain Text';
  };

  return (
    <footer className="status-bar">
      {/* Left side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
        <div className="status-item" style={{ gap: '5px', fontWeight: 600 }}>
          <GitBranch size={12} />
          <span>main</span>
        </div>

        <div className="status-item">
          <AlertTriangle size={11} />
          <span>1</span>
          <CheckCircle2 size={11} />
          <span>0</span>
        </div>

        <div className="status-item">
          <Zap size={11} />
          <span>AI Ready</span>
        </div>
      </div>

      {/* Center - file info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {activeFileData && (
          <>
            <div className="status-item">
              <span>{getLanguageLabel(activeFileData.language)}</span>
            </div>
            <div className="status-item">
              <span>UTF-8</span>
            </div>
            <div className="status-item">
              <span>LF</span>
            </div>
            <div className="status-item">
              <span>Ln 1, Col 1</span>
            </div>
            <div className="status-item">
              <span>Spaces: 2</span>
            </div>
          </>
        )}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, justifyContent: 'flex-end' }}>
        <div className="status-item">
          <Cpu size={11} />
          <span>Nexo AI</span>
        </div>
        <div className="status-item">
          <Wifi size={11} />
          <span>Connected</span>
        </div>
      </div>
    </footer>
  );
}
