import express from 'express';
import { supabase } from '../database/db.js';

const router = express.Router();

// Retrieve logs for a specific project
router.get('/:projectId', async (req, res) => {
  const { projectId } = req.params;
  const { source, level, limit } = req.query;

  let queryBuilder = supabase
    .from('logs')
    .select('*')
    .eq('project_id', projectId);

  if (source) {
    queryBuilder = queryBuilder.eq('source', source);
  }
  if (level) {
    queryBuilder = queryBuilder.eq('level', level);
  }

  const { data, error } = await queryBuilder
    .order('created_at', { ascending: false })
    .limit(limit ? Number(limit) : 100);

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  return res.json({ logs: data });
});

// Post a new log entry
router.post('/', async (req, res) => {
  const { projectId, source, level, message } = req.body;
  if (!projectId || !source || !message) {
    return res.status(400).json({ error: 'projectId, source, and message are required' });
  }

  const { data, error } = await supabase
    .from('logs')
    .insert({
      project_id: projectId,
      source,
      level: level || 'info',
      message,
    })
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  return res.json({ log: data });
});

export default router;
