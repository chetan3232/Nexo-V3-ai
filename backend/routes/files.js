import express from 'express';
import { supabase } from '../database/db.js';

const router = express.Router();

// Get workspace file tree for a project
router.get('/tree/:projectId', async (req, res) => {
  const { projectId } = req.params;
  const { data, error } = await supabase
    .from('files')
    .select('id, path, size, updated_at')
    .eq('project_id', projectId);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  // Structuring database rows into hierarchical tree structure for workspace explorer UI
  const tree = [];
  for (const file of data) {
    const segments = file.path.split('/');
    let currentLevel = tree;

    segments.forEach((segment, idx) => {
      const isLast = idx === segments.length - 1;
      let existingNode = currentLevel.find((node) => node.name === segment);

      if (!existingNode) {
        existingNode = {
          id: file.path,
          name: segment,
          path: file.path,
          type: isLast ? 'file' : 'folder',
          gitStatus: 'clean',
        };
        if (!isLast) {
          existingNode.children = [];
        }
        currentLevel.push(existingNode);
      }
      if (!isLast) {
        currentLevel = existingNode.children;
      }
    });
  }

  return res.json({ tree });
});

// Read file content
router.get('/read', async (req, res) => {
  const { projectId, path } = req.query;
  if (!projectId || !path) {
    return res.status(400).json({ error: 'projectId and path are required' });
  }

  const { data, error } = await supabase
    .from('files')
    .select('content')
    .eq('project_id', projectId)
    .eq('path', path)
    .single();

  if (error) {
    return res.status(404).json({ error: 'File not found' });
  }
  return res.json({ content: data.content });
});

// Write / Save file content
router.post('/write', async (req, res) => {
  const { projectId, path, content } = req.body;
  if (!projectId || !path) {
    return res.status(400).json({ error: 'projectId and path are required' });
  }

  const size = Buffer.byteLength(content || '', 'utf8');

  // Supabase upsert logic
  const { error } = await supabase
    .from('files')
    .upsert({
      project_id: projectId,
      path,
      content: content || '',
      size,
    }, {
      onConflict: 'project_id,path',
    });

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  return res.json({ ok: true });
});

// Delete file
router.post('/delete', async (req, res) => {
  const { projectId, path } = req.body;
  if (!projectId || !path) {
    return res.status(400).json({ error: 'projectId and path are required' });
  }

  const { error } = await supabase
    .from('files')
    .delete()
    .eq('project_id', projectId)
    .eq('path', path);

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  return res.json({ ok: true });
});

export default router;
