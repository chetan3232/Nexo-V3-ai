import { useState, useEffect } from 'react';
import { PlusCircle, MessageSquare, Trash2, Edit2, Check } from 'lucide-react';
import { useChatStore, Conversation } from '@/store/useChatStore';
import { useFileSystemStore } from '@/store/useFileSystemStore';

export default function ChatSidebar() {
  const {
    conversations,
    activeConversationId,
    projectId,
    loadConversations,
    selectConversation,
    createConversation,
    deleteConversation,
    renameConversation,
  } = useChatStore();

  const workspacePath = useFileSystemStore((s) => s.workspacePath);
  const projectName = workspacePath ? workspacePath.split(/[\\/]/).pop() : 'Project';

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    if (projectId) void loadConversations(projectId);
  }, [projectId]);

  const handleSaveEdit = async (id: string) => {
    if (editTitle.trim()) await renameConversation(id, editTitle.trim());
    setEditingId(null);
  };

  return (
    <div style={{
      width: '200px',
      height: '100%',
      background: '#080c14',
      borderRight: '1px solid #111827',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      fontFamily: "'Inter', sans-serif",
    }}>

      {/* New Chat */}
      <div style={{ padding: '10px 8px', borderBottom: '1px solid #111827' }}>
        <button
          onClick={() => createConversation()}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '8px', color: '#4d88c4', fontSize: '12px', fontWeight: 600, padding: '7px 12px', cursor: 'pointer', transition: 'all 120ms' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(59,130,246,0.13)'; e.currentTarget.style.color = '#60a5fa'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(59,130,246,0.08)'; e.currentTarget.style.color = '#4d88c4'; }}
        >
          <PlusCircle size={12} />
          New Chat
        </button>
      </div>

      {/* Project label */}
      <div style={{ padding: '8px 12px 4px', borderBottom: '1px solid #0d1117' }}>
        <div style={{ fontSize: '9px', fontWeight: 700, color: '#1f2937', letterSpacing: '0.1em', marginBottom: '4px' }}>CURRENT PROJECT</div>
        <div style={{ fontSize: '11px', color: '#374151', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {projectName}
        </div>
      </div>

      {/* Chats list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 6px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
        <div style={{ fontSize: '9px', fontWeight: 700, color: '#1f2937', letterSpacing: '0.1em', padding: '6px 6px 4px' }}>RECENT CHATS</div>

        {conversations.length === 0 ? (
          <div style={{ fontSize: '11px', color: '#1f2937', textAlign: 'center', padding: '20px 8px' }}>
            No chats yet
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = activeConversationId === conv.id;
            const isEditing = editingId === conv.id;

            return (
              <div
                key={conv.id}
                onClick={() => { if (!isEditing) selectConversation(conv.id); }}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 7px', borderRadius: '6px', cursor: 'pointer', background: isActive ? 'rgba(59,130,246,0.08)' : 'transparent', transition: 'background 100ms', position: 'relative' }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                  const acts = e.currentTarget.querySelector('.chat-acts') as HTMLElement;
                  if (acts) acts.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                  const acts = e.currentTarget.querySelector('.chat-acts') as HTMLElement;
                  if (acts) acts.style.opacity = '0';
                }}
              >
                {isActive && (
                  <div style={{ position: 'absolute', left: 0, top: '5px', bottom: '5px', width: '2px', background: '#3b82f6', borderRadius: '0 2px 2px 0' }} />
                )}

                <MessageSquare size={10} color={isActive ? '#3b82f6' : '#1f2937'} style={{ flexShrink: 0 }} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: '3px' }} onClick={e => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(conv.id); if (e.key === 'Escape') setEditingId(null); }}
                        style={{ flex: 1, background: '#0d1117', border: '1px solid #3b82f6', borderRadius: '3px', color: '#e2e8f0', fontSize: '11px', padding: '1px 4px', outline: 'none' }}
                        autoFocus
                      />
                      <button onClick={() => handleSaveEdit(conv.id)}
                        style={{ background: '#3b82f6', border: 'none', borderRadius: '3px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
                        <Check size={9} />
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '11.5px', color: isActive ? '#d1d5db' : '#4b5563', fontWeight: isActive ? 500 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', lineHeight: '1.4' }}>
                      {conv.title}
                    </span>
                  )}
                </div>

                {!isEditing && (
                  <div className="chat-acts" style={{ display: 'flex', gap: '1px', opacity: 0, transition: 'opacity 100ms', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => { setEditingId(conv.id); setEditTitle(conv.title); }}
                      style={{ background: 'transparent', border: 'none', color: '#374151', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', borderRadius: '3px', transition: 'color 80ms' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#6b7280'}
                      onMouseLeave={e => e.currentTarget.style.color = '#374151'}
                      title="Rename">
                      <Edit2 size={9} />
                    </button>
                    <button onClick={() => deleteConversation(conv.id)}
                      style={{ background: 'transparent', border: 'none', color: '#374151', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', borderRadius: '3px', transition: 'color 80ms' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={e => e.currentTarget.style.color = '#374151'}
                      title="Delete">
                      <Trash2 size={9} />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
