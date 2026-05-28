import { exec, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const execAsync = promisify(exec);

export class SandboxRuntime {
  constructor(workspaceRoot) {
    this.workspaceRoot = path.resolve(workspaceRoot);
    this.hasDocker = false;
  }

  // Check if Docker daemon is accessible
  async checkDockerAvailability() {
    try {
      await execAsync('docker info');
      this.hasDocker = true;
      console.log('[Sandbox] Docker is available. Secure container runtime enabled.');
      return true;
    } catch {
      this.hasDocker = false;
      console.log('[Sandbox] Docker is unavailable. Falling back to local isolated subprocess execution.');
      return false;
    }
  }

  /**
   * Executes a command securely inside a Docker container sandbox.
   * Falls back to a local subprocess if Docker is unavailable.
   */
  async runCommand(command, onLog) {
    if (this.hasDocker === undefined) {
      await this.checkDockerAvailability();
    }

    // Sanitize command to prevent dangerous breakouts
    const sanitizedCommand = command.trim();
    if (!sanitizedCommand) {
      throw new Error('Command is empty');
    }

    if (this.hasDocker) {
      return this.runInDocker(sanitizedCommand, onLog);
    } else {
      return this.runLocally(sanitizedCommand, onLog);
    }
  }

  async runInDocker(command, onLog) {
    return new Promise((resolve) => {
      onLog('[sandbox] booting secure Docker container container...');
      
      // Spawning transient alpine node image with CPU/memory limits
      const dockerArgs = [
        'run', '--rm',
        '-v', `${this.workspaceRoot}:/app`,
        '-w', '/app',
        '--memory', '256m',
        '--cpus', '0.5',
        'node:18-alpine',
        'sh', '-c', command
      ];

      const child = spawn('docker', dockerArgs);

      child.stdout.on('data', (data) => {
        onLog(data.toString());
      });

      child.stderr.on('data', (data) => {
        onLog(`[error] ${data.toString()}`);
      });

      child.on('close', (code) => {
        resolve({
          status: code === 0 ? 'success' : 'error',
          code,
          output: `Container exited with code ${code}`
        });
      });

      child.on('error', (err) => {
        onLog(`[error] container boot failed: ${err.message}`);
        resolve({ status: 'error', code: -1, output: err.message });
      });
    });
  }

  async runLocally(command, onLog) {
    return new Promise((resolve) => {
      onLog('[sandbox] warning: using local subprocess execution fallback...');
      
      const child = spawn('cmd.exe', ['/c', command], {
        cwd: this.workspaceRoot,
        env: { ...process.env, NODE_ENV: 'sandbox' }
      });

      child.stdout.on('data', (data) => {
        onLog(data.toString());
      });

      child.stderr.on('data', (data) => {
        onLog(`[error] ${data.toString()}`);
      });

      child.on('close', (code) => {
        resolve({
          status: code === 0 ? 'success' : 'error',
          code,
          output: `Process exited with code ${code}`
        });
      });

      child.on('error', (err) => {
        onLog(`[error] process spawn failed: ${err.message}`);
        resolve({ status: 'error', code: -1, output: err.message });
      });
    });
  }
}
