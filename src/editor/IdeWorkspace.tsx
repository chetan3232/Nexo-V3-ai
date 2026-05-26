import { useEffect, useState } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { Binary, ChevronDown, ChevronUp, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { ActivityBar } from './components/ActivityBar';
import { Sidebar } from './components/Sidebar';
import { EditorTabs } from './components/EditorTabs';
import { CodeEditor } from './CodeEditor';
import { BottomPanel } from './components/BottomPanel';
import { StatusBar } from './components/StatusBar';
import { CommandPalette } from './components/CommandPalette';
import { useIdeLayoutStore } from '@/store/useIdeLayoutStore';

export function IdeWorkspace() {
  const [activeIcon, setActiveIcon] = useState(0);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const {
    leftPanelSizes,
    setLeftPanelSizes,
    mainPanelSizes,
    setMainPanelSizes,
    sidebarCollapsed,
    setSidebarCollapsed,
    bottomPanelCollapsed,
    setBottomPanelCollapsed,
  } = useIdeLayoutStore();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((value) => !value);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_45%),radial-gradient(circle_at_90%_20%,rgba(20,184,166,0.16),transparent_38%),#020617] text-slate-100">
      <div className="pointer-events-none absolute -left-28 top-24 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-8 right-10 h-52 w-52 rounded-full bg-fuchsia-400/20 blur-3xl" />

      <header className="flex h-11 items-center justify-between border-b border-cyan-300/20 bg-slate-950/60 px-3 backdrop-blur-xl">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-cyan-200">
          <Binary className="h-4 w-4" /> NEXO V3 IDE
        </div>
        <button
          onClick={() => setPaletteOpen(true)}
          className="rounded-md border border-cyan-300/30 bg-cyan-400/10 px-2 py-1 text-xs text-cyan-100 hover:bg-cyan-300/20"
        >
          Command Palette (Ctrl/Cmd + K)
        </button>
      </header>

      <Group orientation="vertical" onLayoutChange={(layout) => setMainPanelSizes(Object.values(layout))}>
        <Panel defaultSize={mainPanelSizes[0] ?? 72} minSize={45}>
          <Group orientation="horizontal" onLayoutChange={(layout) => setLeftPanelSizes(Object.values(layout))}>
            <Panel defaultSize={leftPanelSizes[0] ?? 8} minSize={6} maxSize={10}>
              <ActivityBar activeIndex={activeIcon} onSelect={setActiveIcon} />
            </Panel>
            <Separator className="w-px bg-cyan-300/20 hover:bg-cyan-300/50" />
            <Panel
              collapsible
              collapsedSize={0}
              onCollapse={() => setSidebarCollapsed(true)}
              onExpand={() => setSidebarCollapsed(false)}
              defaultSize={leftPanelSizes[1] ?? 20}
              minSize={14}
              maxSize={32}
            >
              <Sidebar collapsed={sidebarCollapsed} />
            </Panel>
            <Separator className="w-px bg-cyan-300/20 hover:bg-cyan-300/50" />
            <Panel defaultSize={leftPanelSizes[2] ?? 72} minSize={38}>
              <div className="flex h-full flex-col rounded-tl-2xl border-l border-cyan-300/15 bg-slate-900/45 backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-cyan-300/15 bg-slate-950/35 pr-2">
                  <EditorTabs />
                  <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="rounded p-1.5 text-slate-300 hover:bg-slate-800/70 hover:text-cyan-200"
                    aria-label="toggle-sidebar"
                  >
                    {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                  </button>
                </div>
                <CodeEditor />
              </div>
            </Panel>
          </Group>
        </Panel>

        <Separator className="h-px bg-cyan-300/20 hover:bg-cyan-300/50" />
        <Panel
          collapsible
          collapsedSize={6}
          onCollapse={() => setBottomPanelCollapsed(true)}
          onExpand={() => setBottomPanelCollapsed(false)}
          defaultSize={mainPanelSizes[1] ?? 28}
          minSize={12}
          maxSize={45}
        >
          <div className="relative h-full border-t border-cyan-300/20">
            <button
              onClick={() => setBottomPanelCollapsed(!bottomPanelCollapsed)}
              className="absolute right-3 top-2 z-20 rounded bg-slate-900/80 p-1 text-cyan-200 hover:bg-slate-800"
              aria-label="toggle-bottom-panel"
            >
              {bottomPanelCollapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <BottomPanel />
          </div>
        </Panel>
      </Group>

      <StatusBar />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
