import { AnimatePresence, motion } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

type ShortcutItem = {
  keys: string;
  description: string;
};

type ShortcutGroup = {
  title: string;
  items: ShortcutItem[];
};

export function ShortcutsModal({ isOpen, onClose }: Props) {
  const shortcutGroups: ShortcutGroup[] = [
    {
      title: 'Navigation & File Operations',
      items: [
        { keys: 'Ctrl + P', description: 'Open Command Palette' },
        { keys: 'Ctrl + N', description: 'Create Untitled Code Tab' },
        { keys: 'Ctrl + O', description: 'Open Folder / Select Workspace' },
        { keys: 'Ctrl + S', description: 'Save Active File' },
        { keys: 'Ctrl + Shift + S', description: 'Save All Modified Tabs' },
      ],
    },
    {
      title: 'IDE Views & Layout Toggles',
      items: [
        { keys: 'Ctrl + B', description: 'Toggle Sidebar Panel' },
        { keys: 'Ctrl + J', description: 'Toggle Terminal Bottom Drawer' },
        { keys: 'Ctrl + Shift + A', description: 'Toggle AI Assistant Sidebar' },
      ],
    },
    {
      title: 'Smart AI Tools',
      items: [
        { keys: 'Ctrl + I', description: 'Open AI Spotlight Global Input' },
      ],
    },
    {
      title: 'Cloud Projects & Workspace Sync',
      items: [
        { keys: 'Ctrl + Shift + U', description: 'Toggle Cloud Projects & Sync' },
      ],
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(3, 7, 18, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px',
        }}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              width: '100%',
              maxWidth: '560px',
              background: '#0d1117',
              border: '1px solid #1f2937',
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              borderBottom: '1px solid #1f2937',
              background: '#111827',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Keyboard size={16} color="#06b6d4" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0', letterSpacing: '0.04em' }}>
                  KEYBOARD WORKFLOW SHORTCUTS
                </span>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 120ms, background 120ms',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = '#e2e8f0';
                  (e.currentTarget as HTMLButtonElement).style.background = '#1f2937';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = '#6b7280';
                  (e.currentTarget as HTMLButtonElement).style.background = 'none';
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Content list */}
            <div style={{
              padding: '16px 20px',
              overflowY: 'auto',
              maxHeight: '420px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}>
              {shortcutGroups.map((group) => (
                <div key={group.title}>
                  <h4 style={{
                    fontSize: '9.5px',
                    fontWeight: 800,
                    color: '#06b6d4',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '8px',
                  }}>
                    {group.title}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {group.items.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          background: 'rgba(255,255,255,0.01)',
                          border: '1px solid rgba(255,255,255,0.02)',
                        }}
                      >
                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                          {item.description}
                        </span>
                        <kbd style={{
                          background: '#111827',
                          border: '1px solid #1f2937',
                          borderRadius: '5px',
                          padding: '2px 8px',
                          fontSize: '10.5px',
                          fontFamily: 'monospace',
                          color: '#e2e8f0',
                          boxShadow: '0 2px 0 rgba(0,0,0,0.5)',
                        }}>
                          {item.keys}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{
              padding: '10px 20px',
              borderTop: '1px solid #1f2937',
              background: '#0d1117',
              display: 'flex',
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={onClose}
                style={{
                  background: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '5px',
                  color: '#e2e8f0',
                  padding: '5px 16px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 120ms',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#2d3748'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#1f2937'; }}
              >
                Got It
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
