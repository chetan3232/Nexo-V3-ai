import { useState, useEffect } from 'react';
import {
  MessageSquare, Pin, Star, Trash2, Edit2, Download, Upload,
  Search, Sparkles, X, PlusCircle, Check, FolderOpen
} from 'lucide-react';
import { useChatStore, Conversation } from '@/store/useChatStore';

const API_BASE = import.meta.env.VITE_NEXO_API_URL ?? 'http://localhost:8787';

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
    togglePinConversation,
    toggleFavoriteConversation,
    exportChat,
    importChat
  } = useChatStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [semanticResults, setSemanticResults] = useState<any[] | null>(null);
  const [isSearchingSemantic, setIsSearchingSemantic] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Load conversations on component mount or project change
  useEffect(() => {
    if (projectId) {
      void loadConversations(projectId);
    }
  }, [projectId]);

  // Handle Export Chat
  const handleExport = (id: string, title: string) => {
    const dataStr = exportChat(id);
    if (!dataStr) return;
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_chat.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Handle Import Chat
  const handleImport = () => {
    const inputElement = document.createElement('input');
    inputElement.type = 'file';
    inputElement.accept = '.json';
    inputElement.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (evt: any) => {
        const content = evt.target.result;
        const success = await importChat(content);
        if (success) {
          alert('Chat imported successfully!');
        } else {
          alert('Failed to import chat.');
        }
      };
      reader.readAsText(file);
    };
    inputElement.click();
  };

  // Handle Semantic Vector Search
  const triggerSemanticSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearchingSemantic(true);
    try {
      const response = await fetch(`${API_BASE}/api/search/chat-semantic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });
      if (response.ok) {
        const data = await response.json();
        setSemanticResults(data.results || []);
      }
    } catch (e) {
      console.error('[Sidebar] Semantic search failed:', e);
    } finally {
      setIsSearchingSemantic(false);
    }
  };

  const handleStartEdit = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveEdit = async (id: string) => {
    if (editTitle.trim()) {
      await renameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  // Filter conversations locally if not doing semantic search
  const filteredConvs = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group conversations into pinned, favorites, and general lists
  const pinnedConvs = filteredConvs.filter(c => c.is_pinned);
  const favoriteConvs = filteredConvs.filter(c => c.is_favorite && !c.is_pinned);
  const generalConvs = filteredConvs.filter(c => !c.is_pinned && !c.is_favorite);

  return (
    <div style={{
      width: '260px',
      height: '100%',
      background: 'rgba(10, 15, 30, 0.95)',
      borderRight: '1px solid #1f2937',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
      flexShrink: 0
    }}>
      {/* ── Search & Actions Bar ── */}
      <div style={{ padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid #1f2937' }}>
        
        {/* New Chat & Import Button Row */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => createConversation()}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: '#3b82f6',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              fontSize: '12px',
              fontWeight: 600,
              padding: '8px 0',
              cursor: 'pointer',
              transition: 'background 120ms'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
          >
            <PlusCircle size={14} />
            New Chat
          </button>
          <button
            onClick={handleImport}
            title="Import JSON Chat"
            style={{
              width: '32px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid #374151',
              borderRadius: '6px',
              color: '#9ca3af',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 120ms'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#4b5563'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#374151'}
          >
            <Upload size={14} />
          </button>
        </div>

        {/* Search Input Container */}
        <div style={{ display: 'flex', gap: '4px', position: 'relative' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (semanticResults && !e.target.value) {
                  setSemanticResults(null);
                }
              }}
              style={{
                width: '100%',
                background: '#0d1117',
                border: '1px solid #1f2937',
                borderRadius: '6px',
                color: '#e2e8f0',
                fontSize: '11.5px',
                padding: '6px 26px 6px 8px',
                outline: 'none'
              }}
            />
            {searchQuery && (
              <X
                size={12}
                color="#6b7280"
                style={{ position: 'absolute', right: '8px', top: '9px', cursor: 'pointer' }}
                onClick={() => {
                  setSearchQuery('');
                  setSemanticResults(null);
                }}
              />
            )}
          </div>
          <button
            onClick={triggerSemanticSearch}
            title="Semantic AI Search"
            disabled={!searchQuery.trim() || isSearchingSemantic}
            style={{
              padding: '0 8px',
              background: 'rgba(96, 165, 250, 0.1)',
              border: '1px solid rgba(96, 165, 250, 0.2)',
              borderRadius: '6px',
              color: '#60a5fa',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: searchQuery.trim() ? 1 : 0.5
            }}
          >
            {isSearchingSemantic ? (
              <span style={{ fontSize: '9px' }}>...</span>
            ) : (
              <Sparkles size={13} />
            )}
          </button>
        </div>
      </div>

      {/* ── Scrollable Chat List ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        {/* Semantic Search Results Section */}
        {semanticResults !== null && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 4px 6px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#60a5fa', letterSpacing: '0.05em' }}>AI SEMANTIC RESULTS</span>
              <button
                onClick={() => setSemanticResults(null)}
                style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '9px', cursor: 'pointer' }}
              >
                Clear
              </button>
            </div>
            {semanticResults.length === 0 ? (
              <div style={{ fontSize: '11px', color: '#4b5563', textAlign: 'center', padding: '8px' }}>
                No semantic matches found.
              </div>
            ) : (
              semanticResults.map((result, idx) => {
                const convId = result.source;
                const conv = conversations.find(c => c.id === convId);
                const title = conv ? conv.title : 'Conversation';
                const snippet = result.content.replace(/\[(user|assistant)\]\s*/, '');
                
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (convId) selectConversation(convId);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: 'rgba(96, 165, 250, 0.04)',
                      border: '1px dashed rgba(96, 165, 250, 0.2)',
                      borderRadius: '6px',
                      padding: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#60a5fa' }}>{title}</span>
                    <span style={{ fontSize: '10.5px', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                      {snippet}
                    </span>
                    <span style={{ fontSize: '9px', color: '#4b5563', alignSelf: 'flex-end' }}>
                      Match score: {Math.round(result.score * 100)}%
                    </span>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Regular lists */}
        {semanticResults === null && (
          <>
            {/* Pinned Folder */}
            {pinnedConvs.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#e5e7eb', display: 'flex', alignItems: 'center', gap: '4px', paddingLeft: '4px' }}>
                  <Pin size={10} color="#f59e0b" fill="#f59e0b" /> PINNED
                </div>
                {pinnedConvs.map(conv => renderChatCard(conv))}
              </div>
            )}

            {/* Favorites Folder */}
            {favoriteConvs.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#e5e7eb', display: 'flex', alignItems: 'center', gap: '4px', paddingLeft: '4px' }}>
                  <Star size={10} color="#eab308" fill="#eab308" /> FAVORITES
                </div>
                {favoriteConvs.map(conv => renderChatCard(conv))}
              </div>
            )}

            {/* General Conversations Folder */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#4b5563', paddingLeft: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MessageSquare size={10} /> RECENT CHATS
              </div>
              {generalConvs.length === 0 && pinnedConvs.length === 0 && favoriteConvs.length === 0 ? (
                <div style={{ fontSize: '11px', color: '#4b5563', textAlign: 'center', padding: '12px 0' }}>
                  No active chats.
                </div>
              ) : (
                generalConvs.map(conv => renderChatCard(conv))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );

  // Render Individual Chat Timeline Card
  function renderChatCard(conv: Conversation) {
    const isActive = activeConversationId === conv.id;
    const isEditing = editingId === conv.id;

    return (
      <div
        key={conv.id}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
          border: `1px solid ${isActive ? 'rgba(59, 130, 246, 0.2)' : 'transparent'}`,
          borderRadius: '6px',
          padding: '6px 8px',
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 120ms'
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
          const actionRow = e.currentTarget.querySelector('.chat-actions');
          if (actionRow) (actionRow as HTMLElement).style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.background = 'transparent';
          const actionRow = e.currentTarget.querySelector('.chat-actions');
          if (actionRow) (actionRow as HTMLElement).style.opacity = '0';
        }}
        onClick={() => {
          if (!isEditing) selectConversation(conv.id);
        }}
      >
        {/* Active Line indicator */}
        {isActive && (
          <div style={{ position: 'absolute', left: 0, top: '4px', bottom: '4px', width: '3px', background: '#3b82f6', borderRadius: '0 3px 3px 0' }} />
        )}

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {isEditing ? (
            <div style={{ display: 'flex', gap: '4px', width: '100%' }} onClick={e => e.stopPropagation()}>
              <input
                type="text"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSaveEdit(conv.id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                style={{
                  flex: 1,
                  background: '#0d1117',
                  border: '1px solid #3b82f6',
                  borderRadius: '3px',
                  color: 'white',
                  fontSize: '11px',
                  padding: '2px 4px',
                  outline: 'none'
                }}
                autoFocus
              />
              <button
                onClick={() => handleSaveEdit(conv.id)}
                style={{ background: '#3b82f6', border: 'none', borderRadius: '3px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', cursor: 'pointer' }}
              >
                <Check size={10} />
              </button>
            </div>
          ) : (
            <span style={{
              fontSize: '12px',
              color: isActive ? '#e2e8f0' : '#9ca3af',
              fontWeight: isActive ? 600 : 400,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'block'
            }}>
              {conv.title}
            </span>
          )}
          
          <span style={{ fontSize: '9px', color: '#4b5563', marginTop: '1px' }}>
            {conv.model?.split('/').pop() || 'GLM'}
          </span>
        </div>

        {/* Hover action bar */}
        {!isEditing && (
          <div
            className="chat-actions"
            style={{
              display: 'flex',
              gap: '4px',
              opacity: 0,
              transition: 'opacity 120ms',
              backgroundColor: isActive ? 'rgba(10, 15, 30, 0.95)' : '#111827',
              paddingLeft: '4px'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => handleStartEdit(conv)}
              title="Rename"
              style={iconBtnStyle}
            >
              <Edit2 size={10} />
            </button>
            <button
              onClick={() => togglePinConversation(conv.id, !conv.is_pinned)}
              title={conv.is_pinned ? "Unpin" : "Pin"}
              style={iconBtnStyle}
            >
              <Pin size={10} color={conv.is_pinned ? "#f59e0b" : "#4b5563"} fill={conv.is_pinned ? "#f59e0b" : "none"} />
            </button>
            <button
              onClick={() => toggleFavoriteConversation(conv.id, !conv.is_favorite)}
              title={conv.is_favorite ? "Unfavorite" : "Favorite"}
              style={iconBtnStyle}
            >
              <Star size={10} color={conv.is_favorite ? "#eab308" : "#4b5563"} fill={conv.is_favorite ? "#eab308" : "none"} />
            </button>
            <button
              onClick={() => handleExport(conv.id, conv.title)}
              title="Export"
              style={iconBtnStyle}
            >
              <Download size={10} />
            </button>
            <button
              onClick={() => deleteConversation(conv.id)}
              title="Delete"
              style={{ ...iconBtnStyle, color: '#ef4444' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Trash2 size={10} />
            </button>
          </div>
        )}
      </div>
    );
  }
}

const iconBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  borderRadius: '4px',
  color: '#6b7280',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '4px',
  transition: 'color 120ms, background-color 120ms',
};
