import { Search, Maximize2, Minus, X, Sparkles, LayoutPanelLeft } from 'lucide-react';

type Props = {
  onTogglePalette: () => void;
  onToggleAI: () => void;
  aiPanelOpen: boolean;
};

const menuItems = ['File', 'Edit', 'View', 'Go', 'Run', 'Terminal', 'Help'];

export function TitleBar({ onTogglePalette, onToggleAI, aiPanelOpen }: Props) {
  return (
    <header
      style={{
        height: 'var(--header-h)',
        background: 'var(--bg-sidebar)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        userSelect: 'none',
      }}
      className="titlebar-drag"
    >
      {/* ── App icon + menu ── */}
      <div
        className="titlebar-no-drag"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0px',
          paddingLeft: '10px',
          paddingRight: '4px',
        }}
      >
        {/* Logo mark */}
        <div
          style={{
            width: '22px',
            height: '22px',
            borderRadius: '5px',
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '10px',
            flexShrink: 0,
          }}
        >
          <Sparkles size={13} color="white" />
        </div>

        {/* Menu items */}
        {menuItems.map((item) => (
          <button
            key={item}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '12.5px',
              padding: '0 7px',
              height: '28px',
              cursor: 'pointer',
              borderRadius: '4px',
              transition: 'color 100ms, background 100ms',
            }}
            className="hover:!text-[color:var(--text-primary)] hover:bg-[var(--bg-hover)]"
          >
            {item}
          </button>
        ))}
      </div>

      {/* ── Center: Command Palette trigger ── */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }} className="titlebar-no-drag">
        <button
          id="command-palette-trigger"
          onClick={onTogglePalette}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-input)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '4px 12px',
            color: 'var(--text-muted)',
            fontSize: '12px',
            cursor: 'pointer',
            width: '340px',
            transition: 'border-color 150ms, background 150ms',
          }}
          className="hover:!border-[color:var(--border-focus)] hover:bg-[var(--bg-hover)]"
        >
          <Search size={13} />
          <span style={{ flex: 1, textAlign: 'left' }}>nexo v3 — Search commands</span>
          <kbd
            style={{
              background: 'var(--border)',
              border: '1px solid var(--border-light)',
              borderRadius: '3px',
              padding: '1px 5px',
              fontSize: '10.5px',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-code)',
            }}
          >
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* ── Right: AI panel toggle + window controls ── */}
      <div
        className="titlebar-no-drag"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          paddingRight: '4px',
        }}
      >
        {/* AI panel toggle */}
        <button
          id="toggle-ai-panel"
          onClick={onToggleAI}
          title="Toggle AI Panel (Ctrl+Shift+A)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: aiPanelOpen ? 'var(--accent-dim)' : 'transparent',
            border: `1px solid ${aiPanelOpen ? 'var(--accent)' : 'transparent'}`,
            borderRadius: '5px',
            padding: '4px 8px',
            color: aiPanelOpen ? 'var(--accent)' : 'var(--text-muted)',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            marginRight: '6px',
          }}
        >
          <Sparkles size={13} />
          <span>Nexo AI</span>
        </button>

        {/* Window controls (Electron simulation) */}
        {[
          { icon: Minus,     title: 'Minimize', color: '#f59e0b' },
          { icon: Maximize2, title: 'Maximize', color: '#22c55e' },
          { icon: X,         title: 'Close',    color: '#ef4444' },
        ].map(({ icon: Icon, title, color }) => (
          <button
            key={title}
            title={title}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '4px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 100ms, color 100ms',
            }}
            className={`hover:!bg-[var(--bg-hover)] hover:!text-[color:var(--text-primary)]`}
          >
            <Icon size={13} />
          </button>
        ))}
      </div>
    </header>
  );
}
