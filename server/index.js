import cors from 'cors';
import express from 'express';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { WebSocketServer } from 'ws';
import { FileMemoryEngine } from './memoryEngine.js';

// Import New Modular Routers & Components
import authRouter from './routes/auth.js';
import projectsRouter from './routes/projects.js';
import filesRouter from './routes/files.js';
import messagesRouter from './routes/messages.js';
import deploymentsRouter from './routes/deployments.js';
import memoriesRouter from './routes/memories.js';
import agentsRouter from './routes/agents.js';
import logsRouter from './routes/logs.js';
import buildRouter from './routes/build.js';
import gitRouter from './routes/git.js';
import searchRouter from './routes/search.js';
import syncRouter from './routes/sync.js';

import { initializeWebSocketGateway } from './websocket/index.js';
import { streamTokens } from './ai/index.js';
import { SandboxRuntime } from './runtime/index.js';
import { ProcessManager } from './runtime/processManager.js';

const app = express();
const server = http.createServer(app);
const port = Number(process.env.NEXO_API_PORT ?? 8787);
let workspaceRoot = path.resolve(process.env.NEXO_WORKSPACE_ROOT ?? process.cwd());
const processManager = new ProcessManager(workspaceRoot);

// Initialize Legacy Engines for complete backwards compatibility
let memoryEngine = new FileMemoryEngine(workspaceRoot);
app.set('memoryEngine', memoryEngine);
const deploymentProviders = {
  vercel: { configFile: 'vercel.json', buildCommand: 'npm run build', outputDirectory: 'dist' },
  netlify: { configFile: 'netlify.toml', buildCommand: 'npm run build', outputDirectory: 'dist' },
  cloudflare: { configFile: 'wrangler.toml', buildCommand: 'npm run build', outputDirectory: 'dist' },
  railway: { configFile: 'railway.json', buildCommand: 'npm run build', outputDirectory: 'dist' },
};

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Helper functions for filesystem fallback
function resolveWorkspacePath(inputPath = '.') {
  const resolved = path.resolve(workspaceRoot, inputPath);
  if (resolved !== workspaceRoot && !resolved.startsWith(`${workspaceRoot}${path.sep}`)) {
    throw new Error('Path escapes workspace root');
  }
  return resolved;
}

function toRelativePath(absolutePath) {
  return path.relative(workspaceRoot, absolutePath).replaceAll(path.sep, '/');
}

async function buildTree(relativePath = '.') {
  const absolutePath = resolveWorkspacePath(relativePath);
  const entries = await fs.readdir(absolutePath, { withFileTypes: true });
  const visibleEntries = entries.filter((entry) => !['node_modules', 'dist', '.git', '.npm-cache'].includes(entry.name));

  return Promise.all(
    visibleEntries.map(async (entry) => {
      const childAbsolutePath = path.join(absolutePath, entry.name);
      const childRelativePath = toRelativePath(childAbsolutePath);
      const node = {
        id: childRelativePath || entry.name,
        name: entry.name,
        path: childRelativePath,
        type: entry.isDirectory() ? 'folder' : 'file',
        gitStatus: 'clean',
      };

      if (entry.isDirectory()) {
        node.children = await buildTree(childRelativePath);
      }

      return node;
    })
  );
}

// Mount New Modular API Routers
app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/files', filesRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/deployments', deploymentsRouter);
app.use('/api/memories', memoriesRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/logs', logsRouter);
app.use('/api/build', buildRouter);
app.use('/api/git', gitRouter);
app.use('/api/search', searchRouter);
app.use('/api/sync', syncRouter);

// Run Sandbox Command Route
app.post('/api/sandbox/run', async (req, res) => {
  try {
    const { command } = req.body;
    if (!command) {
      return res.status(400).json({ error: 'command is required' });
    }
    const sandbox = new SandboxRuntime(workspaceRoot);
    let logBuffer = '';
    const result = await sandbox.runCommand(command, (log) => {
      logBuffer += log;
    });
    res.json({ result, logs: logBuffer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Runtime Background Process Routes
app.get('/api/runtime/processes', (req, res) => {
  res.json({ processes: processManager.getProcessList() });
});

app.post('/api/runtime/start', async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });
    void processManager.startProcess(id).catch(() => {});
    res.json({ ok: true, message: `Process ${id} is booting` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/runtime/stop', (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });
    processManager.stopProcess(id);
    res.json({ ok: true, message: `Process ${id} stopped` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/runtime/restart', async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });
    void processManager.restartProcess(id).catch(() => {});
    res.json({ ok: true, message: `Process ${id} is restarting` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Maintain Legacy Health Check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, workspaceRoot, mode: process.env.NODE_ENV || 'development' });
});

// Maintain Legacy AI Stream Route
app.post('/api/ai/stream', async (req, res) => {
  res.writeHead(200, {
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Content-Type': 'text/event-stream',
  });

  const prompt = String(req.body?.prompt ?? '');
  for await (const token of streamTokens(prompt)) {
    res.write(`data: ${JSON.stringify({ token })}\n\n`);
  }
  res.write('event: done\ndata: {}\n\n');
  res.end();
});

// Maintain Legacy Memory Upsert Route
app.post('/api/memory/upsert', async (req, res) => {
  try {
    const entry = await memoryEngine.upsert({
      layer: req.body?.layer ?? 'short',
      title: String(req.body?.title ?? 'Untitled memory'),
      content: String(req.body?.content ?? ''),
      source: req.body?.source,
      tags: Array.isArray(req.body?.tags) ? req.body.tags : [],
    });
    res.json({ entry });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Maintain Legacy Memory Search Route
app.post('/api/memory/search', async (req, res) => {
  try {
    const results = await memoryEngine.search(
      String(req.body?.query ?? ''),
      Array.isArray(req.body?.layers) ? req.body.layers : undefined,
      Number(req.body?.limit ?? 6)
    );
    res.json({ results });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Maintain Legacy Agent Planning Route
app.post('/api/agent/plan', async (req, res) => {
  const goal = String(req.body?.goal ?? '');
  const memories = await memoryEngine.search(goal, ['project', 'code', 'long', 'conversation'], 5);
  res.json({
    taskGraph: ['Thinking', 'Planning', 'Editing file', 'Running tests', 'Fixing errors'],
    filePlan: memories.map((memory) => memory.source).filter(Boolean).slice(0, 4),
    dependencyPlan: ['memory retrieval', 'streaming transport', 'filesystem binding'],
  });
});

// Maintain Legacy Deployment Route
app.post('/api/deploy/plan', (req, res) => {
  const provider = String(req.body?.provider ?? 'vercel');
  const definition = deploymentProviders[provider] ?? deploymentProviders.vercel;
  res.json({
    provider,
    env: provider === 'railway' ? ['NEXO_API_PORT', 'NEXO_WORKSPACE_ROOT'] : ['VITE_NEXO_API_URL'],
    buildConfig: definition,
    deployScript: `npm run deploy:${provider}`,
  });
});

// Maintain Legacy File System Tree Route
app.get('/api/fs/tree', async (_req, res) => {
  try {
    res.json({ tree: await buildTree('.') });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Maintain Legacy File System Read Route
app.get('/api/fs/read', async (req, res) => {
  try {
    const filePath = resolveWorkspacePath(String(req.query.path ?? ''));
    const content = await fs.readFile(filePath, 'utf8');
    res.json({ content });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Maintain Legacy File System Write Route
app.post('/api/fs/write', async (req, res) => {
  try {
    const filePath = resolveWorkspacePath(String(req.body?.path ?? ''));
    // Auto-create parent directory if it does not exist
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, String(req.body?.content ?? ''), 'utf8');
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create Folder Route
app.post('/api/fs/mkdir', async (req, res) => {
  try {
    const dirPath = resolveWorkspacePath(String(req.body?.path ?? ''));
    await fs.mkdir(dirPath, { recursive: true });
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get Workspace Path Route
app.get('/api/fs/workspace', (req, res) => {
  res.json({ workspaceRoot });
});

// Update Workspace Path Route
app.post('/api/fs/workspace', async (req, res) => {
  try {
    const { path: newPath } = req.body;
    if (!newPath) {
      return res.status(400).json({ error: 'path is required' });
    }
    const resolved = path.resolve(newPath);
    await fs.mkdir(resolved, { recursive: true });
    workspaceRoot = resolved;
    processManager.workspaceRoot = resolved;
    memoryEngine = new FileMemoryEngine(workspaceRoot);
    app.set('memoryEngine', memoryEngine);
    console.log(`[Server] Dynamic workspace root updated to: ${workspaceRoot}`);
    res.json({ ok: true, workspaceRoot });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Maintain Legacy File System Rename Route
app.post('/api/fs/rename', async (req, res) => {
  try {
    const from = resolveWorkspacePath(String(req.body?.from ?? ''));
    const to = resolveWorkspacePath(String(req.body?.to ?? ''));
    await fs.rename(from, to);
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Maintain Legacy File System Delete Route
app.post('/api/fs/delete', async (req, res) => {
  try {
    const target = resolveWorkspacePath(String(req.body?.path ?? ''));
    if (target === workspaceRoot) throw new Error('Refusing to delete workspace root');
    await fs.rm(target, { recursive: true, force: true });
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Initialize WebSocket gateway at /api/ws
initializeWebSocketGateway(server, workspaceRoot, processManager);

// Maintain Legacy websocket at /api/ai/ws
const wssLegacy = new WebSocketServer({ noServer: true });
wssLegacy.on('connection', (socket) => {
  socket.on('message', async (raw) => {
    const payload = JSON.parse(String(raw));
    for await (const token of streamTokens(String(payload.prompt ?? ''))) {
      socket.send(JSON.stringify({ type: 'token', token }));
    }
    socket.send(JSON.stringify({ type: 'done' }));
  });
});

// Delegate WebSocket connections based on request path
server.on('upgrade', (request, socket, head) => {
  const { pathname } = new URL(request.url, `http://${request.headers.host}`);
  if (pathname === '/api/ai/ws') {
    wssLegacy.handleUpgrade(request, socket, head, (ws) => {
      wssLegacy.emit('connection', ws, request);
    });
  }
});

server.listen(port, () => {
  console.log(`[Server] NEXO API server booted and listening on http://localhost:${port}`);
});
