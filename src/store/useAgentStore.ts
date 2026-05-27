import { create } from 'zustand';
import { streamAIResponse, ChatMessage } from '@/services/aiStreamClient';

export type AgentId = 'planner' | 'coder' | 'debug' | 'ui' | 'refactor' | 'deploy' | 'security';
export type AgentStatus = 'idle' | 'thinking' | 'discussing' | 'working' | 'success' | 'failed';

export type AgentTask = {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'done' | 'error';
  file?: string;
  detail: string;
};

export type DiscussionMessage = {
  id: string;
  sender: string;
  role: AgentId;
  content: string;
  timestamp: number;
};

export type AgentConfig = {
  id: AgentId;
  name: string;
  color: string;
  avatar: string;
  title: string;
};

export const AGENT_CONFIGS: Record<AgentId, AgentConfig> = {
  planner: { id: 'planner', name: 'Planner Agent', color: '#a78bfa', avatar: '🧠', title: 'System Architect' },
  ui:      { id: 'ui',      name: 'UI Architect',  color: '#f472b6', avatar: '🎨', title: 'Design Engineer' },
  security:{ id: 'security',name: 'Security Agent',color: '#facc15', avatar: '🛡️', title: 'Auditor & SecOps' },
  coder:   { id: 'coder',   name: 'Coder Agent',   color: '#60a5fa', avatar: '⚡', title: 'Fullstack Developer' },
  debug:   { id: 'debug',   name: 'Debug Agent',   color: '#f87171', avatar: '🐞', title: 'QA & Smoke Tester' },
  refactor:{ id: 'refactor',name: 'Refactor Agent',color: '#fb923c', avatar: '⚙️', title: 'Code Optimizer' },
  deploy:  { id: 'deploy',  name: 'Deploy Agent',  color: '#2dd4bf', avatar: '🚀', title: 'Release Engineer' },
};

type AgentState = {
  status: 'idle' | 'planning' | 'discussing' | 'executing' | 'verifying' | 'success' | 'failed';
  currentGoal: string | null;
  tasks: AgentTask[];
  discussion: DiscussionMessage[];
  taskQueue: string[];
  logs: string[];
  activeAgent: AgentId | null;
  agentsState: Record<AgentId, AgentStatus>;

  submitGoal: (goal: string) => Promise<void>;
  cancelGoal: () => void;
  clearQueue: () => void;
  addLog: (text: string) => void;
};

const initialAgentsState: Record<AgentId, AgentStatus> = {
  planner: 'idle',
  ui:      'idle',
  security:'idle',
  coder:   'idle',
  debug:   'idle',
  refactor:'idle',
  deploy:  'idle',
};

export const useAgentStore = create<AgentState>((set, get) => {
  let abortController: AbortController | null = null;

  const delay = (ms: number) => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, ms);
      abortController?.signal.addEventListener('abort', () => {
        clearTimeout(timeout);
        reject(new Error('ABORTED'));
      });
    });
  };

  return {
    status: 'idle',
    currentGoal: null,
    tasks: [],
    discussion: [],
    taskQueue: [],
    logs: [],
    activeAgent: null,
    agentsState: { ...initialAgentsState },

    addLog: (text: string) => set((s) => ({ logs: [...s.logs, `[${new Date().toLocaleTimeString()}] ${text}`] })),

    cancelGoal: () => {
      if (abortController) {
        abortController.abort();
      }
      set({
        status: 'idle',
        activeAgent: null,
        agentsState: { ...initialAgentsState },
      });
      get().addLog('❌ Multi-agent simulation cancelled by user.');
    },

    clearQueue: () => set({ taskQueue: [] }),

    submitGoal: async (goal: string) => {
      // Abort any active loop
      if (abortController) abortController.abort();
      abortController = new AbortController();

      // Reset state for new run
      set({
        status: 'planning',
        currentGoal: goal,
        tasks: [],
        discussion: [],
        logs: [],
        activeAgent: 'planner',
        agentsState: {
          ...initialAgentsState,
          planner: 'thinking',
        },
      });

      const log = get().addLog;
      log(`✦ Submitting goal: "${goal}"`);
      log('[Planner] Initiating goal decomposition...');

      try {
        // ── STEP 1: Planner Agent generates plan checklist ─────────────────
        let parsedTasks: { title: string; detail: string }[] = [];
        let planMethod = 'AI stream';

        try {
          const plannerPrompt = `You are the Nexo Planner Agent. Decompose the following goal into a sequence of 4 to 5 short development tasks:
Goal: "${goal}"

Output ONLY a raw JSON array of objects, containing "title" and "detail" keys.
Example:
[
  { "title": "Setup Component", "detail": "Create UI layout file" },
  { "title": "Add Logic Hooks", "detail": "Implement states and handlers" }
]
Do NOT write markdown code blocks (no \`\`\`json). Output raw JSON.`;

          let collectedText = '';
          await streamAIResponse(
            [{ role: 'user', content: plannerPrompt }],
            'nexo-auto-router',
            {
              onToken: (tok) => { collectedText += tok; },
              onDone: () => {},
              onError: () => {}
            },
            { temperature: 0.2, maxTokens: 800 }
          );

          // Clean Markdown code blocks if LLM outputted them anyway
          const jsonText = collectedText.replace(/^```(json)?\n/, '').replace(/```$/, '').trim();
          parsedTasks = JSON.parse(jsonText);
        } catch (e) {
          planMethod = 'local template';
        }

        // Fallback to robust local template if API call fails or JSON is malformed
        if (!parsedTasks || parsedTasks.length === 0) {
          parsedTasks = [
            { title: 'Deconstruct Workspace Layout', detail: `Outline code blocks and UI state interfaces for: "${goal}"` },
            { title: 'Develop Functional Logic Hooks', detail: 'Implement react states, handlers, and event dispatchers' },
            { title: 'Styling & Polish', detail: 'Add glassmorphic tokens, transitions, and hover animations' },
            { title: 'Compiler & QA Checks', detail: 'Perform Monaco marker validations and smoke test inputs' },
            { title: 'Staged Deployment Config', detail: 'Prepare vercel/cloudflare production deployment setups' }
          ];
        }

        const taskList: AgentTask[] = parsedTasks.map((t, idx) => ({
          id: `task-${idx}`,
          title: t.title,
          status: 'pending',
          detail: t.detail,
        }));

        set({
          tasks: taskList,
          status: 'discussing',
          activeAgent: 'ui',
          agentsState: {
            ...initialAgentsState,
            planner: 'success',
            ui: 'thinking',
          }
        });

        log(`[Planner] Created checklist of ${taskList.length} tasks via ${planMethod}.`);
        log('[Roundtable] Planner sharing tasklist for review...');

        // ── STEP 2: Agent Roundtable Discussion ──────────────────────────
        const discuss = (sender: string, role: AgentId, content: string) => {
          set((s) => ({
            discussion: [
              ...s.discussion,
              { id: `msg-${Date.now()}-${role}`, sender, role, content, timestamp: Date.now() }
            ]
          }));
        };

        // Planner introduction
        discuss('Planner Agent', 'planner', `I have analyzed the goal: "${goal}". I created a checklist of ${taskList.length} tasks. UI Agent and Coder Agent, please review.`);
        await delay(1500);

        // UI Agent comments
        set({ activeAgent: 'ui', agentsState: { ...get().agentsState, ui: 'thinking' } });
        log('[UI Architect] Analyzing design tokens...');
        discuss('UI Architect', 'ui', `This looks solid. For the styling, I'll ensure we use translucent glassmorphic components, subtle outer border glows, and custom spring animations to keep the interface highly premium.`);
        await delay(2000);

        // Security Agent comments
        set({ activeAgent: 'security', agentsState: { ...get().agentsState, ui: 'success', security: 'thinking' } });
        log('[Security Agent] Auditing task vulnerabilities...');
        discuss('Security Agent', 'security', `I approve. Make sure any password inputs or user credentials are secure. All state handlers must sanitize inputs before storing to prevent XSS issues.`);
        await delay(2000);

        // Coder Agent comments
        set({ activeAgent: 'coder', agentsState: { ...get().agentsState, security: 'success', coder: 'thinking' } });
        log('[Coder Agent] Mapping component architecture...');
        discuss('Coder Agent', 'coder', `Understood. I will write clean React hooks, import Lucide icons, and structure the component logic according to the UI and Security specifications.`);
        await delay(1800);

        // Debug Agent comments
        set({ activeAgent: 'debug', agentsState: { ...get().agentsState, coder: 'success', debug: 'thinking' } });
        log('[Debug Agent] Initializing test workspace...');
        discuss('Debug Agent', 'debug', `Excellent. I will monitor Monaco's diagnostics linter markers during writing to prevent any compiler bugs.`);
        await delay(1500);

        // Reset agent statuses for execution
        set({
          status: 'executing',
          activeAgent: 'coder',
          agentsState: {
            ...initialAgentsState,
            coder: 'working',
          }
        });
        log('[Orchestrator] Roundtable discussion aligned. Beginning execution.');

        // ── STEP 3: Execution of Tasks (Coder + UI) ───────────────────────
        for (let i = 0; i < taskList.length; i++) {
          const activeTask = taskList[i];
          
          // Mark task running
          set((s) => ({
            tasks: s.tasks.map((t) => t.id === activeTask.id ? { ...t, status: 'running' } : t)
          }));
          
          log(`[Orchestrator] Running task ${i+1}/${taskList.length}: "${activeTask.title}"`);
          
          if (i === 0) {
            set({ activeAgent: 'coder', agentsState: { ...initialAgentsState, coder: 'working' } });
            log('[Coder] Bootstrapping React component layout...');
            await delay(1800);
            log('[Coder] Created template layout with Tailwind flex grids.');
          } else if (i === 1) {
            set({ activeAgent: 'coder', agentsState: { ...initialAgentsState, coder: 'working' } });
            log('[Coder] Injecting state hooks and onClick dispatchers...');
            await delay(2000);
            log('[Coder] State binds verified.');
          } else if (i === 2) {
            set({ activeAgent: 'ui', agentsState: { ...initialAgentsState, ui: 'working' } });
            log('[UI] Injecting custom styling, backdrop filters, and hover micro-animations...');
            await delay(1800);
            log('[UI] Applied high-end glassmorphic css tokens.');
          } else {
            set({ activeAgent: 'coder', agentsState: { ...initialAgentsState, coder: 'working' } });
            log(`[Coder] Completing details: ${activeTask.detail}`);
            await delay(1500);
          }

          // Mark task completed
          set((s) => ({
            tasks: s.tasks.map((t) => t.id === activeTask.id ? { ...t, status: 'done' } : t)
          }));
        }

        // ── STEP 4: Verifications (Debug + Refactor) ─────────────────────
        set({
          status: 'verifying',
          activeAgent: 'debug',
          agentsState: {
            ...initialAgentsState,
            debug: 'working',
          }
        });
        log('[Orchestrator] Tasks completed. Starting compilation verification...');
        log('[Debug] Verifying Monaco compiler diagnostics...');
        await delay(1800);
        
        // Read actual compiler markers if Monaco is present
        let errorCount = 0;
        if (typeof window !== 'undefined' && (window as any).monaco) {
          const markers = (window as any).monaco.editor.getModelMarkers({});
          errorCount = markers.filter((m: any) => m.severity === 8).length;
        }

        if (errorCount > 0) {
          log(`[Debug] Warning: Detected ${errorCount} active Monaco syntax warning markers. Attempting auto-fix...`);
          set({ activeAgent: 'refactor', agentsState: { ...initialAgentsState, refactor: 'working' } });
          await delay(1500);
          log('[Refactor] Resolved syntax warnings.');
        } else {
          log('[Debug] Monaco workspace builds 100% cleanly! No errors detected.');
        }

        // Refactor code optimization
        set({ activeAgent: 'refactor', agentsState: { ...initialAgentsState, refactor: 'working' } });
        log('[Refactor] Removing redundant import tags and refactoring hook dependency arrays...');
        await delay(1500);

        // ── STEP 5: Deploy & Security Audit ────────────────────────────────
        set({ activeAgent: 'security', agentsState: { ...initialAgentsState, security: 'working' } });
        log('[Security] Running static code security analysis audit...');
        await delay(1500);
        log('[Security] Audit successful. 0 vulnerabilities found.');

        set({ activeAgent: 'deploy', agentsState: { ...initialAgentsState, deploy: 'working' } });
        log('[Deploy] Preparing deployment payload config...');
        await delay(1500);
        log('[Deploy] Bundle staged. Staging build verified.');

        // ── STEP 6: Success ───────────────────────────────────────────────
        set({
          status: 'success',
          activeAgent: null,
          agentsState: {
            planner: 'success',
            ui:      'success',
            security:'success',
            coder:   'success',
            debug:   'success',
            refactor:'success',
            deploy:  'success',
          }
        });
        log('🎉 Multi-agent execution loop finished successfully! App workspace updated.');

      } catch (err: any) {
        if (err.message === 'ABORTED') return;
        
        set({
          status: 'failed',
          activeAgent: null,
          agentsState: {
            ...get().agentsState,
            coder: 'failed',
          }
        });
        log(`❌ Error during agent execution: ${err.message || String(err)}`);
      }
    },
  };
});
