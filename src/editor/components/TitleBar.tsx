import { ChevronLeft, ChevronRight, Search, Sparkles, X, Minus, Maximize2 } from 'lucide-react';

type Props = {
  onTogglePalette: () => void;
  onToggleAI: () => void;
  aiPanelOpen: boolean;
};

const menuItems = ['File', 'Edit', 'View', 'Go', 'Run', 'Terminal', 'Help'];

// Detect platform from Electron preload or user agent
const platform: string =
  (window as any).nexoDesktop?.platform ??
  (navigator.userAgent.includes('Mac') ? 'darwin' : 'win32');

const isMac     = platform === 'darwin';
const isWindows = platform === 'win32';

export function TitleBar({ onTogglePalette, onToggleAI, aiPanelOpen }: Props) {
  return (
    <header
      style={{
        height: '35px',
        background: '#111827',
        borderBottom: '1px solid #1f2937',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        userSelect: 'none',
        // Allow Electron drag on the title bar
        WebkitAppRegion: 'drag' as any,
      }}
    >
      {/* ── macOS: traffic lights on left ── */}
      {isMac && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          paddingLeft: '14px',
          paddingRight: '10px',
          flexShrink: 0,
          WebkitAppRegion: 'no-drag' as any,
        }}>
          {[
            { color: '#ff5f57', title: 'Close' },
            { color: '#febc2e', title: 'Minimize' },
            { color: '#28c840', title: 'Maximize' },
          ].map(({ color, title }) => (
            <div key={title} title={title} style={{
              width: '12px', height: '12px', borderRadius: '50%',
              background: color, cursor: 'default', flexShrink: 0,
            }} />
          ))}
        </div>
      )}

      {/* ── Left: nav arrows + app menu ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        paddingLeft: isMac ? '0' : '8px',
        WebkitAppRegion: 'no-drag' as any,
      }}>
        {!isMac && (
          <>
            <button onClick={onTogglePalette} style={menuBtnStyle} title="Back">
              <ChevronLeft size={15} />
            </button>
            <button onClick={onTogglePalette} style={menuBtnStyle} title="Forward">
              <ChevronRight size={15} />
            </button>
          </>
        )}

        {menuItems.map((item) => (
          <button
            key={item}
            style={menuBtnStyle}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.background = 'rgba(255,255,255,0.07)';
              el.style.color = '#e2e8f0';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.background = 'transparent';
              el.style.color = '#9ca3af';
            }}
          >
            {item}
          </button>
        ))}
      </div>

      {/* ── Center: Search / Command Palette ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        WebkitAppRegion: 'no-drag' as any,
      }}>
        <button
          id="command-palette-trigger"
          onClick={onTogglePalette}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid #1f2937',
            borderRadius: '6px',
            padding: '4px 12px',
            color: '#6b7280',
            fontSize: '12.5px',
            cursor: 'pointer',
            width: '280px',
            transition: 'border-color 150ms, background 150ms',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.borderColor = '#374151';
            el.style.background = 'rgba(255,255,255,0.09)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.borderColor = '#1f2937';
            el.style.background = 'rgba(255,255,255,0.06)';
          }}
        >
          <Search size={13} />
          <span style={{ flex: 1, textAlign: 'left' }}>NEXO V3</span>
          <kbd style={{
            background: '#1f2937', border: '1px solid #374151',
            borderRadius: '3px', padding: '1px 5px',
            fontSize: '10.5px', color: '#4b5563',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {isMac ? '⌘K' : 'Ctrl+K'}
          </kbd>
        </button>
      </div>

      {/* ── Right: AI toggle + Windows window controls ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        paddingRight: isWindows ? '0' : '8px',
        flexShrink: 0,
        WebkitAppRegion: 'no-drag' as any,
      }}>
        {/* AI toggle */}
        <button
          id="toggle-ai-panel"
          onClick={onToggleAI}
          title="Toggle AI Panel (Ctrl+Shift+A)"
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            background: aiPanelOpen ? 'rgba(59,130,246,0.15)' : 'transparent',
            border: `1px solid ${aiPanelOpen ? 'rgba(59,130,246,0.5)' : 'transparent'}`,
            borderRadius: '5px', padding: '3px 8px',
            color: aiPanelOpen ? '#60a5fa' : '#6b7280',
            fontSize: '12px', cursor: 'pointer',
            transition: 'all 150ms ease',
            marginRight: '4px',
          }}
        >
          <Sparkles size={13} />
          <span>AI</span>
        </button>

        {/* Windows-style window controls */}
        {isWindows && (
          <>
            <button style={winCtrlBtn} title="Minimize" onClick={() => { /* Electron IPC */ }}>
              <Minus size={14} />
            </button>
            <button style={winCtrlBtn} title="Maximize">
              <Maximize2 size={13} />
            </button>
            <button
              style={{ ...winCtrlBtn, borderRadius: '0' }}
              title="Close"
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#c42b1c'; (e.currentTarget as HTMLButtonElement).style.color = 'white'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#6b7280'; }}
            >
              <X size={14} />
            </button>
          </>
        )}
      </div>
    </header>
  );
}

// Shared button styles
const menuBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#9ca3af',
  fontSize: '12.5px',
  padding: '0 7px',
  height: '35px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  borderRadius: '0',
  transition: 'color 100ms, background 100ms',
};

const winCtrlBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#6b7280',
  width: '46px',
  height: '35px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '0',
  transition: 'background 100ms, color 100ms',
};
