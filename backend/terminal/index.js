import { spawn } from 'node:child_process';
import path from 'node:path';

export class TerminalSession {
  constructor(sessionId, workspaceRoot, onData) {
    this.sessionId = sessionId;
    this.workspaceRoot = path.resolve(workspaceRoot);
    this.onData = onData;
    this.process = null;
  }

  start() {
    // Spawns shell based on platform
    const isWin = process.platform === 'win32';
    const shell = isWin ? 'powershell.exe' : 'sh';
    const args = isWin ? ['-NoLogo'] : [];

    this.process = spawn(shell, args, {
      cwd: this.workspaceRoot,
      env: process.env,
    });

    this.process.stdout.on('data', (data) => {
      this.onData(data.toString());
    });

    this.process.stderr.on('data', (data) => {
      this.onData(data.toString());
    });

    this.process.on('close', (code) => {
      this.onData(`\r\n[Terminal session ${this.sessionId} closed with code ${code}]\r\n`);
    });
  }

  write(data) {
    if (this.process && this.process.stdin.writable) {
      this.process.stdin.write(data);
    }
  }

  kill() {
    if (this.process) {
      this.process.kill();
    }
  }
}
