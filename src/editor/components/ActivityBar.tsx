import { motion } from 'framer-motion';
import {
  Files,
  Search,
  GitBranch,
  Bug,
  Package,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

type ActivityItem = {
  icon: React.ElementType;
  label: string;
  id: string;
};

const topItems: ActivityItem[] = [
  { icon: Files,       label: 'Explorer',   id: 'explorer' },
  { icon: Search,      label: 'Search',     id: 'search' },
  { icon: GitBranch,   label: 'Source Control', id: 'git' },
  { icon: Bug,         label: 'Run & Debug', id: 'debug' },
  { icon: Package,     label: 'Extensions', id: 'extensions' },
  { icon: Sparkles,    label: 'AI Tools',   id: 'ai' },
];

const bottomItems: ActivityItem[] = [
  { icon: Settings, label: 'Settings', id: 'settings' },
];

type Props = {
  activeIndex: number;
  onSelect: (index: number) => void;
};

export function ActivityBar({ activeIndex, onSelect }: Props) {
  return (
    <aside
      style={{
        width: 'var(--activity-bar-w)',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '4px',
        paddingBottom: '4px',
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      {/* Top icons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
        {topItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeIndex === index;
          return (
            <button
              key={item.id}
              id={`activity-bar-${item.id}`}
              onClick={() => onSelect(index)}
              title={item.label}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '44px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                transition: 'color 120ms ease',
              }}
              className={`group relative ${isActive ? '' : 'hover:!text-[color:var(--text-secondary)]'}`}
            >
              {/* Active left indicator */}
              {isActive && (
                <motion.span
                  layoutId="activity-indicator"
                  className="activity-indicator"
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '2px',
                    height: '22px',
                    background: 'var(--accent)',
                    borderRadius: '0 2px 2px 0',
                  }}
                />
              )}
              <Icon size={20} strokeWidth={isActive ? 2 : 1.75} />
            </button>
          );
        })}
      </div>

      {/* Bottom icons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {bottomItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              title={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '44px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                transition: 'color 120ms ease',
              }}
            >
              <Icon size={20} strokeWidth={1.75} />
            </button>
          );
        })}
      </div>
    </aside>
  );
}
