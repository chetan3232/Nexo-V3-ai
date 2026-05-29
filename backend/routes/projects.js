import express from 'express';
import { supabase } from '../database/db.js';

const router = express.Router();

// Get all projects for current user
router.get('/', async (req, res) => {
  const userId = req.query.userId || 'mock-user-id'; // standard mock or parsed header/JWT user
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_id', userId);

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  return res.json({ projects: data });
});

// Create new project
router.post('/', async (req, res) => {
  const { name, description } = req.body;
  const userId = req.body.userId || 'mock-user-id';

  if (!name) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({
      name,
      description,
      owner_id: userId,
    })
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  return res.json({ project: data });
});

// Resolve project ID by workspace path (creating it if it doesn't exist)
router.post('/resolve', async (req, res) => {
  const { path: wsPath, name: wsName, userId } = req.body;
  const ownerId = userId || 'mock-user-id';
  
  if (!wsPath) {
    return res.status(400).json({ error: 'Workspace path is required' });
  }

  const name = wsName || wsPath.split(/[\\/]/).pop() || 'Nexo Project';

  const { data: existing, error: searchError } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_id', ownerId);

  if (searchError) {
    return res.status(400).json({ error: searchError.message });
  }

  let project = (existing || []).find(p => p.description === wsPath);

  if (!project) {
    const { data: newProj, error: createError } = await supabase
      .from('projects')
      .insert({
        name,
        description: wsPath,
        owner_id: ownerId
      })
      .select()
      .single();

    if (createError) {
      return res.status(400).json({ error: createError.message });
    }
    project = newProj;
  }

  return res.json({ project });
});

// Get a single project by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return res.status(404).json({ error: 'Project not found' });
  }
  return res.json({ project: data });
});

// Delete a project
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  return res.json({ ok: true });
});

export default router;
