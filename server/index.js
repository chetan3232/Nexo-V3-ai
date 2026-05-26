import cors from 'cors';
import express from 'express';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { WebSocketServer } from 'ws';
import { FileMemoryEngine } from './memoryEngine.js';

const app = express();
const server = http.createServer(app);
const port = Number(process.env.NEXO_API_PORT ?? 8787);
const workspaceRoot = path.resolve(process.env.NEXO_WORKSPACE_ROOT ?? process.cwd());
const memoryEngine = new FileMemoryEngine(workspaceRoot);
const deploymentProviders = {
  vercel: { configFile: 'vercel.json', buildCommand: 'npm run build', outputDirectory: 'dist' },
  netlify: { configFile: 'netlify.toml', buildCommand: 'npm run build', outputDirectory: 'dist' },
  cloudflare: { configFile: 'wrangler.toml', buildCommand: 'npm run build', outputDirectory: 'dist' },
  railway: { configFile: 'railway.json', buildCommand: 'npm run build', outputDirectory: 'dist' },
};

app.use(cors());
app.use(express.json({ limit: '2mb' }));

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

async function streamSyntheticTokens(text, write) {
  const chunks = text.match(/.{1,18}/g) ?? [text];
  for (const chunk of chunks) {
    write(chunk);
    await new Promise((resolve) => setTimeout(resolve, 35));
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, workspaceRoot });
});

app.post('/api/ai/stream', async (req, res) => {
  res.writeHead(200, {
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Content-Type': 'text/event-stream',
  });

  const prompt = String(req.body?.prompt ?? '');
  await streamSyntheticTokens(prompt, (token) => {
    res.write(`data: ${JSON.stringify({ token })}\n\n`);
  });
  res.write('event: done\ndata: {}\n\n');
  res.end();
});

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

app.post('/api/agent/plan', async (req, res) => {
  const goal = String(req.body?.goal ?? '');
  const memories = await memoryEngine.search(goal, ['project', 'code', 'long', 'conversation'], 5);
  res.json({
    taskGraph: ['Thinking', 'Planning', 'Editing file', 'Running tests', 'Fixing errors'],
    filePlan: memories.map((memory) => memory.source).filter(Boolean).slice(0, 4),
    dependencyPlan: ['memory retrieval', 'streaming transport', 'filesystem binding'],
  });
});

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

app.get('/api/fs/tree', async (_req, res) => {
  try {
    res.json({ tree: await buildTree('.') });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/fs/read', async (req, res) => {
  try {
    const filePath = resolveWorkspacePath(String(req.query.path ?? ''));
    const content = await fs.readFile(filePath, 'utf8');
    res.json({ content });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/fs/write', async (req, res) => {
  try {
    const filePath = resolveWorkspacePath(String(req.body?.path ?? ''));
    await fs.writeFile(filePath, String(req.body?.content ?? ''), 'utf8');
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

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

const wss = new WebSocketServer({ server, path: '/api/ai/ws' });

wss.on('connection', (socket) => {
  socket.on('message', async (raw) => {
    const payload = JSON.parse(String(raw));
    await streamSyntheticTokens(String(payload.prompt ?? ''), (token) => {
      socket.send(JSON.stringify({ type: 'token', token }));
    });
    socket.send(JSON.stringify({ type: 'done' }));
  });
});

server.listen(port, () => {
  console.log(`NEXO API server listening on http://localhost:${port}`);
});
