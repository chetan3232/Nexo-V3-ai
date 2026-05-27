import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertOctagon, Info, X } from 'lucide-react';
import { useNotificationStore } from '@/store/useNotificationStore';

export function NotificationToasts() {
  const { toasts, dismissToast } = useNotificationStore();

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '48px',
        right: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const colorMap = {
            success: { text: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)', Icon: CheckCircle2 },
            error: { text: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', Icon: AlertOctagon },
            info: { text: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', Icon: Info },
          };
          const config = colorMap[toast.type] ?? colorMap.info;
          const Icon = config.Icon;

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(17, 24, 39, 0.85)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
                color: '#e2e8f0',
                fontSize: '12.5px',
                minWidth: '240px',
                maxWidth: '380px',
              }}
            >
              {/* Type Icon Indicator */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  background: config.bg,
                  color: config.text,
                  flexShrink: 0,
                }}
              >
                <Icon size={14} />
              </div>

              {/* Message */}
              <span style={{ flex: 1, lineHeight: '1.4' }}>{toast.message}</span>

              {/* Close Button */}
              <button
                onClick={() => dismissToast(toast.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4b5563',
                  cursor: 'pointer',
                  padding: '2px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 100ms, background 100ms',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = '#e2e8f0';
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = '#4b5563';
                  (e.currentTarget as HTMLButtonElement).style.background = 'none';
                }}
              >
                <X size={13} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
