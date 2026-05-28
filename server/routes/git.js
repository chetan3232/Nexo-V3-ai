import express from 'express';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const router = express.Router();
const execAsync = promisify(exec);

const getWorkspaceRoot = () => path.resolve(process.env.NEXO_WORKSPACE_ROOT ?? process.cwd());

// Helper to run git command
async function runGit(cmd) {
  const root = getWorkspaceRoot();
  try {
    const { stdout, stderr } = await execAsync(cmd, { cwd: root });
    return { stdout: stdout.trim(), stderr: stderr.trim() };
  } catch (err) {
    return { stdout: '', stderr: err.message, error: true };
  }
}

// 1. Get Commit History
router.get('/history', async (req, res) => {
  const result = await runGit('git log -n 25 --pretty=format:"%H|%an|%ad|%s" --date=relative');
  if (result.error) {
    return res.json({ history: [] });
  }

  const lines = result.stdout ? result.stdout.split('\n') : [];
  const history = await Promise.all(lines.map(async (line) => {
    const [sha, author, time, message] = line.split('|');
    
    // Get files changed in this commit
    const filesRes = await runGit(`git show --name-status --pretty="" ${sha}`);
    const files = filesRes.stdout 
      ? filesRes.stdout.split('\n').map(l => l.trim().split(/\s+/)[1]).filter(Boolean)
      : [];

    return {
      id: sha,
      label: sha.substring(0, 7).toUpperCase(),
      title: message,
      time: time,
      author: author,
      files: files,
      changes: `${files.length} files`
    };
  }));

  res.json({ history });
});

// 2. Get File Content at Commit
router.get('/show-file', async (req, res) => {
  const { sha, path: filePath } = req.query;
  if (!sha || !filePath) {
    return res.status(400).json({ error: 'sha and path are required' });
  }
  
  const sanitizedPath = filePath.replace(/\\/g, '/');
  const result = await runGit(`git show ${sha}:"${sanitizedPath}"`);
  if (result.error) {
    return res.status(400).json({ error: result.stderr });
  }
  
  res.json({ content: result.stdout });
});

// 3. Get Workspace Diff
router.get('/diff', async (req, res) => {
  const result = await runGit('git diff HEAD');
  res.json({ diff: result.stdout || result.stderr || 'No modifications found.' });
});

// 4. Commit Changes
router.post('/commit', async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Commit message is required' });
  }

  await runGit('git add .');
  const result = await runGit(`git commit -m "${message.replace(/"/g, '\\"')}"`);
  if (result.error) {
    return res.status(400).json({ error: result.stderr });
  }

  res.json({ ok: true, output: result.stdout });
});

// 5. Revert State
router.post('/revert', async (req, res) => {
  const { sha } = req.body;
  if (!sha) {
    return res.status(400).json({ error: 'SHA is required' });
  }

  const result = await runGit(`git checkout ${sha} -- .`);
  if (result.error) {
    return res.status(400).json({ error: result.stderr });
  }

  res.json({ ok: true, message: `Reverted workspace to ${sha}` });
});

// 6. Snapshot (git tag)
router.post('/snapshot', async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Snapshot name is required' });
  }

  const tagName = `snapshot-${name.replace(/\s+/g, '-').toLowerCase()}`;
  const result = await runGit(`git tag -a "${tagName}" -m "Workspace Snapshot: ${name}"`);
  if (result.error) {
    return res.status(400).json({ error: result.stderr });
  }

  res.json({ ok: true, message: `Snapshot "${name}" saved.` });
});

// 7. Git Working Tree Status
router.get('/status', async (req, res) => {
  const result = await runGit('git status --porcelain');
  if (result.error) {
    return res.json({ files: [] });
  }
  const lines = result.stdout ? result.stdout.split('\n') : [];
  const files = lines
    .map(line => {
      const status = line.substring(0, 2).trim();
      const filePath = line.substring(3).trim();
      return { path: filePath, status };
    })
    .filter(f => f.path);
  res.json({ files });
});

export default router;
