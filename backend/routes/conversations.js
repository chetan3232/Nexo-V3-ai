import express from 'express';
import { supabase } from '../database/db.js';

const router = express.Router();

// 1. List conversations for a project (workspace), sorted by pinned, favorite, and updated_at descending
router.get('/', async (req, res) => {
  const { project_id } = req.query;
  if (!project_id) {
    return res.status(400).json({ error: 'project_id is required' });
  }

  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('project_id', project_id);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  // Sort them: pinned first, then favorite, then updated_at descending
  const sorted = [...(data || [])].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) {
      return a.is_pinned ? -1 : 1;
    }
    if (a.is_favorite !== b.is_favorite) {
      return a.is_favorite ? -1 : 1;
    }
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  return res.json({ conversations: sorted });
});

// 2. Create a new conversation
router.post('/', async (req, res) => {
  const { project_id, title, model } = req.body;
  if (!project_id || !model) {
    return res.status(400).json({ error: 'project_id and model are required' });
  }

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      project_id,
      title: title || 'New Conversation',
      model,
      is_pinned: false,
      is_favorite: false
    })
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.json({ conversation: data });
});

// 3. Update conversation (Rename, Pin, Favorite)
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, is_pinned, is_favorite } = req.body;

  const updateFields = {};
  if (title !== undefined) updateFields.title = title;
  if (is_pinned !== undefined) updateFields.is_pinned = is_pinned;
  if (is_favorite !== undefined) updateFields.is_favorite = is_favorite;
  updateFields.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('conversations')
    .update(updateFields)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.json({ conversation: data });
});

// 4. Delete conversation
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', id);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.json({ success: true, message: 'Conversation deleted successfully' });
});

// 5. Fork/Branch Conversation
router.post('/:id/fork', async (req, res) => {
  const { id } = req.params;
  const { forked_message_id, branch_title } = req.body;

  if (!forked_message_id) {
    return res.status(400).json({ error: 'forked_message_id is required' });
  }

  try {
    // A. Fetch parent conversation
    const { data: parentConv, error: parentError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (parentError || !parentConv) {
      return res.status(404).json({ error: parentError?.message || 'Parent conversation not found' });
    }

    // B. Fetch messages for parent conversation in order
    const { data: parentMessages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (messagesError || !parentMessages) {
      return res.status(400).json({ error: messagesError?.message || 'Failed to fetch parent messages' });
    }

    // C. Find index of the forked message
    const forkIndex = parentMessages.findIndex(m => m.id === forked_message_id);
    if (forkIndex === -1) {
      return res.status(404).json({ error: 'Fork message not found in this conversation history' });
    }

    // Get messages up to and including the forkIndex
    const messagesToFork = parentMessages.slice(0, forkIndex + 1);

    // D. Create new conversation record
    const defaultTitle = `${parentConv.title} (Forked)`;
    const { data: newConv, error: newConvError } = await supabase
      .from('conversations')
      .insert({
        project_id: parentConv.project_id,
        title: branch_title || defaultTitle,
        model: parentConv.model,
        is_pinned: false,
        is_favorite: false
      })
      .select()
      .single();

    if (newConvError || !newConv) {
      return res.status(400).json({ error: newConvError?.message || 'Failed to create branched conversation' });
    }

    // E. Duplicate messages associated with new conversation
    const messagesInsertData = messagesToFork.map(m => ({
      project_id: m.project_id,
      sender_id: m.sender_id,
      role: m.role,
      text: m.text,
      conversation_id: newConv.id,
      tokens_used: m.tokens_used || 0,
      has_attachments: m.has_attachments || false
    }));

    const { data: duplicatedMessages, error: insertError } = await supabase
      .from('messages')
      .insert(messagesInsertData);

    if (insertError) {
      // Clean up conversation if message creation failed
      await supabase.from('conversations').delete().eq('id', newConv.id);
      return res.status(400).json({ error: insertError.message });
    }

    // F. Create chat branch record
    const { error: branchRecordError } = await supabase
      .from('chat_branches')
      .insert({
        parent_conversation_id: id,
        forked_message_id: forked_message_id,
        branched_conversation_id: newConv.id
      });

    if (branchRecordError) {
      console.error('[Fork] Failed to write chat_branches link:', branchRecordError.message);
      // Don't fail the whole request since conversation and messages are created
    }

    return res.json({
      conversation: newConv,
      messages: duplicatedMessages
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
