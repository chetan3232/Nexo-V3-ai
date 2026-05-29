import express from 'express';
import { supabase, isMockDb } from '../database/db.js';

const router = express.Router();

// Mock cache in case database is in mock mode
const brainCache = {};

// GET cached brain for a project
router.get('/:projectId', async (req, res) => {
  const { projectId } = req.params;

  if (isMockDb || !supabase) {
    const data = brainCache[projectId] || null;
    return res.json({ brain: data });
  }

  try {
    const { data, error } = await supabase
      .from('project_brains')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return res.json({ brain: null });
      }
      return res.status(400).json({ error: error.message });
    }
    return res.json({ brain: data.brain_data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT / UPDATE brain data for a project
router.put('/:projectId', async (req, res) => {
  const { projectId } = req.params;
  const { brain } = req.body;

  if (!brain) {
    return res.status(400).json({ error: 'Brain data is required' });
  }

  if (isMockDb || !supabase) {
    brainCache[projectId] = brain;
    return res.json({ success: true, brain });
  }

  try {
    const { data, error } = await supabase
      .from('project_brains')
      .upsert({
        project_id: projectId,
        brain_data: brain,
        updated_at: new Date().toISOString()
      }, { onConflict: 'project_id' })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }
    return res.json({ success: true, brain: data.brain_data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST trigger brain scan
router.post('/scan', async (req, res) => {
  const { projectId } = req.body;
  // Trigger a scan response, representing the start of a scan
  return res.json({ success: true, message: 'Scan initiated successfully', status: 'scanning' });
});

export default router;
