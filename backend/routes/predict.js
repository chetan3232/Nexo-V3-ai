import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const router = express.Router();

const getWorkspaceRoot = () => path.resolve(process.env.NEXO_WORKSPACE_ROOT ?? process.cwd());

const normalizePath = (p) => p.replaceAll('\\', '/');

const isParsable = (file) => /\.(js|ts|jsx|tsx|vue|svelte)$/.test(file);

// 1. GET /api/predict/failures
router.post('/failures', async (req, res) => {
  const root = getWorkspaceRoot();
  const issues = [];

  let memoryLeakCount = 0;
  let timeoutCount = 0;
  let bundleBloatCount = 0;

  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = normalizePath(path.relative(root, fullPath));

      if (['node_modules', 'dist', '.git', '.nexo', '.npm-cache', 'dist', 'build'].includes(entry.name)) {
        continue;
      }

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile() && isParsable(entry.name)) {
        try {
          const content = await fs.readFile(fullPath, 'utf8');
          const lines = content.split('\n');

          // Memory Leak Scan
          if (content.includes('addEventListener') && !content.includes('removeEventListener')) {
            memoryLeakCount++;
            issues.push({
              id: crypto.randomUUID(),
              category: 'memory',
              file: relPath,
              title: 'Dangling Event Listener',
              description: 'Element hooks setup addEventListener without corresponding removeEventListener cleaner. Sockets/DOM leaks may build up.',
              severity: 'high'
            });
          }

          // Sockets without clean close
          if (content.includes('new WebSocket') && !content.includes('.close()')) {
            memoryLeakCount++;
            issues.push({
              id: crypto.randomUUID(),
              category: 'memory',
              file: relPath,
              title: 'Dangling Socket Connection',
              description: 'WebSocket instance initialized without close hooks on component unmount.',
              severity: 'high'
            });
          }

          // Timeout risk scan
          if ((content.includes('fetch(') || content.includes('axios.')) && !content.includes('timeout') && !content.includes('AbortController')) {
            timeoutCount++;
            issues.push({
              id: crypto.randomUUID(),
              category: 'timeout',
              file: relPath,
              title: 'Request Missing Settle Timeout',
              description: 'Network request calls lack explicit timeouts or abort handlers. Thread pools may lock up under service latency.',
              severity: 'medium'
            });
          }

          // Bundle Bloat scan
          if (content.includes("from 'lodash'") || content.includes("from 'three'") || content.includes("from 'chart.js'")) {
            bundleBloatCount++;
            issues.push({
              id: crypto.randomUUID(),
              category: 'bundle',
              file: relPath,
              title: 'Heavy Module Static Import',
              description: 'Library imported statically instead of dynamic code split. Bundle chunk limits will exceed standard loads.',
              severity: 'medium'
            });
          }

        } catch (e) {
          // skip
        }
      }
    }
  }

  try {
    await walk(root);

    // Calculate score coefficients
    const memoryLeakRisk = Math.min(95, 20 + memoryLeakCount * 12);
    const timeoutRisk = Math.min(95, 15 + timeoutCount * 8);
    const bundleBloatRisk = Math.min(95, 25 + bundleBloatCount * 15);

    return res.json({
      success: true,
      scores: {
        memoryLeakRisk,
        timeoutRisk,
        bundleBloatRisk
      },
      issues
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 2. POST /api/predict/simulation
router.post('/simulation', (req, res) => {
  const { horizon = 6, pathType = 'scalable' } = req.body;

  // Generate 10-step timeline simulation datasets
  const steps = 10;
  const labels = [];
  const activeSockets = [];
  const cpuLoad = [];
  const dbQueries = [];
  const latency = [];

  for (let i = 0; i <= steps; i++) {
    const elapsed = (horizon / steps) * i;
    labels.push(`Month ${elapsed.toFixed(1)}`);

    // Base active users growth
    const users = Math.round(100 * Math.pow(2.2, elapsed));

    if (pathType === 'mvp') {
      activeSockets.push(users);
      cpuLoad.push(Math.min(100, Math.round(15 + (users / 500))));
      dbQueries.push(users * 2.5);
      latency.push(Math.round(45 + Math.pow(users / 100, 1.8)));
    } else if (pathType === 'scalable') {
      activeSockets.push(users);
      cpuLoad.push(Math.min(100, Math.round(10 + (users / 1800))));
      dbQueries.push(users * 0.4); // optimized caching
      latency.push(Math.round(55 + (users / 200))); // flat linear scaling
    } else { // enterprise
      activeSockets.push(users);
      cpuLoad.push(Math.min(100, Math.round(8 + (users / 4000))));
      dbQueries.push(users * 0.15); // replica load balancing
      latency.push(Math.round(85 + (users / 800))); // initial overhead but extremely flat scale
    }
  }

  const reports = [];
  const finalUsers = activeSockets[activeSockets.length - 1];

  if (pathType === 'mvp' && finalUsers > 10000) {
    reports.push({
      type: 'warning',
      title: 'Database CPU Exhaustion predicted',
      description: `Active queries (${dbQueries[dbQueries.length - 1].toFixed(0)}/sec) will saturate db single-node cpu cores around Month ${(horizon * 0.7).toFixed(1)}.`
    });
    reports.push({
      type: 'critical',
      title: 'Active latency bounds exceeded',
      description: `Simulated request times (${latency[latency.length - 1]}ms) exceed standard UX thresholds. Socket timeouts will occur.`
    });
  } else if (pathType === 'scalable') {
    reports.push({
      type: 'info',
      title: 'Redis Node distribution balanced',
      description: `Caching hit ratios remain high (>88%). Latency continues linear scaling below 150ms limits.`
    });
  }

  return res.json({
    success: true,
    data: {
      labels,
      activeSockets,
      cpuLoad,
      dbQueries,
      latency
    },
    reports
  });
});

export default router;
