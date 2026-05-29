import express from 'express';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const router = express.Router();
const execAsync = promisify(exec);

const getWorkspaceRoot = () => path.resolve(process.env.NEXO_WORKSPACE_ROOT ?? process.cwd());

// Helper to run git commands
async function runGit(cmd) {
  const root = getWorkspaceRoot();
  try {
    const { stdout, stderr } = await execAsync(cmd, { cwd: root });
    return { stdout: stdout.trim(), stderr: stderr.trim(), success: true };
  } catch (err) {
    return { stdout: '', stderr: err.message, success: false };
  }
}

// In-memory active dream state
let currentDream = {
  status: 'idle', // idle, dreaming, complete, failed, cancelled
  goal: '',
  branch: '',
  startTime: null,
  progress: 0,
};

// 1. POST /api/dream/start
router.post('/start', async (req, res) => {
  const { goal } = req.body;
  if (!goal) {
    return res.status(400).json({ error: 'Goal is required' });
  }

  const branchName = `dream/${goal.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}-${Date.now().toString(36)}`;
  
  // Try to create the branch
  const result = await runGit(`git checkout -b ${branchName}`);
  
  currentDream = {
    status: 'dreaming',
    goal,
    branch: branchName,
    startTime: Date.now(),
    progress: 10,
  };

  return res.json({
    success: result.success,
    branch: branchName,
    message: result.success ? `Started dream branch: ${branchName}` : `Failed branch creation: ${result.stderr}`,
    dream: currentDream
  });
});

// 2. GET /api/dream/status
router.get('/status', (req, res) => {
  return res.json({ dream: currentDream });
});

// 3. POST /api/dream/commit
router.post('/commit', async (req, res) => {
  const { file, message } = req.body;
  if (!file || !message) {
    return res.status(400).json({ error: 'file and message are required' });
  }

  const addResult = await runGit(`git add "${file}"`);
  if (!addResult.success) {
    return res.status(400).json({ error: `git add failed: ${addResult.stderr}` });
  }

  const commitResult = await runGit(`git commit -m "${message.replace(/"/g, '\\"')}"`);
  return res.json({
    success: commitResult.success,
    output: commitResult.stdout || commitResult.stderr
  });
});

// 4. POST /api/dream/merge
router.post('/merge', async (req, res) => {
  const { branch } = req.body;
  const targetBranch = branch || currentDream.branch;

  if (!targetBranch) {
    return res.status(400).json({ error: 'Branch is required to merge' });
  }

  // Checkout main/master, merge, and delete dream branch
  // Let's first detect primary branch (main or master)
  let mainBranch = 'main';
  const branchCheck = await runGit('git branch --list master');
  if (branchCheck.success && branchCheck.stdout.includes('master')) {
    mainBranch = 'master';
  }

  const checkoutMain = await runGit(`git checkout ${mainBranch}`);
  if (!checkoutMain.success) {
    return res.status(400).json({ error: `Failed to checkout main branch: ${checkoutMain.stderr}` });
  }

  const mergeResult = await runGit(`git merge ${targetBranch}`);
  if (!mergeResult.success) {
    return res.status(400).json({ error: `Merge failed: ${mergeResult.stderr}. You may need manual resolution.` });
  }

  // Delete the dream branch
  await runGit(`git branch -d ${targetBranch}`);

  currentDream = {
    status: 'idle',
    goal: '',
    branch: '',
    startTime: null,
    progress: 0,
  };

  return res.json({
    success: true,
    message: `Merged ${targetBranch} into ${mainBranch} and cleaned up branch.`,
  });
});

// 5. POST /api/dream/cancel
router.post('/cancel', async (req, res) => {
  if (currentDream.status === 'dreaming') {
    currentDream.status = 'cancelled';
  }

  // Safely attempt to checkout main/master
  let mainBranch = 'main';
  const branchCheck = await runGit('git branch --list master');
  if (branchCheck.success && branchCheck.stdout.includes('master')) {
    mainBranch = 'master';
  }
  await runGit(`git checkout ${mainBranch}`);

  if (currentDream.branch) {
    // Delete the branch forcefully
    await runGit(`git branch -D ${currentDream.branch}`);
  }

  currentDream = {
    status: 'idle',
    goal: '',
    branch: '',
    startTime: null,
    progress: 0,
  };

  return res.json({
    success: true,
    message: 'Dream execution aborted and workspace reset to main branch.',
  });
});

export default router;
