import express from 'express';
import { supabase } from '../database/db.js';

const router = express.Router();

// Retrieve all messages for a specific project
router.get('/:projectId', async (req, res) => {
  const { projectId } = req.params;
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  return res.json({ messages: data });
});

// Post a new message
router.post('/', async (req, res) => {
  const { projectId, senderId, role, text } = req.body;
  if (!projectId || !role || !text) {
    return res.status(400).json({ error: 'projectId, role, and text are required' });
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      project_id: projectId,
      sender_id: senderId || null,
      role,
      text,
    })
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  return res.json({ message: data });
});

export default router;
