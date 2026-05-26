import { motion } from 'framer-motion';

const snippet = `export async function planAndExecute(task: string) {
  const context = await memory.load(task);
  const plan = await agents.planner.create({ task, context });

  for (const step of plan.steps) {
    const output = await runtime.execute(step);
    await memory.commit(step.id, output);
  }

  return plan.summary();
}`;

export function EditorPane() {
  return (
    <div className="relative h-full overflow-hidden bg-slate-950/80">
      <motion.div
        animate={{ opacity: [0.35, 0.7, 0.35] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute right-4 top-4 rounded-full border border-cyan-300/40 bg-cyan-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200"
      >
        AI Thinking
      </motion.div>
      <pre className="h-full overflow-auto p-6 font-mono text-sm leading-7 text-slate-200">
        <code>{snippet}</code>
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="ml-1 inline-block h-5 w-2 bg-cyan-300 align-middle"
        />
      </pre>
    </div>
  );
}
