import { useState } from 'react';
import { ChevronLeft, ChevronRight, Search, Sparkles, X, Minus, Maximize2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettingsStore } from '@/store/useSettingsStore';

type Props = {
  onTogglePalette: () => void;
  onToggleAI: () => void;
  aiPanelOpen: boolean;
};

type MenuItem = {
  label?: string;
  shortcut?: string;
  action?: () => void;
  type?: 'separator' | 'checkbox';
  checked?: boolean;
};

type MenuDefinition = {
  trigger: string;
  items: MenuItem[];
};

// Detect platform from Electron preload or user agent
const platform: string =
  (window as any).nexoDesktop?.platform ??
  (navigator.userAgent.includes('Mac') ? 'darwin' : 'win32');

const isMac     = platform === 'darwin';
const isWindows = platform === 'win32';

export function TitleBar({ onTogglePalette, onToggleAI, aiPanelOpen }: Props) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const { autoSave, minimapEnabled } = useSettingsStore();

  const dispatchCommand = (command: string, payload?: any) => {
    window.dispatchEvent(new CustomEvent('nexo-layout-command', { detail: { command, payload } }));
  };

  const menus: MenuDefinition[] = [
    {
      trigger: 'File',
      items: [
        { label: 'New File', shortcut: isMac ? '⌘N' : 'Ctrl+N', action: () => dispatchCommand('new-file') },
        { label: 'New Window', action: () => { if ((window as any).nexoDesktop) (window as any).nexoDesktop.newWindow(); else alert('Only supported on desktop.'); } },
        { type: 'separator' },
        { label: 'Open Folder...', shortcut: isMac ? '⌘O' : 'Ctrl+O', action: () => dispatchCommand('open-folder') },
        { type: 'separator' },
        { label: 'Save', shortcut: isMac ? '⌘S' : 'Ctrl+S', action: () => dispatchCommand('save-file') },
        { label: 'Save As...', shortcut: isMac ? '⇧⌘S' : 'Ctrl+Shift+S', action: () => dispatchCommand('save-as') },
        { type: 'separator' },
        { label: 'Auto Save', type: 'checkbox', checked: autoSave, action: () => dispatchCommand('toggle-auto-save') },
        { type: 'separator' },
        { label: 'Exit', action: () => { if ((window as any).nexoDesktop) (window as any).nexoDesktop.closeWindow(); else window.close(); } }
      ]
    },
    {
      trigger: 'Edit',
      items: [
        { label: 'Undo', shortcut: isMac ? '⌘Z' : 'Ctrl+Z', action: () => dispatchCommand('undo') },
        { label: 'Redo', shortcut: isMac ? '⌘Y' : 'Ctrl+Y', action: () => dispatchCommand('redo') },
        { type: 'separator' },
        { label: 'Cut', shortcut: isMac ? '⌘X' : 'Ctrl+X', action: () => dispatchCommand('cut') },
        { label: 'Copy', shortcut: isMac ? '⌘C' : 'Ctrl+C', action: () => dispatchCommand('copy') },
        { label: 'Paste', shortcut: isMac ? '⌘V' : 'Ctrl+V', action: () => dispatchCommand('paste') },
        { label: 'Select All', shortcut: isMac ? '⌘A' : 'Ctrl+A', action: () => dispatchCommand('select-all') },
        { type: 'separator' },
        { label: 'Find', shortcut: isMac ? '⌘F' : 'Ctrl+F', action: () => dispatchCommand('find') },
        { label: 'Replace', shortcut: isMac ? '⌥⌘F' : 'Ctrl+H', action: () => dispatchCommand('replace') }
      ]
    },
    {
      trigger: 'View',
      items: [
        { label: 'Toggle Sidebar', shortcut: isMac ? '⌘B' : 'Ctrl+B', action: () => dispatchCommand('toggle-sidebar') },
        { label: 'Toggle Terminal', shortcut: isMac ? '⌘J' : 'Ctrl+J', action: () => dispatchCommand('toggle-terminal') },
        { label: 'Toggle AI Panel', shortcut: isMac ? '⇧⌘A' : 'Ctrl+Shift+A', action: () => dispatchCommand('toggle-ai') },
        { type: 'separator' },
        { label: 'Toggle Minimap', type: 'checkbox', checked: minimapEnabled, action: () => dispatchCommand('toggle-minimap') },
        { type: 'separator' },
        { label: 'Zoom In', shortcut: isMac ? '⌘=' : 'Ctrl+=', action: () => dispatchCommand('zoom-in') },
        { label: 'Zoom Out', shortcut: isMac ? '⌘-' : 'Ctrl+-', action: () => dispatchCommand('zoom-out') }
      ]
    },
    {
      trigger: 'Go',
      items: [
        { label: 'Go to File', shortcut: isMac ? '⌘P' : 'Ctrl+P', action: () => dispatchCommand('go-to-file') },
        { label: 'Go to Line', shortcut: isMac ? '⌘G' : 'Ctrl+G', action: () => dispatchCommand('go-to-line') },
        { type: 'separator' },
        { label: 'Next Tab', shortcut: 'Ctrl+Tab', action: () => dispatchCommand('next-tab') }
      ]
    },
    {
      trigger: 'Run',
      items: [
        { label: 'Run Project', action: () => dispatchCommand('run-project') },
        { label: 'Stop Project', action: () => dispatchCommand('stop-project') },
        { label: 'Restart Project', action: () => dispatchCommand('restart-project') },
        { type: 'separator' },
        { label: 'Run Current File', action: () => dispatchCommand('run-current-file') }
      ]
    },
    {
      trigger: 'Terminal',
      items: [
        { label: 'New Terminal', shortcut: 'Ctrl+`', action: () => dispatchCommand('new-terminal') }
      ]
    },
    {
      trigger: 'Help',
      items: [
        { label: 'Documentation', action: () => window.open('https://github.com/chetan3232/Nexo-V3-ai', '_blank') },
        { label: 'About', action: () => dispatchCommand('about') }
      ]
    }
  ];

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
        WebkitAppRegion: 'drag',
        position: 'relative',
      } as any}
    >
      {/* Click overlay to dismiss dropdowns */}
      {activeMenu && (
        <div
          onClick={() => setActiveMenu(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'transparent',
            zIndex: 990,
            WebkitAppRegion: 'no-drag',
          } as any}
        />
      )}

      {/* ── macOS style traffic lights ── */}
      {isMac && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          paddingLeft: '14px',
          paddingRight: '10px',
          flexShrink: 0,
          WebkitAppRegion: 'no-drag',
          zIndex: 1000,
        } as any}>
          {[
            { color: '#ff5f57', title: 'Close', action: () => { if ((window as any).nexoDesktop) (window as any).nexoDesktop.closeWindow(); else window.close(); } },
            { color: '#febc2e', title: 'Minimize', action: () => { if ((window as any).nexoDesktop) (window as any).nexoDesktop.minimizeWindow(); } },
            { color: '#28c840', title: 'Maximize', action: () => { if ((window as any).nexoDesktop) (window as any).nexoDesktop.maximizeWindow(); } },
          ].map(({ color, title, action }) => (
            <div key={title} title={title} onClick={action} style={{
              width: '12px', height: '12px', borderRadius: '50%',
              background: color, cursor: 'pointer', flexShrink: 0,
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
        WebkitAppRegion: 'no-drag',
        zIndex: 1000,
      } as any}>
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

        {menus.map((menu) => {
          const isOpen = activeMenu === menu.trigger;
          return (
            <div key={menu.trigger} style={{ position: 'relative', display: 'inline-block' }}>
              <button
                style={{
                  ...menuBtnStyle,
                  background: isOpen ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: isOpen ? '#e2e8f0' : '#9ca3af',
                }}
                onClick={() => setActiveMenu(isOpen ? null : menu.trigger)}
                onMouseEnter={() => {
                  if (activeMenu !== null) {
                    setActiveMenu(menu.trigger);
                  }
                }}
              >
                {menu.trigger}
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.1 }}
                    style={{
                      position: 'absolute',
                      top: '35px',
                      left: 0,
                      width: '200px',
                      background: 'rgba(17, 24, 39, 0.95)',
                      backdropFilter: 'blur(16px) saturate(140%)',
                      border: '1px solid #1f2937',
                      borderRadius: '6px',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
                      padding: '4px 0',
                      zIndex: 1010,
                      WebkitAppRegion: 'no-drag',
                    } as any}
                  >
                    {menu.items.map((item, idx) => {
                      if (item.type === 'separator') {
                        return (
                          <div
                            key={idx}
                            style={{ height: '1px', background: '#1f2937', margin: '4px 0' }}
                          />
                        );
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            setActiveMenu(null);
                            if (item.action) item.action();
                          }}
                          style={{
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            padding: '6px 12px',
                            color: '#c9d1d9',
                            fontSize: '12px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'background 80ms, color 80ms',
                          }}
                          onMouseEnter={(e) => {
                            const btn = e.currentTarget as HTMLButtonElement;
                            btn.style.background = '#1e3a8a';
                            btn.style.color = '#ffffff';
                          }}
                          onMouseLeave={(e) => {
                            const btn = e.currentTarget as HTMLButtonElement;
                            btn.style.background = 'transparent';
                            btn.style.color = '#c9d1d9';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {item.type === 'checkbox' ? (
                              <div style={{ width: '12px', height: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {item.checked && <Check size={10} color="#3b82f6" strokeWidth={3} />}
                              </div>
                            ) : null}
                            <span>{item.label}</span>
                          </div>
                          {item.shortcut && (
                            <span style={{ fontSize: '10px', color: '#6b7280', fontFamily: "'JetBrains Mono', monospace" }}>
                              {item.shortcut}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* ── Center: Search / Command Palette ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        WebkitAppRegion: 'no-drag',
        zIndex: 900,
      } as any}>
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
        WebkitAppRegion: 'no-drag',
        zIndex: 1000,
      } as any}>
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
            <button style={winCtrlBtn} title="Minimize" onClick={() => { if ((window as any).nexoDesktop) (window as any).nexoDesktop.minimizeWindow(); }}>
              <Minus size={14} />
            </button>
            <button style={winCtrlBtn} title="Maximize" onClick={() => { if ((window as any).nexoDesktop) (window as any).nexoDesktop.maximizeWindow(); }}>
              <Maximize2 size={13} />
            </button>
            <button
              style={{ ...winCtrlBtn, borderRadius: '0' }}
              title="Close"
              onClick={() => { if ((window as any).nexoDesktop) (window as any).nexoDesktop.closeWindow(); }}
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
