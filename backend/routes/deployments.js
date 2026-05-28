import express from 'express';
import { supabase } from '../database/db.js';

const router = express.Router();

// Get deployments list for a project
router.get('/:projectId', async (req, res) => {
  const { projectId } = req.params;
  const { data, error } = await supabase
    .from('deployments')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  return res.json({ deployments: data });
});

// Trigger / Create deployment record
router.post('/', async (req, res) => {
  const { projectId, provider } = req.body;
  if (!projectId || !provider) {
    return res.status(400).json({ error: 'projectId and provider are required' });
  }

  const { data, error } = await supabase
    .from('deployments')
    .insert({
      project_id: projectId,
      provider,
      status: 'pending',
      url: '',
      build_logs: '[deployer] initializing deployment sequence...',
    })
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  return res.json({ deployment: data });
});

// Update deployment status / logs
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, url, build_logs } = req.body;

  const updateFields = {};
  if (status) updateFields.status = status;
  if (url) updateFields.url = url;
  if (build_logs) updateFields.build_logs = build_logs;

  const { data, error } = await supabase
    .from('deployments')
    .update(updateFields)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  return res.json({ deployment: data });
});

export default router;
