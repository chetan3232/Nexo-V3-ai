import { ChevronLeft, ChevronRight, Search, Maximize2, Minus, X, Sparkles } from 'lucide-react';

type Props = {
  onTogglePalette: () => void;
  onToggleAI: () => void;
  aiPanelOpen: boolean;
};

const menuItems = ['File', 'Edit', 'View', 'Go', 'Run', 'Terminal', 'Help'];

export function TitleBar({ onTogglePalette, onToggleAI, aiPanelOpen }: Props) {
  return (
    <header style={{
      height: '35px',
      background: '#111827',
      borderBottom: '1px solid #1f2937',
      display: 'flex',
      alignItems: 'center',
      flexShrink: 0,
      userSelect: 'none',
    }}>
      {/* ── Left: traffic lights + menu ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '12px',
        paddingRight: '6px',
        gap: '0px',
        flexShrink: 0,
      }}>
        {/* Window controls */}
        <div style={{ display: 'flex', gap: '6px', marginRight: '14px' }}>
          {[
            { color: '#ff5f57', title: 'Close' },
            { color: '#febc2e', title: 'Minimize' },
            { color: '#28c840', title: 'Maximize' },
          ].map(({ color, title }) => (
            <div
              key={title}
              title={title}
              style={{
                width: '12px', height: '12px', borderRadius: '50%',
                background: color, cursor: 'pointer', flexShrink: 0,
              }}
            />
          ))}
        </div>

        {/* Nav arrows */}
        <button style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', padding: '3px', display: 'flex' }}>
          <ChevronLeft size={16} />
        </button>
        <button style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', padding: '3px', display: 'flex' }}>
          <ChevronRight size={16} />
        </button>

        {/* App menu */}
        {menuItems.map((item) => (
          <button
            key={item}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              fontSize: '12.5px',
              padding: '0 6px',
              height: '35px',
              cursor: 'pointer',
              borderRadius: '0',
              transition: 'color 100ms, background 100ms',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.background = 'rgba(255,255,255,0.06)';
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

      {/* ── Center: Title / Command Palette ── */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <button
          id="command-palette-trigger"
          onClick={onTogglePalette}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid #1f2937',
            borderRadius: '6px',
            padding: '4px 12px',
            color: '#6b7280',
            fontSize: '12.5px',
            cursor: 'pointer',
            width: '320px',
            transition: 'border-color 150ms, background 150ms',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.borderColor = '#374151';
            el.style.background = 'rgba(255,255,255,0.08)';
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
            background: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '3px',
            padding: '1px 5px',
            fontSize: '10.5px',
            color: '#4b5563',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* ── Right: AI toggle + panel icons ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        paddingRight: '8px',
        flexShrink: 0,
      }}>
        <button
          id="toggle-ai-panel"
          onClick={onToggleAI}
          title="Toggle AI Panel"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: aiPanelOpen ? 'rgba(59,130,246,0.15)' : 'transparent',
            border: `1px solid ${aiPanelOpen ? '#3b82f6' : 'transparent'}`,
            borderRadius: '5px',
            padding: '3px 8px',
            color: aiPanelOpen ? '#60a5fa' : '#6b7280',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 150ms ease',
          }}
        >
          <Sparkles size={13} />
          <span>AI</span>
        </button>

        {/* Layout icons */}
        {[Maximize2, Minus].map((Icon, i) => (
          <button
            key={i}
            style={{
              width: '28px', height: '28px', borderRadius: '4px',
              background: 'transparent', border: 'none',
              color: '#4b5563', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              transition: 'background 100ms, color 100ms',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.background = 'rgba(255,255,255,0.06)';
              el.style.color = '#9ca3af';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.background = 'transparent';
              el.style.color = '#4b5563';
            }}
          >
            <Icon size={14} />
          </button>
        ))}
      </div>
    </header>
  );
}
