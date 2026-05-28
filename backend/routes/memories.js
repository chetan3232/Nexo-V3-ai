import express from 'express';
import path from 'node:path';
import { supabase, isMockDb } from '../database/db.js';
import { FileMemoryEngine } from '../memoryEngine.js';

const router = express.Router();
const workspaceRoot = path.resolve(process.env.NEXO_WORKSPACE_ROOT ?? process.cwd());
const localEngine = new FileMemoryEngine(workspaceRoot);

// Retrieve semantic memories matching a query
router.post('/search', async (req, res) => {
  const { query, layers, limit } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  // 1. If we are running in Mock mode or Supabase is disconnected, use the local engine router
  if (isMockDb || !supabase) {
    try {
      const results = await localEngine.search(query, layers, limit || 6);
      return res.json({ results });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // 2. Query Supabase pgvector RPC
  try {
    const results = await localEngine.search(query, layers, limit || 6);
    return res.json({ results });
  } catch (error) {
    console.error('[Memories Route] search error, falling back to JSON:', error.message);
    try {
      const results = await localEngine.search(query, layers, limit || 6);
      return res.json({ results });
    } catch (e) {
      return res.json({ results: [] });
    }
  }
});

// Upsert a memory entry
router.post('/upsert', async (req, res) => {
  const { layer, title, content, source, tags } = req.body;

  if (!layer || !title || !content) {
    return res.status(400).json({ error: 'layer, title, and content are required' });
  }

  // Always write via localEngine, which internally handles Supabase, ChromaDB, and Local JSON routing
  try {
    const entry = await localEngine.upsert({
      layer,
      title,
      content,
      source,
      tags: tags || []
    });
    return res.json({ entry });
  } catch (error) {
    console.error('[Memories Route] upsert error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
