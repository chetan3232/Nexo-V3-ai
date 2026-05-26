import { AnimatePresence, motion } from 'framer-motion';
import { Command } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
};

const commands = ['Open Agent Marketplace', 'Create New Workspace', 'Run Full Build', 'Toggle Terminal'];

export function CommandPalette({ open, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/60 pt-24 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-cyan-300/30 bg-slate-900/95 shadow-[0_0_50px_rgba(34,211,238,0.22)]"
          >
            <div className="flex items-center gap-2 border-b border-cyan-300/20 px-4 py-3 text-slate-200">
              <Command className="h-4 w-4 text-cyan-300" />
              <input
                autoFocus
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
                placeholder="Type a command or search modules..."
              />
            </div>
            <ul className="p-2">
              {commands.map((item) => (
                <li key={item} className="rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-cyan-500/10 hover:text-cyan-100">
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
