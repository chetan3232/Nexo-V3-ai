import { create } from 'zustand';
import { streamAIResponse, ChatMessage } from '@/services/aiStreamClient';
import { readWorkspaceFile, writeWorkspaceFile } from '@/services/fileSystemClient';
import { runSandboxCommand } from '@/services/sandboxClient';
import { formatContextForPrompt } from '@/ai/contextInjection';
import { useProjectBrainStore } from '@/store/useProjectBrainStore';
import { useCtoStore } from '@/store/useCtoStore';

// ── Types ──────────────────────────────────────────────────────────────────
export type DreamLogEntry = {
  id: string;
  timestamp: number;
  agent: string;
  action: 'plan' | 'code' | 'test' | 'fix' | 'commit' | 'cto' | 'info' | 'error';
  detail: string;
  file?: string;
  status: 'success' | 'failed' | 'info' | 'pending';
};

export type DreamStatus = 'idle' | 'dreaming' | 'complete' | 'failed' | 'cancelled';

type DreamState = {
  isDreamMode: boolean;
  dreamGoal: string;
  dreamStatus: DreamStatus;
  dreamProgress: { completed: number; total: number; currentTask: string; };
  dreamLog: DreamLogEntry[];
  dreamBranch: string;
  dreamStartTime: number | null;
  dreamEndTime: number | null;
  filesCreated: string[];
  filesModified: string[];

  toggleDreamMode: () => void;
  startDream: (goal: string) => Promise<void>;
  cancelDream: () => void;
  resetDream: () => void;
};

const API_BASE = (import.meta as any).env?.VITE_NEXO_API_URL ?? 'http://localhost:8787';

export const useDreamStore = create<DreamState>((set, get) => {
  let abortController: AbortController | null = null;

  const addLog = (agent: string, action: DreamLogEntry['action'], detail: string, status: DreamLogEntry['status'] = 'info', file?: string) => {
    set((s) => ({
      dreamLog: [...s.dreamLog, {
        id: `dream-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: Date.now(),
        agent, action, detail, status, file,
      }],
    }));
  };

  const delay = (ms: number) => {
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(resolve, ms);
      abortController?.signal.addEventListener('abort', () => {
        clearTimeout(timeout);
        reject(new Error('DREAM_CANCELLED'));
      });
    });
  };

  return {
    isDreamMode: false,
    dreamGoal: '',
    dreamStatus: 'idle',
    dreamProgress: { completed: 0, total: 0, currentTask: '' },
    dreamLog: [],
    dreamBranch: '',
    dreamStartTime: null,
    dreamEndTime: null,
    filesCreated: [],
    filesModified: [],

    toggleDreamMode: () => set((s) => ({ isDreamMode: !s.isDreamMode })),

    resetDream: () => set({
      dreamGoal: '',
      dreamStatus: 'idle',
      dreamProgress: { completed: 0, total: 0, currentTask: '' },
      dreamLog: [],
      dreamBranch: '',
      dreamStartTime: null,
      dreamEndTime: null,
      filesCreated: [],
      filesModified: [],
    }),

    cancelDream: () => {
      if (abortController) abortController.abort();
      addLog('System', 'info', 'Dream Mode cancelled by user.', 'failed');
      set({ dreamStatus: 'cancelled', dreamEndTime: Date.now() });
    },

    startDream: async (goal: string) => {
      if (abortController) abortController.abort();
      abortController = new AbortController();

      const branchName = `dream/${goal.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}-${Date.now().toString(36)}`;

      set({
        dreamGoal: goal,
        dreamStatus: 'dreaming',
        dreamProgress: { completed: 0, total: 0, currentTask: 'Initializing Dream Mode...' },
        dreamLog: [],
        dreamBranch: branchName,
        dreamStartTime: Date.now(),
        dreamEndTime: null,
        filesCreated: [],
        filesModified: [],
      });

      const brainContext = useProjectBrainStore.getState().getBrainContext();
      const workspaceContext = formatContextForPrompt();

      try {
        // ── PHASE 1: Create Git Branch ──
        addLog('System', 'info', `Creating safe dream branch: ${branchName}`, 'pending');
        set({ dreamProgress: { completed: 0, total: 0, currentTask: 'Creating dream branch...' } });

        try {
          await runSandboxCommand(`git checkout -b ${branchName}`);
          addLog('Git', 'commit', `Branch "${branchName}" created successfully`, 'success');
        } catch {
          addLog('Git', 'info', 'Git branch creation skipped (may not be a git repo)', 'info');
        }

        await delay(500);

        // ── PHASE 2: Extended Planning (15-20 tasks) ──
        addLog('Planner', 'plan', 'Decomposing dream goal into extended task list...', 'pending');
        set({ dreamProgress: { completed: 0, total: 0, currentTask: 'AI Planner creating task list...' } });

        const plannerPrompt = `You are the NEXO Dream Mode Planner. This is an AUTONOMOUS mode where the user is away and we must build a COMPLETE solution.

Goal: "${goal}"

Project context:
${brainContext || 'No brain scan available.'}

Workspace context:
${workspaceContext}

Create a comprehensive task list of 8-15 development tasks to fully implement this goal.
Each task should be specific, actionable, and result in a real file being created or modified.

Output ONLY a raw JSON array (no markdown code blocks):
[
  { "title": "<task title>", "detail": "<what to do>", "file": "<relative file path>", "action": "create|modify", "dependencies": [] }
]

Be thorough — this is Dream Mode. The user expects to wake up to a complete implementation.`;

        let collectedText = '';
        await streamAIResponse(
          [{ role: 'user', content: plannerPrompt }],
          'nexo-auto-router',
          {
            onToken: (tok) => { collectedText += tok; },
            onDone: () => {},
            onError: () => {},
          },
          { temperature: 0.3, maxTokens: 2000 }
        );

        let parsedTasks: any[] = [];
        try {
          const jsonText = collectedText.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '').trim();
          parsedTasks = JSON.parse(jsonText);
        } catch {
          // Try to extract JSON array from response
          const jsonMatch = collectedText.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            parsedTasks = JSON.parse(jsonMatch[0]);
          }
        }

        if (!parsedTasks || parsedTasks.length === 0) {
          // Fallback tasks
          parsedTasks = [
            { title: 'Create main component', detail: `Create the primary component for: ${goal}`, file: 'src/components/DreamComponent.tsx', action: 'create' },
            { title: 'Add styles', detail: 'Add styling for the component', file: 'src/components/DreamComponent.css', action: 'create' },
            { title: 'Wire up routing', detail: 'Add the new component to routing', file: 'src/App.tsx', action: 'modify' },
          ];
        }

        addLog('Planner', 'plan', `Created ${parsedTasks.length} tasks for dream execution`, 'success');
        set({ dreamProgress: { completed: 0, total: parsedTasks.length, currentTask: 'Starting execution...' } });

        await delay(500);

        // ── PHASE 3: Execute Each Task Autonomously ──
        const createdFiles: string[] = [];
        const modifiedFiles: string[] = [];

        for (let i = 0; i < parsedTasks.length; i++) {
          const task = parsedTasks[i];
          
          // Check if cancelled
          if (abortController?.signal.aborted) throw new Error('DREAM_CANCELLED');

          set({
            dreamProgress: {
              completed: i,
              total: parsedTasks.length,
              currentTask: task.title,
            },
          });

          addLog('Coder', 'code', `Task ${i + 1}/${parsedTasks.length}: ${task.title}`, 'pending', task.file);

          if (task.file && (task.action === 'create' || task.action === 'modify')) {
            // Read existing file if modifying
            let originalContent = '';
            if (task.action === 'modify') {
              try {
                const res = await readWorkspaceFile(task.file);
                originalContent = res.content;
              } catch { /* file doesn't exist yet */ }
            }

            // Generate code
            const coderPrompt = `You are the NEXO Dream Coder Agent working autonomously.
Goal: "${goal}"
Task: "${task.title}"
Details: "${task.detail}"
Target File: "${task.file}"
Action: ${task.action}

Project Brain:
${brainContext || 'No brain context.'}

Current file content (if modifying):
\`\`\`
${originalContent}
\`\`\`

Generate the COMPLETE file contents for "${task.file}".
Output ONLY the raw file contents. Do NOT wrap in markdown code blocks.
Make sure the code is production-quality, well-typed, and follows the project's conventions.`;

            let codeResponse = '';
            try {
              await streamAIResponse(
                [{ role: 'user', content: coderPrompt }],
                'nexo-auto-router',
                {
                  onToken: (tok) => { codeResponse += tok; },
                  onDone: () => {},
                  onError: () => {},
                },
                { temperature: 0.3 }
              );

              // Clean markdown blocks
              let finalCode = codeResponse.trim();
              if (finalCode.startsWith('```')) {
                finalCode = finalCode.replace(/^```[a-zA-Z0-9-]*\n?/, '').replace(/\n?```$/, '').trim();
              }

              // Write file (no approval needed in Dream Mode)
              await writeWorkspaceFile(task.file, finalCode);

              if (task.action === 'create') {
                createdFiles.push(task.file);
              } else {
                modifiedFiles.push(task.file);
              }

              addLog('Coder', 'code', `Successfully wrote: ${task.file}`, 'success', task.file);

              // Auto-commit after each file
              try {
                await runSandboxCommand(`git add "${task.file}" && git commit -m "dream: ${task.title}"`);
                addLog('Git', 'commit', `Committed: ${task.title}`, 'success');
              } catch {
                // Git commit optional
              }

            } catch (err: any) {
              addLog('Coder', 'error', `Failed to generate code for ${task.file}: ${err.message}`, 'failed', task.file);
              // Continue to next task instead of failing entire dream
            }
          } else {
            addLog('Coder', 'info', `Executing: ${task.detail}`, 'info');
          }

          await delay(300);
        }

        set({
          filesCreated: createdFiles,
          filesModified: modifiedFiles,
          dreamProgress: { completed: parsedTasks.length, total: parsedTasks.length, currentTask: 'Running verification...' },
        });

        // ── PHASE 4: Self-Healing Check ──
        addLog('Debug', 'test', 'Running type check: npx tsc --noEmit', 'pending');

        try {
          const checkRes = await runSandboxCommand('npx tsc --noEmit');
          if (checkRes.result.status === 'success') {
            addLog('Debug', 'test', 'Type check passed with 0 errors!', 'success');
          } else {
            addLog('Debug', 'test', `Type check found issues. Attempting self-heal...`, 'failed');

            // One round of self-healing on the last created file
            if (createdFiles.length > 0) {
              const healTarget = createdFiles[createdFiles.length - 1];
              addLog('Refactor', 'fix', `Auto-fixing: ${healTarget}`, 'pending');

              try {
                const fileRes = await readWorkspaceFile(healTarget);
                const healPrompt = `Fix all TypeScript compilation errors in this file.
File: ${healTarget}
Errors: ${checkRes.logs.slice(0, 500)}
Current contents:
\`\`\`
${fileRes.content}
\`\`\`
Output ONLY the corrected file contents. No markdown blocks.`;

                let healCode = '';
                await streamAIResponse(
                  [{ role: 'user', content: healPrompt }],
                  'nexo-auto-router',
                  {
                    onToken: (tok) => { healCode += tok; },
                    onDone: () => {},
                    onError: () => {},
                  },
                  { temperature: 0.2 }
                );

                let cleanCode = healCode.trim();
                if (cleanCode.startsWith('```')) {
                  cleanCode = cleanCode.replace(/^```[a-zA-Z0-9-]*\n?/, '').replace(/\n?```$/, '').trim();
                }

                await writeWorkspaceFile(healTarget, cleanCode);
                addLog('Refactor', 'fix', `Self-heal applied to ${healTarget}`, 'success');

                await runSandboxCommand(`git add "${healTarget}" && git commit -m "dream: self-heal ${healTarget}"`).catch(() => {});
              } catch {
                addLog('Refactor', 'error', 'Self-heal attempt failed', 'failed');
              }
            }
          }
        } catch {
          addLog('Debug', 'info', 'Type check skipped (tsc not available)', 'info');
        }

        // ── PHASE 5: CTO Analysis ──
        addLog('CTO', 'cto', 'Running CTO analysis on dream output...', 'pending');
        set({ dreamProgress: { completed: parsedTasks.length, total: parsedTasks.length, currentTask: 'CTO Analysis...' } });

        try {
          // Read one of the generated files for CTO analysis
          const mainFile = createdFiles[0] || modifiedFiles[0];
          if (mainFile) {
            const mainFileRes = await readWorkspaceFile(mainFile);
            await useCtoStore.getState().runCtoAnalysis(goal, mainFileRes.content, mainFile);
            addLog('CTO', 'cto', 'CTO analysis complete — check report card', 'success');
          }
        } catch {
          addLog('CTO', 'info', 'CTO analysis skipped', 'info');
        }

        // ── PHASE 6: Dream Complete ──
        addLog('System', 'info', `🎉 Dream Mode complete! Created ${createdFiles.length} files, modified ${modifiedFiles.length} files.`, 'success');

        set({
          dreamStatus: 'complete',
          dreamEndTime: Date.now(),
          dreamProgress: { completed: parsedTasks.length, total: parsedTasks.length, currentTask: 'Dream Complete!' },
        });

      } catch (err: any) {
        if (err.message === 'DREAM_CANCELLED') return;

        addLog('System', 'error', `Dream failed: ${err.message}`, 'failed');
        set({
          dreamStatus: 'failed',
          dreamEndTime: Date.now(),
        });
      }
    },
  };
});
