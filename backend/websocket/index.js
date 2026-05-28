import { WebSocketServer } from 'ws';
import { streamTokens } from '../ai/index.js';
import { AutonomousAgent } from '../agents/index.js';
import { SandboxRuntime } from '../runtime/index.js';
import { TerminalSession } from '../terminal/index.js';
import os from 'node:os';

// CPU and Memory metrics calculation
let lastCpuUsage = process.cpuUsage();
let lastTime = Date.now();

function getCpuPercent() {
  const curCpuUsage = process.cpuUsage();
  const curTime = Date.now();
  const timeDiff = curTime - lastTime;
  const userDiff = curCpuUsage.user - lastCpuUsage.user;
  const sysDiff = curCpuUsage.system - lastCpuUsage.system;
  
  lastCpuUsage = curCpuUsage;
  lastTime = curTime;

  const totalDiff = (userDiff + sysDiff) / 1000; // in ms
  const numCpus = os.cpus().length || 1;
  const cpuPercent = Math.min(100, Math.max(0, (totalDiff / (timeDiff || 1)) * 100 / numCpus));
  return parseFloat(cpuPercent.toFixed(1));
}

function getMemoryMetrics() {
  const mem = process.memoryUsage();
  const totalSystem = os.totalmem();
  const freeSystem = os.freemem();
  
  return {
    rss: mem.rss,
    heapUsed: mem.heapUsed,
    heapTotal: mem.heapTotal,
    systemUsed: totalSystem - freeSystem,
    systemTotal: totalSystem,
    systemPercent: parseFloat(((totalSystem - freeSystem) / totalSystem * 100).toFixed(1))
  };
}


export function initializeWebSocketGateway(server, workspaceRoot, processManager) {
  const wss = new WebSocketServer({ server, path: '/api/ws' });
  const sandbox = new SandboxRuntime(workspaceRoot);

  wss.on('connection', (socket) => {
    console.log('[WebSocket] Gateway client connected.');

    // State trackers for terminal sessions
    let terminalSession = null;
    let agent = null;

    const pendingPermissions = new Map();

    const requestPermission = (action, details) => {
      return new Promise((resolve) => {
        const reqId = 'req-' + Math.random().toString(36).substring(2, 9);
        pendingPermissions.set(reqId, resolve);
        socket.send(JSON.stringify({
          type: 'permission_request',
          reqId,
          action,
          details
        }));
      });
    };

    // Performance pulse broadcast
    const pulseInterval = setInterval(() => {
      try {
        if (socket.readyState === socket.OPEN) {
          socket.send(JSON.stringify({
            type: 'performance_pulse',
            cpu: getCpuPercent(),
            memory: getMemoryMetrics(),
            timestamp: Date.now()
          }));
        }
      } catch (e) {
        // ignore
      }
    }, 2000);

    socket.on('message', async (raw) => {
      try {
        const payload = JSON.parse(String(raw));
        const { type } = payload;

        switch (type) {
          // 0. PERMISSION RESPONSE HANDLER
          case 'permission_response': {
            const { reqId, approved } = payload;
            if (pendingPermissions.has(reqId)) {
              const resolver = pendingPermissions.get(reqId);
              resolver(approved);
              pendingPermissions.delete(reqId);
            }
            break;
          }

          // 1. AI TOKEN STREAMING
          case 'ai_chat': {
            const { prompt } = payload;
            socket.send(JSON.stringify({ type: 'ai_status', status: 'generating' }));

            const synthetic = [
              `[NEXO WebSocket Stream Gateway online]`,
              `Received prompt: "${prompt}"`,
              `Building code architecture in sandbox container...`,
              `=== CODE PROPOSAL ===`,
              `\`\`\`tsx filename="src/App.tsx"`,
              `export default function App() {`,
              `  return (`,
              `    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-cyan-400">`,
              `      <h1 className="text-4xl font-extrabold tracking-widest uppercase animate-pulse">`,
              `        Nexo Workspace Live`,
              `      </h1>`,
              `    </div>`,
              `  );`,
              `}`,
              `\`\`\``
            ].join('\n');

            for await (const token of streamTokens(synthetic)) {
              socket.send(JSON.stringify({ type: 'ai_token', token }));
            }
            socket.send(JSON.stringify({ type: 'ai_done' }));
            break;
          }

          // 2. VIRTUAL TERMINAL SHELL PROXY
          case 'terminal_start': {
            if (terminalSession) terminalSession.kill();
            
            terminalSession = new TerminalSession(
              'ws-term-1',
              workspaceRoot,
              (data) => {
                socket.send(JSON.stringify({ type: 'terminal_data', data }));
              }
            );
            terminalSession.start();
            break;
          }

          case 'terminal_input': {
            if (terminalSession) {
              terminalSession.write(payload.data);
            } else {
              socket.send(JSON.stringify({ type: 'terminal_data', data: '\r\n[Error: Terminal session not active. Send "terminal_start" first]\r\n' }));
            }
            break;
          }

          // 3. AUTONOMOUS AGENT ORCHESTRATION LOOP
          case 'agent_start': {
            const { goal } = payload;
            agent = new AutonomousAgent('project-ws-1');
            await agent.setGoal(goal);

            for await (const state of agent.executeStep()) {
              socket.send(JSON.stringify(state));
            }
            break;
          }

          // 4. SECURE SANDBOX RUNTIME COMMANDS
          case 'sandbox_run': {
            const { command } = payload;
            socket.send(JSON.stringify({ type: 'sandbox_log', data: `[Security] Checking permissions for command: "${command}"...\r\n` }));

            const approved = await requestPermission('sandbox_run', { command });
            if (!approved) {
              socket.send(JSON.stringify({ type: 'sandbox_log', data: `[Security] Execution denied by client.\r\n` }));
              socket.send(JSON.stringify({ type: 'sandbox_result', result: { code: -1, error: 'Permission denied' } }));
              break;
            }

            socket.send(JSON.stringify({ type: 'sandbox_log', data: `[sandbox] preparing isolated container runner...\r\n` }));

            const result = await sandbox.runCommand(command, (log) => {
              socket.send(JSON.stringify({ type: 'sandbox_log', data: `${log}\r\n` }));
            });

            socket.send(JSON.stringify({ type: 'sandbox_result', result }));
            break;
          }


          // 5. RUNTIME PROCESS MANAGER
          case 'runtime_list': {
            socket.send(JSON.stringify({ type: 'runtime_processes', processes: processManager.getProcessList() }));
            break;
          }
          case 'runtime_start': {
            const { id } = payload;
            socket.send(JSON.stringify({ type: 'runtime_log', id, data: `[Security] Checking permissions to start process "${id}"...\n` }));

            const approved = await requestPermission('runtime_start', { processId: id });
            if (!approved) {
              socket.send(JSON.stringify({ type: 'runtime_log', id, data: `[Security] Process activation blocked by client.\n` }));
              socket.send(JSON.stringify({ type: 'runtime_status', id, status: 'idle' }));
              break;
            }

            socket.send(JSON.stringify({ type: 'runtime_log', id, data: `[WebSocket] Starting process ${id}...\n` }));
            
            void processManager.startProcess(id, (log) => {
              socket.send(JSON.stringify({ type: 'runtime_log', id, data: log }));
            }).then(() => {
              socket.send(JSON.stringify({ type: 'runtime_status', id, status: 'active' }));
            }).catch((err) => {
              socket.send(JSON.stringify({ type: 'runtime_status', id, status: 'error' }));
            });
            
            socket.send(JSON.stringify({ type: 'runtime_status', id, status: 'booting' }));
            break;
          }

          case 'runtime_stop': {
            const { id } = payload;
            processManager.stopProcess(id);
            socket.send(JSON.stringify({ type: 'runtime_status', id, status: 'idle' }));
            socket.send(JSON.stringify({ type: 'runtime_log', id, data: `[WebSocket] Process ${id} stopped.\n` }));
            break;
          }
          case 'runtime_restart': {
            const { id } = payload;
            socket.send(JSON.stringify({ type: 'runtime_status', id, status: 'booting' }));
            void processManager.restartProcess(id, (log) => {
              socket.send(JSON.stringify({ type: 'runtime_log', id, data: log }));
            }).then(() => {
              socket.send(JSON.stringify({ type: 'runtime_status', id, status: 'active' }));
            }).catch(() => {
              socket.send(JSON.stringify({ type: 'runtime_status', id, status: 'error' }));
            });
            break;
          }

          default:
            socket.send(JSON.stringify({ type: 'error', message: `Unknown websocket gateway action: ${type}` }));
        }
      } catch (err) {
        socket.send(JSON.stringify({ type: 'error', message: err.message }));
      }
    });

    socket.on('close', () => {
      console.log('[WebSocket] Gateway client disconnected.');
      clearInterval(pulseInterval);
      pendingPermissions.forEach((resolve) => resolve(false));
      pendingPermissions.clear();
      if (terminalSession) {
        terminalSession.kill();
      }
    });

  });

  return wss;
}
