import express from 'express';
import path from 'node:path';
import fs from 'node:fs/promises';

const router = express.Router();

// Helper to list files recursively
async function getFiles(dir, fileList = []) {
  const files = await fs.readdir(dir, { withFileTypes: true });
  for (const file of files) {
    const filePath = path.join(dir, file.name);
    if (['node_modules', 'dist', '.git', '.gemini', '.npm-cache'].includes(file.name)) {
      continue;
    }
    if (file.isDirectory()) {
      await getFiles(filePath, fileList);
    } else {
      const ext = file.name.split('.').pop() ?? '';
      if (['ts', 'tsx', 'js', 'jsx', 'json', 'py', 'md', 'html', 'css'].includes(ext)) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

router.post('/semantic', async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  const workspaceRoot = path.resolve(process.env.NEXO_WORKSPACE_ROOT ?? process.cwd());
  const memoryEngine = req.app.get('memoryEngine');
  
  if (!memoryEngine) {
    return res.status(500).json({ error: 'Memory engine not initialized' });
  }

  try {
    const files = await getFiles(workspaceRoot);
    
    // Index up to 15 key files for quick search matching
    const indexPromises = files.slice(0, 15).map(async (f) => {
      try {
        const relPath = path.relative(workspaceRoot, f).replaceAll(path.sep, '/');
        const content = await fs.readFile(f, 'utf8');
        
        await memoryEngine.upsert({
          layer: 'code',
          title: relPath,
          content: content.slice(0, 2000), // Index first 2000 characters
          source: relPath,
          tags: [relPath.split('.').pop() ?? '']
        });
      } catch (e) {}
    });

    await Promise.all(indexPromises).catch(() => {});

    // Run semantic similarity search on the code layer
    const results = await memoryEngine.search(query, ['code'], 10);
    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
