import express from 'express';
import { supabase } from '../database/db.js';

const router = express.Router();

// Retrieve all messages for a specific conversation (preferred) or project (fallback)
router.get('/', async (req, res) => {
  const { conversation_id, project_id } = req.query;

  if (!conversation_id && !project_id) {
    return res.status(400).json({ error: 'Either conversation_id or project_id is required' });
  }

  let query = supabase.from('messages').select('*');

  if (conversation_id) {
    query = query.eq('conversation_id', conversation_id);
  } else {
    query = query.eq('project_id', project_id);
  }

  const { data: messages, error } = await query.order('created_at', { ascending: true });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  // Fetch attachments for all messages that have attachments
  const messagesWithAttachments = await Promise.all((messages || []).map(async (msg) => {
    if (msg.has_attachments) {
      const { data: attachments } = await supabase
        .from('attachments')
        .select('*')
        .eq('message_id', msg.id);
      return { ...msg, attachments: attachments || [] };
    }
    return { ...msg, attachments: [] };
  }));

  return res.json({ messages: messagesWithAttachments });
});

// Retrieve all messages for a specific project (Backwards Compatibility)
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

  // Fetch attachments
  const messagesWithAttachments = await Promise.all((data || []).map(async (msg) => {
    if (msg.has_attachments) {
      const { data: attachments } = await supabase
        .from('attachments')
        .select('*')
        .eq('message_id', msg.id);
      return { ...msg, attachments: attachments || [] };
    }
    return { ...msg, attachments: [] };
  }));

  return res.json({ messages: messagesWithAttachments });
});

// Post a new message with optional attachments
router.post('/', async (req, res) => {
  const { projectId, senderId, role, text, conversationId, tokensUsed, attachments } = req.body;
  if (!projectId || !role || !text) {
    return res.status(400).json({ error: 'projectId, role, and text are required' });
  }

  const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

  // 1. Insert message
  const { data: message, error: messageError } = await supabase
    .from('messages')
    .insert({
      project_id: projectId,
      sender_id: senderId || null,
      role,
      text,
      conversation_id: conversationId || null,
      tokens_used: tokensUsed || 0,
      has_attachments: hasAttachments
    })
    .select()
    .single();

  if (messageError || !message) {
    return res.status(400).json({ error: messageError?.message || 'Failed to save message' });
  }

  // 2. Insert attachments if present
  let savedAttachments = [];
  if (hasAttachments) {
    const attachmentRows = attachments.map(att => ({
      message_id: message.id,
      file_name: att.file_name || 'attachment',
      file_size: att.file_size || 0,
      mime_type: att.mime_type || 'text/plain',
      file_path: att.file_path || ''
    }));

    const { data: insertedAttachments, error: attachmentError } = await supabase
      .from('attachments')
      .insert(attachmentRows);

    if (attachmentError) {
      console.error('[Messages] Failed to save attachments:', attachmentError.message);
    } else {
      savedAttachments = insertedAttachments || [];
    }
  }

  // 3. Update conversation updated_at if conversationId is provided
  if (conversationId) {
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);
  }

  // 4. Index message into the memory engine if available
  const memoryEngine = req.app.get('memoryEngine');
  if (memoryEngine && text) {
    try {
      await memoryEngine.upsert({
        layer: 'conversation',
        title: `Message in conversation ${conversationId || 'default'}`,
        content: `[${role}] ${text}`,
        source: conversationId || projectId,
        tags: [role, projectId]
      });
    } catch (e) {
      console.error('[Messages] Failed to index message for semantic search:', e.message);
    }
  }

  return res.json({
    message: {
      ...message,
      attachments: savedAttachments
    }
  });
});

export default router;
