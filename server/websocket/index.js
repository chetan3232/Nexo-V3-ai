import { WebSocketServer } from 'ws';
import { streamTokens } from '../ai/index.js';
import { AutonomousAgent } from '../agents/index.js';
import { SandboxRuntime } from '../runtime/index.js';
import { TerminalSession } from '../terminal/index.js';

export function initializeWebSocketGateway(server, workspaceRoot) {
  const wss = new WebSocketServer({ server, path: '/api/ws' });
  const sandbox = new SandboxRuntime(workspaceRoot);

  wss.on('connection', (socket) => {
    console.log('[WebSocket] Gateway client connected.');

    // State trackers for terminal sessions
    let terminalSession = null;
    let agent = null;

    socket.on('message', async (raw) => {
      try {
        const payload = JSON.parse(String(raw));
        const { type } = payload;

        switch (type) {
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
            socket.send(JSON.stringify({ type: 'sandbox_log', data: `[sandbox] preparing isolated container runner...\r\n` }));

            const result = await sandbox.runCommand(command, (log) => {
              socket.send(JSON.stringify({ type: 'sandbox_log', data: `${log}\r\n` }));
            });

            socket.send(JSON.stringify({ type: 'sandbox_result', result }));
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
      if (terminalSession) {
        terminalSession.kill();
      }
    });
  });

  return wss;
}
