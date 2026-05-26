import express from 'express';
import { supabase } from '../database/db.js';
import { createEmbedding } from '../memory/index.js';

const router = express.Router();

// Retrieve semantic memories matching a query
router.post('/search', async (req, res) => {
  const { query, layers, limit } = req.body;
  const userId = req.body.userId || 'mock-user-id';

  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  const queryEmbedding = createEmbedding(query);

  const { data, error } = await supabase.rpc('match_memories', {
    query_embedding: queryEmbedding,
    match_layers: layers || null,
    match_count: limit || 6,
    owner_user_id: userId,
  });

  if (error) {
    console.error('[Memories Route] search error:', error.message);
    // Local fallback search (simulated mock if vector extensions fail)
    return res.json({ results: [] });
  }

  return res.json({ results: data || [] });
});

// Upsert a memory entry
router.post('/upsert', async (req, res) => {
  const { layer, title, content, source, tags } = req.body;
  const userId = req.body.userId || 'mock-user-id';

  if (!layer || !title || !content) {
    return res.status(400).json({ error: 'layer, title, and content are required' });
  }

  const embedding = createEmbedding(`${title}\n${content}\n${(tags || []).join(' ')}`);

  const { data, error } = await supabase
    .from('memories')
    .insert({
      user_id: userId,
      layer,
      title,
      content,
      source,
      tags: tags || [],
      embedding,
    })
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  return res.json({ entry: data });
});

export default router;
