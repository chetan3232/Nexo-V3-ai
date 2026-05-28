import express from 'express';
import path from 'node:path';
import fs from 'node:fs/promises';
import { supabase } from '../database/db.js';

const router = express.Router();

const getWorkspaceRoot = () => path.resolve(process.env.NEXO_WORKSPACE_ROOT ?? process.cwd());

// Helper to list all files recursively
async function getFiles(dir, fileList = []) {
  try {
    const files = await fs.readdir(dir, { withFileTypes: true });
    for (const file of files) {
      const filePath = path.join(dir, file.name);
      if (['node_modules', 'dist', '.git', '.gemini', '.npm-cache', '.nexo'].includes(file.name)) {
        continue;
      }
      if (file.isDirectory()) {
        await getFiles(filePath, fileList);
      } else {
        fileList.push(filePath);
      }
    }
  } catch (e) {
    // Dir might not exist or be accessible
  }
  return fileList;
}

const SECRET_REGEX = /(?:sk-[a-zA-Z0-9]{32,}|nvapi-[a-zA-Z0-9]{30,}|(?:secret|password|passwd|api_key|apikey)['"]?\s*[:=]\s*['"][a-zA-Z0-9\-_{}]{8,}['"])/gi;

async function scanFilesForSecrets(filePaths, workspaceRoot) {
  const leaks = [];
  for (const f of filePaths) {
    try {
      const content = await fs.readFile(f, 'utf8');
      const matches = content.match(SECRET_REGEX);
      if (matches && matches.length > 0) {
        leaks.push({
          file: path.relative(workspaceRoot, f).replaceAll(path.sep, '/'),
          count: matches.length,
          matches: matches.map(m => {
            if (m.length > 12) {
              return m.substring(0, 6) + '...' + m.substring(m.length - 4);
            }
            return '********';
          })
        });
      }
    } catch (e) {
      // Ignore reading errors
    }
  }
  return leaks;
}

// 1. Push: Sync local files to Supabase cloud
router.post('/push', async (req, res) => {
  const { projectId, force } = req.body;
  if (!projectId) {
    return res.status(400).json({ error: 'projectId is required' });
  }

  const workspaceRoot = getWorkspaceRoot();
  try {
    const filePaths = await getFiles(workspaceRoot);

    if (force !== true) {
      const leaks = await scanFilesForSecrets(filePaths, workspaceRoot);
      if (leaks.length > 0) {
        return res.status(400).json({
          ok: false,
          error: 'Secrets detected in local workspace. Sync blocked.',
          leaks
        });
      }
    }

    let successCount = 0;
    let failCount = 0;


    const syncPromises = filePaths.map(async (f) => {
      try {
        const relPath = path.relative(workspaceRoot, f).replaceAll(path.sep, '/');
        const content = await fs.readFile(f, 'utf8');
        const size = Buffer.byteLength(content, 'utf8');

        // Upsert file to Supabase table
        const { error } = await supabase
          .from('files')
          .upsert({
            project_id: projectId,
            path: relPath,
            content,
            size,
          }, {
            onConflict: 'project_id,path',
          });

        if (error) throw error;
        successCount++;
      } catch (err) {
        failCount++;
      }
    });

    await Promise.all(syncPromises);

    res.json({
      ok: true,
      message: `Pushed ${successCount} files to cloud. ${failCount} files failed.`,
      stats: { success: successCount, failed: failCount }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Pull: Restore remote Supabase files locally
router.post('/pull', async (req, res) => {
  const { projectId } = req.body;
  if (!projectId) {
    return res.status(400).json({ error: 'projectId is required' });
  }

  const workspaceRoot = getWorkspaceRoot();
  try {
    const { data: cloudFiles, error } = await supabase
      .from('files')
      .select('path, content')
      .eq('project_id', projectId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!cloudFiles || cloudFiles.length === 0) {
      return res.status(404).json({ error: 'No files found on cloud for this project.' });
    }

    let successCount = 0;
    let failCount = 0;

    for (const file of cloudFiles) {
      try {
        const absolutePath = path.join(workspaceRoot, file.path);
        
        // Ensure folder directory exists recursively
        await fs.mkdir(path.dirname(absolutePath), { recursive: true });
        
        // Write file contents
        await fs.writeFile(absolutePath, file.content || '', 'utf8');
        successCount++;
      } catch (e) {
        failCount++;
      }
    }

    res.json({
      ok: true,
      message: `Pulled ${successCount} files from cloud. ${failCount} files failed.`,
      stats: { success: successCount, failed: failCount }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
