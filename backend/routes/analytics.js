import express from 'express';
import path from 'node:path';
import fs from 'node:fs/promises';

const router = express.Router();
const getWorkspaceRoot = () => path.resolve(process.env.NEXO_WORKSPACE_ROOT ?? process.cwd());
const getAnalyticsPath = () => path.join(getWorkspaceRoot(), '.nexo', 'analytics.json');

// Memory cache for session
let analyticsData = {
  tokenUsage: {}, // modelId -> { inputTokens, outputTokens, queryCount }
  errors: [] // array of { message, stack, source, timestamp }
};

// Helper to load/save
async function loadAnalytics() {
  try {
    const filePath = getAnalyticsPath();
    const content = await fs.readFile(filePath, 'utf8');
    analyticsData = JSON.parse(content);
  } catch (e) {
    // Defaults or directories creation
  }
}

async function saveAnalytics() {
  try {
    const filePath = getAnalyticsPath();
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(analyticsData, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save analytics:', e);
  }
}

// Initialize on load
loadAnalytics();

// Log Token Usage
router.post('/log-tokens', async (req, res) => {
  const { model, inputTokens, outputTokens } = req.body;
  if (!model) return res.status(400).json({ error: 'model is required' });
  
  if (!analyticsData.tokenUsage[model]) {
    analyticsData.tokenUsage[model] = { inputTokens: 0, outputTokens: 0, queryCount: 0 };
  }
  
  analyticsData.tokenUsage[model].inputTokens += Number(inputTokens || 0);
  analyticsData.tokenUsage[model].outputTokens += Number(outputTokens || 0);
  analyticsData.tokenUsage[model].queryCount += 1;
  
  await saveAnalytics();
  res.json({ ok: true });
});

// Log Error
router.post('/log-error', async (req, res) => {
  const { message, stack, source } = req.body;
  if (!message) return res.status(400).json({ error: 'message is required' });
  
  const errEntry = {
    message,
    stack: stack || '',
    source: source || 'client',
    timestamp: Date.now()
  };
  
  analyticsData.errors.unshift(errEntry);
  if (analyticsData.errors.length > 50) {
    analyticsData.errors.pop();
  }
  
  await saveAnalytics();
  res.json({ ok: true });
});

// Retrieve Stats
router.get('/stats', (req, res) => {
  res.json(analyticsData);
});

// Helper for adding errors programmatically on the backend
export function logBackendError(message, stack) {
  const errEntry = {
    message,
    stack: stack || '',
    source: 'backend',
    timestamp: Date.now()
  };
  analyticsData.errors.unshift(errEntry);
  if (analyticsData.errors.length > 50) {
    analyticsData.errors.pop();
  }
  saveAnalytics().catch(() => {});
}

export default router;
