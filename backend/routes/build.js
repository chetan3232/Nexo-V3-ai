import express from 'express';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs/promises';

const router = express.Router();

router.post('/start', async (req, res) => {
  const { type } = req.body;
  const workspaceRoot = path.resolve(process.env.NEXO_WORKSPACE_ROOT ?? process.cwd());

  if (!['electron', 'tauri', 'apk', 'pwa'].includes(type)) {
    return res.status(400).json({ error: 'Invalid build type' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const writeLog = (msg) => {
    res.write(`data: ${JSON.stringify({ log: msg })}\n\n`);
  };

  const writeResult = (result) => {
    res.write(`data: ${JSON.stringify({ result })}\n\n`);
    res.end();
  };

  writeLog(`[build] Initializing export system for target: ${type.toUpperCase()}...\n`);

  let buildCommand = '';
  if (type === 'electron') {
    buildCommand = 'npm run desktop:build';
  } else if (type === 'tauri') {
    buildCommand = 'npm run tauri:build';
  } else if (type === 'apk') {
    buildCommand = 'npm run apk:sync';
  } else if (type === 'pwa') {
    // Standard PWA generation: build Vite assets first, then append service worker
    buildCommand = 'npm run build';
  }

  const shell = process.platform === 'win32' ? 'cmd.exe' : 'sh';
  const args = process.platform === 'win32' ? ['/c', buildCommand] : ['-c', buildCommand];

  writeLog(`[build] Executing: ${buildCommand}\n`);

  const child = spawn(shell, args, { cwd: workspaceRoot, env: process.env });

  child.stdout.on('data', (data) => {
    writeLog(data.toString());
  });

  child.stderr.on('data', (data) => {
    writeLog(`[error] ${data.toString()}`);
  });

  child.on('close', async (code) => {
    if (code !== 0) {
      writeLog(`[build] Export failed with process exit code ${code}\n`);
      return writeResult({ status: 'error', code });
    }

    if (type === 'pwa') {
      try {
        writeLog(`[build] Generating service-worker.js and manifest.json for PWA...\n`);
        const distPath = path.join(workspaceRoot, 'dist');
        
        const swContent = `
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open('nexo-pwa').then((c) => c.addAll(['/', '/index.html'])));
});
self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then((res) => res || fetch(e.request)));
});
`;
        const manifestContent = {
          short_name: "NexoApp",
          name: "Nexo Progressive Web Application",
          icons: [
            { src: "favicon.ico", type: "image/x-icon", sizes: "64x64 32x32 24x24 16x16" }
          ],
          start_url: ".",
          display: "standalone",
          theme_color: "#0d1117",
          background_color: "#0d1117"
        };

        await fs.mkdir(distPath, { recursive: true });
        await fs.writeFile(path.join(distPath, 'service-worker.js'), swContent, 'utf8');
        await fs.writeFile(path.join(distPath, 'manifest.json'), JSON.stringify(manifestContent, null, 2), 'utf8');
        writeLog(`[build] Service worker and manifest created in dist/\n`);
      } catch (err) {
        writeLog(`[error] PWA packaging assets error: ${err.message}\n`);
      }
    }

    writeLog(`[build] Target ${type.toUpperCase()} package generated successfully!\n`);
    writeResult({ status: 'success', code: 0 });
  });

  child.on('error', (err) => {
    writeLog(`[error] Spawn failed: ${err.message}\n`);
    writeResult({ status: 'error', error: err.message });
  });
});

export default router;
