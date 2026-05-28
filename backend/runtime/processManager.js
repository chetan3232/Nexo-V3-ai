import { spawn } from 'node:child_process';
import path from 'node:path';
import { SandboxRuntime } from './index.js';

export class ProcessManager {
  constructor(workspaceRoot) {
    this.workspaceRoot = path.resolve(workspaceRoot);
    this.processes = new Map();
    this.sandbox = new SandboxRuntime(workspaceRoot);
    
    // Initialize default processes for common templates
    this.initializeDefaultProcesses();
  }

  initializeDefaultProcesses() {
    // Default runtime definitions
    const defaults = [
      { id: 'node-server', name: 'Node.js Server', command: 'node server.js', runtime: 'node', port: 8080 },
      { id: 'react-dev', name: 'React App (Vite)', command: 'npm run dev', runtime: 'react', port: 5173 },
      { id: 'nextjs-dev', name: 'Next.js App', command: 'npm run dev', runtime: 'nextjs', port: 3000 },
      { id: 'python-app', name: 'Python Web App', command: 'python main.py', runtime: 'python', port: 8000 }
    ];

    defaults.forEach(p => {
      this.processes.set(p.id, {
        ...p,
        status: 'idle',
        logs: '',
        child: null
      });
    });
  }

  // Retrieve process details without child reference (JSON-serializable)
  getProcessList() {
    return Array.from(this.processes.values()).map(({ id, name, command, runtime, port, status, logs }) => ({
      id, name, command, runtime, port, status, logs
    }));
  }

  getProcess(id) {
    const p = this.processes.get(id);
    if (!p) return null;
    const { name, command, runtime, port, status, logs } = p;
    return { id, name, command, runtime, port, status, logs };
  }

  async startProcess(id, onLog) {
    const proc = this.processes.get(id);
    if (!proc) throw new Error(`Process ${id} not found`);
    if (proc.status === 'active' || proc.status === 'booting') return;

    proc.status = 'booting';
    proc.logs = '';
    
    const hasDocker = await this.sandbox.checkDockerAvailability();

    return new Promise((resolve, reject) => {
      const appendLog = (data) => {
        proc.logs = (proc.logs + data).slice(-10000); // keep last 10k characters
        if (onLog) onLog(data);
      };

      appendLog(`[runtime] Booting process "${proc.name}"...\n`);
      appendLog(`[runtime] Environment: ${hasDocker ? 'Docker Container (secure)' : 'Local Host Subprocess'}\n`);

      let child;
      if (hasDocker) {
        // Map ports properly for web previews to connect
        const dockerArgs = [
          'run', '--rm',
          '-v', `${this.workspaceRoot}:/app`,
          '-w', '/app',
          ...(proc.port ? ['-p', `${proc.port}:${proc.port}`] : []),
          'node:18-alpine',
          'sh', '-c', proc.command
        ];
        appendLog(`[runtime] Executing: docker run --rm -v ... -p ${proc.port}:${proc.port} node:18-alpine sh -c "${proc.command}"\n`);
        child = spawn('docker', dockerArgs);
      } else {
        // Fallback locally
        const shell = process.platform === 'win32' ? 'cmd.exe' : 'sh';
        const shellArgs = process.platform === 'win32' ? ['/c', proc.command] : ['-c', proc.command];
        appendLog(`[runtime] Executing: ${proc.command}\n`);
        child = spawn(shell, shellArgs, {
          cwd: this.workspaceRoot,
          env: { ...process.env, NODE_ENV: 'development' }
        });
      }

      proc.child = child;

      // Track startup success (active) after first logs/timeout
      const startupTimer = setTimeout(() => {
        if (proc.status === 'booting') {
          proc.status = 'active';
          resolve();
        }
      }, 2000);

      child.stdout.on('data', (data) => {
        appendLog(data.toString());
      });

      child.stderr.on('data', (data) => {
        appendLog(`[error] ${data.toString()}`);
      });

      child.on('error', (err) => {
        clearTimeout(startupTimer);
        proc.status = 'error';
        proc.child = null;
        appendLog(`[error] Failed to start: ${err.message}\n`);
        reject(err);
      });

      child.on('close', (code) => {
        clearTimeout(startupTimer);
        proc.status = 'idle';
        proc.child = null;
        appendLog(`[runtime] Process "${proc.name}" exited with code ${code}\n`);
      });
    });
  }

  stopProcess(id) {
    const proc = this.processes.get(id);
    if (!proc) throw new Error(`Process ${id} not found`);
    if (!proc.child) return;

    proc.logs += `[runtime] Stopping process "${proc.name}"...\n`;
    proc.child.kill();
    proc.child = null;
    proc.status = 'idle';
  }

  async restartProcess(id, onLog) {
    this.stopProcess(id);
    // Short delay for clean sockets release
    await new Promise(r => setTimeout(r, 800));
    return this.startProcess(id, onLog);
  }
}
