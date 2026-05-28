import express from 'express';
import { supabase } from '../database/db.js';

const router = express.Router();

// Get agent state for a project
router.get('/:projectId', async (req, res) => {
  const { projectId } = req.params;
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('project_id', projectId)
    .single();

  if (error) {
    // If agent doesn't exist, create an idle default
    const defaultAgent = {
      project_id: projectId,
      status: 'idle',
      current_goal: '',
      task_graph: [],
    };
    await supabase.from('agents').insert(defaultAgent).select();
    return res.json({ agent: defaultAgent });
  }
  return res.json({ agent: data });
});

// Update agent state / task graphs
router.post('/update', async (req, res) => {
  const { projectId, status, current_goal, task_graph } = req.body;
  if (!projectId) {
    return res.status(400).json({ error: 'projectId is required' });
  }

  const updateObj = {};
  if (status) updateObj.status = status;
  if (current_goal !== undefined) updateObj.current_goal = current_goal;
  if (task_graph) updateObj.task_graph = task_graph;

  const { data, error } = await supabase
    .from('agents')
    .upsert({
      project_id: projectId,
      ...updateObj,
    }, {
      onConflict: 'project_id',
    })
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  return res.json({ agent: data });
});

export default router;
