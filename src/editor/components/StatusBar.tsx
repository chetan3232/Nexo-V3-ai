import { GitBranch, AlertCircle, AlertTriangle, CheckCircle2, Zap, Bell, Cloud, ShieldAlert, Activity } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { useImpactStore } from '@/store/useImpactStore';
import { useHealthStore } from '@/store/useHealthStore';

type Props = {
  aiPanelOpen?: boolean;
  sidebarOpen?: boolean;
};

function StatusItem({ children, onClick, title }: { children: React.ReactNode; onClick?: () => void; title?: string }) {
  return (
    <div
      onClick={onClick}
      title={title}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '0 8px',
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        fontSize: '11.5px',
        color: 'rgba(255,255,255,0.88)',
        whiteSpace: 'nowrap',
        transition: 'background 100ms',
      }}
      onMouseEnter={(e) => { if (onClick) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.1)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
    >
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ width: '1px', height: '60%', background: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />;
}

export function StatusBar({ aiPanelOpen, sidebarOpen }: Props) {
  const { activeFile, files } = useEditorStore();
  const activeFileData = activeFile ? files[activeFile] : null;
  const { report } = useImpactStore();
  const { healthScore, categories } = useHealthStore();
  const securityScore = categories.find(c => c.name === 'security')?.score ?? 100;
  const performanceScore = categories.find(c => c.name === 'performance')?.score ?? 100;

  const langLabel: Record<string, string> = {
    typescript: 'TypeScript React',
    javascript: 'JavaScript React',
    tsx: 'TypeScript React',
    jsx: 'JavaScript React',
    css: 'CSS',
    json: 'JSON',
    markdown: 'Markdown',
    python: 'Python',
    plaintext: 'Plain Text',
  };

  const language = activeFileData?.language
    ? (langLabel[activeFileData.language] ?? activeFileData.language)
    : 'Plain Text';

  return (
    <footer style={{
      height: '22px',
      background: '#3b82f6',
      display: 'flex',
      alignItems: 'center',
      flexShrink: 0,
      overflow: 'hidden',
    }}>
      {/* Left side */}
      <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        <StatusItem onClick={() => {}}>
          <GitBranch size={12} />
          <span>main</span>
        </StatusItem>

        <StatusItem onClick={() => {}}>
          <AlertCircle size={12} />
          <span>0</span>
          <AlertTriangle size={12} style={{ marginLeft: '4px' }} />
          <span>0</span>
        </StatusItem>

        <Divider />

        <StatusItem onClick={() => {
          window.dispatchEvent(new CustomEvent('nexo-layout-command', { detail: { command: 'toggle-ai', payload: true } }));
          window.dispatchEvent(new CustomEvent('nexo-assistant-tab', { detail: { tab: 'impact' } }));
        }} title="Code impact risk audit status">
          <ShieldAlert size={12} />
          <span>Impact: {report ? report.overallRisk.toUpperCase() : 'SAFE'}</span>
        </StatusItem>

        <Divider />

        <StatusItem onClick={() => {
          window.dispatchEvent(new CustomEvent('nexo-layout-command', { detail: { command: 'toggle-ai', payload: true } }));
          window.dispatchEvent(new CustomEvent('nexo-assistant-tab', { detail: { tab: 'health' } }));
        }} title="Project codebase health audit score">
          <Activity size={12} />
          <span>Health: {healthScore}%</span>
        </StatusItem>

        <Divider />

        <StatusItem onClick={() => {
          window.dispatchEvent(new CustomEvent('nexo-layout-command', { detail: { command: 'toggle-ai', payload: true } }));
          window.dispatchEvent(new CustomEvent('nexo-assistant-tab', { detail: { tab: 'health' } }));
        }} title="Codebase security audit score">
          <ShieldAlert size={12} style={{ color: securityScore < 70 ? '#ef4444' : securityScore < 85 ? '#f59e0b' : '#34d399' }} />
          <span>Security: {securityScore}%</span>
        </StatusItem>

        <Divider />

        <StatusItem onClick={() => {
          window.dispatchEvent(new CustomEvent('nexo-layout-command', { detail: { command: 'toggle-ai', payload: true } }));
          window.dispatchEvent(new CustomEvent('nexo-assistant-tab', { detail: { tab: 'health' } }));
        }} title="Codebase performance audit score">
          <Zap size={12} style={{ color: performanceScore < 70 ? '#ef4444' : performanceScore < 85 ? '#f59e0b' : '#34d399' }} />
          <span>Performance: {performanceScore}%</span>
        </StatusItem>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Right side — matches reference exactly */}
      <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        {activeFileData && (
          <>
            <StatusItem onClick={() => {}}>
              <span>Ln 1, Col 1</span>
            </StatusItem>

            <StatusItem onClick={() => {}}>
              <span>Spaces: 2</span>
            </StatusItem>

            <StatusItem onClick={() => {}}>
              <span>UTF-8</span>
            </StatusItem>

            <StatusItem onClick={() => {}}>
              <span>LF</span>
            </StatusItem>

            <StatusItem onClick={() => {}}>
              <span>{language}</span>
            </StatusItem>

            <StatusItem onClick={() => {}}>
              <CheckCircle2 size={11} />
              <span>Prettier</span>
            </StatusItem>
          </>
        )}

        <StatusItem onClick={() => {
          window.dispatchEvent(new CustomEvent('nexo-layout-command', { detail: { command: 'toggle-cloud' } }));
        }} title="Cloud Projects & Sync">
          <Cloud size={11} />
        </StatusItem>

        <StatusItem onClick={() => {}}>
          <Bell size={11} />
        </StatusItem>
      </div>
    </footer>
  );
}
