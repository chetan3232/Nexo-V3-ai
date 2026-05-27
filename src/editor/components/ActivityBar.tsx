import { motion } from 'framer-motion';
import {
  Files, Search, GitBranch, Bug, Blocks, Settings,
  Sparkles, UserCircle2,
} from 'lucide-react';

type ActivityItem = {
  icon: React.ElementType;
  label: string;
  id: string;
};

const topItems: ActivityItem[] = [
  { icon: Files,       label: 'Explorer',       id: 'explorer' },
  { icon: Search,      label: 'Search',          id: 'search' },
  { icon: GitBranch,   label: 'Source Control',  id: 'git' },
  { icon: Bug,         label: 'Run & Debug',     id: 'debug' },
  { icon: Blocks,      label: 'Extensions',      id: 'extensions' },
  { icon: Sparkles,    label: 'AI Tools',        id: 'ai' },
];

const bottomItems: ActivityItem[] = [
  { icon: UserCircle2, label: 'Account',  id: 'account' },
  { icon: Settings,    label: 'Settings', id: 'settings' },
];

type Props = {
  activeIndex: number;
  onSelect: (index: number) => void;
};

export function ActivityBar({ activeIndex, onSelect }: Props) {
  return (
    <aside
      style={{
        width: '48px',
        background: '#111827',
        borderRight: '1px solid #1f2937',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '0px',
        paddingBottom: '4px',
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, width: '100%' }}>
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
                height: '48px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: isActive ? '#e2e8f0' : '#6b7280',
                transition: 'color 120ms ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af';
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = '#6b7280';
              }}
            >
              {/* Active left border */}
              {isActive && (
                <motion.span
                  layoutId="activity-indicator"
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '2px',
                    height: '24px',
                    background: '#e2e8f0',
                    borderRadius: '0 2px 2px 0',
                  }}
                />
              )}
              <Icon size={22} strokeWidth={isActive ? 1.75 : 1.5} />
            </button>
          );
        })}
      </div>

      {/* Bottom icons */}
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
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
                height: '48px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#6b7280',
                transition: 'color 120ms ease',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#6b7280'; }}
            >
              <Icon size={22} strokeWidth={1.5} />
            </button>
          );
        })}
      </div>
    </aside>
  );
}
