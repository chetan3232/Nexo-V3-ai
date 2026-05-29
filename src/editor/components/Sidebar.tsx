import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, MoreHorizontal, FilePlus, FolderPlus,
  GitBranch, Search, Package, Bug, Sparkles, Brain, Loader, Check
} from 'lucide-react';
import { useFileSystemStore } from '@/store/useFileSystemStore';
import { useEditorStore } from '@/store/useEditorStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { streamAIResponse } from '@/services/aiStreamClient';
import { ExplorerTree } from '@/explorer/ExplorerTree';
import { DebuggerPanel } from './DebuggerPanel';
import { AITeamPanel } from './AITeamPanel';
import { TimeTravelPanel } from '@/git/TimeTravelPanel';
import { BuildPanel } from '@/cloud/BuildPanel';
import { AiTimelinePanel } from './AiTimelinePanel';

const API_BASE = import.meta.env.VITE_NEXO_API_URL ?? 'http://localhost:8787';

type Props = {
  collapsed: boolean;
  activeTab: number;
  onToggleCanvas: () => void;
  isCanvasOpen: boolean;
};

const sectionVariants = {
  hidden:  { opacity: 0, x: -4 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.15 } },
};

type GitStatusFile = {
  path: string;
  status: string;
};

export function Sidebar({ collapsed, activeTab }: Props) {
  const { workspacePath, syncFromBackend, createFile, createFolder, openFolder } = useFileSystemStore();
  const openFile = useEditorStore((s) => s.openFile);
  const showToast = useNotificationStore((s) => s.showToast);

  // ── Search State ──
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [isSemantic, setIsSemantic] = useState(true);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // ── Source Control State ──
  const [changedFiles, setChangedFiles] = useState<GitStatusFile[]>([]);
  const [commitMsg, setCommitMsg] = useState('');
  const [gitLoading, setGitLoading] = useState(false);
  const [aiGeneratingMsg, setAiGeneratingMsg] = useState(false);

  // ── Timeline Accordion State ──
  const [timelineExpanded, setTimelineExpanded] = useState(true);

  // Load Git status files
  const fetchGitStatus = async () => {
    setGitLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/git/status`);
      if (!response.ok) throw new Error('Status failed');
      const data = await response.json();
      setChangedFiles(data.files || []);
    } catch (err) {
      // Ignore or log silently
    } finally {
      setGitLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 2) {
      fetchGitStatus();
    }
  }, [activeTab]);

  // Execute AI Commit message generation
  const handleAIGenerateCommit = async () => {
    if (aiGeneratingMsg) return;
    setAiGeneratingMsg(true);
    setCommitMsg('');

    try {
      showToast('Generating AI commit message...', 'info');
      const diffResponse = await fetch(`${API_BASE}/api/git/diff`);
      if (!diffResponse.ok) throw new Error('Failed to get diff');
      const diffData = await diffResponse.json();
      const diffText = diffData.diff;

      if (!diffText || diffText === 'No modifications found.') {
        showToast('No modifications found to generate commit message.', 'info');
        setCommitMsg('refactor: minor cleanups');
        setAiGeneratingMsg(false);
        return;
      }

      // Stream response from auto router AI
      const promptMessages = [
        {
          role: 'user' as const,
          content: `Generate a short, single-line conventional git commit message based on this diff. Output ONLY the message itself without quotation marks, markdown formatting, bullet points, or explanations. Limit to 60 characters:\n\n${diffText}`
        }
      ];

      let generated = '';
      await streamAIResponse(
        promptMessages,
        'nexo-auto-router',
        {
          onToken: (token) => {
            generated += token;
            setCommitMsg(generated);
          },
          onDone: () => {
            setAiGeneratingMsg(false);
            showToast('AI commit message generated!', 'success');
          },
          onError: (err) => {
            showToast(`AI generation error: ${err.message}`, 'error');
            setAiGeneratingMsg(false);
          }
        }
      );
    } catch (err: any) {
      showToast(`AI commit generator error: ${err.message}`, 'error');
      setAiGeneratingMsg(false);
    }
  };

  // Perform git commit
  const handleCommit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMsg.trim() || gitLoading) return;
    setGitLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/git/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: commitMsg.trim() })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Commit failed');
      }

      showToast('Changes committed successfully!', 'success');
      setCommitMsg('');
      await fetchGitStatus();
      await syncFromBackend().catch(() => undefined);
    } catch (err: any) {
      showToast(`Commit failed: ${err.message}`, 'error');
    } finally {
      setGitLoading(false);
    }
  };

  // Execute Semantic or standard search
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() || searchLoading) return;
    setSearchLoading(true);
    try {
      if (isSemantic) {
        const response = await fetch(`${API_BASE}/api/search/semantic`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: searchQuery.trim() })
        });
        if (!response.ok) throw new Error('Semantic search failed');
        const data = await response.json();
        setSearchResults(data.results || []);
      } else {
        // Fallback standard text search: query semantic endpoint with simple filtering
        const response = await fetch(`${API_BASE}/api/search/semantic`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: searchQuery.trim() })
        });
        if (!response.ok) throw new Error('Search failed');
        const data = await response.json();
        // Return results above score 0.3 for basic relevance
        setSearchResults((data.results || []).filter((r: any) => r.score > 0.1));
      }
    } catch (err: any) {
      showToast(`Search failed: ${err.message}`, 'error');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleOpenFolder = async () => {
    const isElectron = typeof window !== 'undefined' && !!(window as any).nexoDesktop;
    if (isElectron) {
      const selected = await (window as any).nexoDesktop.selectFolder();
      if (selected) {
        await openFolder(selected);
      }
    } else {
      const path = prompt("Enter local workspace directory path:");
      if (path) {
        await openFolder(path);
      }
    }
  };

  const handleCreateFileRoot = async () => {
    const name = prompt("Enter new file name (at root):");
    if (name?.trim()) {
      await createFile('', name.trim());
    }
  };

  const handleCreateFolderRoot = async () => {
    const name = prompt("Enter new folder name (at root):");
    if (name?.trim()) {
      await createFolder('', name.trim());
    }
  };

  const rootFolderName = workspacePath
    ? workspacePath.split(/[\\/]/).pop()?.toUpperCase()
    : 'MY-AWESOME-APP';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'M': return '#f59e0b'; // modified
      case 'A': return '#10b981'; // added
      case 'D': return '#ef4444'; // deleted
      case '??': return '#6b7280'; // untracked
      default: return '#9ca3af';
    }
  };

  if (collapsed) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.aside
        key={activeTab}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        style={{
          height: '100%',
          background: '#111827',
          borderRight: '1px solid #1f2937',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* ── FILE EXPLORER (activeTab === 0) ── */}
        {activeTab === 0 && (
          <>
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px 6px',
              flexShrink: 0,
            }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#c9d1d9',
              }}>
                Explorer
              </span>
              <div style={{ display: 'flex', gap: '2px' }}>
                {[FilePlus, FolderPlus, RefreshCw, MoreHorizontal].map((Icon, i) => {
                  const onClickHandler = 
                    i === 0 ? handleCreateFileRoot :
                    i === 1 ? handleCreateFolderRoot :
                    i === 2 ? () => void syncFromBackend().catch(() => undefined) :
                    handleOpenFolder;
                  
                  const titleText = 
                    i === 0 ? "New File (Root)" :
                    i === 1 ? "New Folder (Root)" :
                    i === 2 ? "Refresh Tree" :
                    "Open Workspace Folder";

                  return (
                    <button
                      key={i}
                      onClick={onClickHandler}
                      title={titleText}
                      style={{
                        background: 'none', border: 'none', padding: '3px',
                        cursor: 'pointer', color: '#4b5563', borderRadius: '4px',
                        display: 'flex', transition: 'color 100ms',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#4b5563'; }}
                    >
                      <Icon size={14} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Project section */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div 
                onClick={handleOpenFolder}
                title="Change Workspace Folder"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px 3px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: '#c9d1d9',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.color = '#3b82f6'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.color = '#c9d1d9'; }}
              >
                <span style={{ fontSize: '10px', color: '#6b7280' }}>▾</span>
                <span>{rootFolderName}</span>
              </div>

              {/* File tree */}
              <ExplorerTree />
            </div>

            {/* Outline section */}
            <div style={{ borderTop: '1px solid #1f2937', flexShrink: 0 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: '#6b7280',
                cursor: 'pointer',
              }}>
                <span style={{ fontSize: '10px' }}>›</span>
                <span>OUTLINE</span>
              </div>
            </div>
            <div style={{ borderTop: '1px solid #1f2937', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
              <div
                onClick={() => setTimelineExpanded(!timelineExpanded)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: timelineExpanded ? '#3b82f6' : '#6b7280',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: '10px', transform: timelineExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 150ms', display: 'inline-block' }}>›</span>
                <span>AI TIMELINE</span>
              </div>
              {timelineExpanded && (
                <div style={{ borderTop: '1px solid #1f2937', background: '#0d1117', overflowY: 'auto', maxHeight: '250px' }}>
                  <AiTimelinePanel />
                </div>
              )}
            </div>
          </>
        )}

        {/* ── SEARCH (activeTab === 1) ── */}
        {activeTab === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '10px 12px 0', overflow: 'hidden' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: '#c9d1d9', marginBottom: '10px',
              flexShrink: 0,
            }}>
              <span>Search Workspace</span>
              <button
                onClick={() => setIsSemantic(!isSemantic)}
                title={isSemantic ? "Semantic vector search active" : "Standard text search active"}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isSemantic ? '#06b6d4' : '#4b5563',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '9px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                <Brain size={12} />
                <span>{isSemantic ? 'Semantic' : 'Regex'}</span>
              </button>
            </div>

            <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  placeholder={isSemantic ? "Describe what code you want to find..." : "Standard pattern search..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%', background: '#0d1117', border: '1px solid #1f2937',
                    borderRadius: '5px', color: '#e2e8f0', fontSize: '13px',
                    padding: '6px 28px 6px 10px', outline: 'none', boxSizing: 'border-box',
                  }}
                />
                <button
                  type="submit"
                  disabled={searchLoading}
                  style={{
                    position: 'absolute',
                    right: '6px',
                    background: 'none',
                    border: 'none',
                    color: '#6b7280',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {searchLoading ? <Loader size={13} className="animate-spin" /> : <Search size={13} />}
                </button>
              </div>

              <input
                placeholder="Replace content"
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
                style={{
                  width: '100%', background: '#0d1117', border: '1px solid #1f2937',
                  borderRadius: '5px', color: '#e2e8f0', fontSize: '13px',
                  padding: '5px 10px', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </form>

            {/* Results listing */}
            <div style={{ flex: 1, overflowY: 'auto', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '12px' }}>
              {searchLoading ? (
                <div style={{ color: '#4b5563', fontSize: '11px', fontStyle: 'italic' }}>
                  Scanning index layers...
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((res, i) => (
                  <div
                    key={i}
                    onClick={() => openFile(res.source)}
                    style={{
                      padding: '8px',
                      borderRadius: '6px',
                      background: 'rgba(255,255,255,0.01)',
                      border: '1px solid #1f2937',
                      cursor: 'pointer',
                      fontSize: '11px',
                      color: '#e2e8f0',
                      transition: 'border-color 100ms',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1f2937'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: '#60a5fa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: '4px' }}>
                        {res.title}
                      </span>
                      {res.score !== undefined && (
                        <span style={{ fontSize: '8px', color: '#10b981', fontWeight: 'bold', flexShrink: 0 }}>
                          {Math.round(res.score * 100)}% Match
                        </span>
                      )}
                    </div>
                    <p style={{
                      fontSize: '10px',
                      color: '#6e7681',
                      fontFamily: 'monospace',
                      marginTop: '4px',
                      margin: '4px 0 0',
                      lineHeight: '1.4',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {res.content}
                    </p>
                  </div>
                ))
              ) : searchQuery ? (
                <div style={{ color: '#4b5563', fontSize: '11px', fontStyle: 'italic' }}>
                  No matching workspace snippets found.
                </div>
              ) : (
                <div style={{ color: '#4b5563', fontSize: '11px', fontStyle: 'italic' }}>
                  Press Enter to perform {isSemantic ? 'semantic AI vector' : 'local file pattern'} search.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SOURCE CONTROL (activeTab === 2) ── */}
        {activeTab === 2 && (
          <div style={{ padding: '10px 0 0', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div style={{
              fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: '#c9d1d9', padding: '0 14px 10px',
              flexShrink: 0,
            }}>
              Source Control
            </div>
            
            <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflowY: 'auto' }}>
              <div style={{
                background: '#0d1117', border: '1px solid #1f2937', borderRadius: '6px',
                padding: '7px 10px', fontSize: '12px', color: '#9ca3af',
                display: 'flex', alignItems: 'center', gap: '6px',
                flexShrink: 0,
              }}>
                <GitBranch size={13} style={{ color: '#06b6d4' }} />
                <span>workspace changes</span>
              </div>

              {/* Commit form */}
              <form onSubmit={handleCommit} style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                <div style={{ position: 'relative' }}>
                  <textarea
                    placeholder="Commit message..."
                    value={commitMsg}
                    onChange={(e) => setCommitMsg(e.target.value)}
                    rows={2}
                    disabled={gitLoading || aiGeneratingMsg}
                    style={{
                      width: '100%', background: '#0d1117', border: '1px solid #1f2937',
                      borderRadius: '5px', color: '#e2e8f0', fontSize: '12px',
                      padding: '6px 28px 6px 8px', outline: 'none', boxSizing: 'border-box',
                      resize: 'none', fontFamily: 'inherit',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAIGenerateCommit}
                    disabled={aiGeneratingMsg || gitLoading}
                    title="Write Commit Message with AI"
                    style={{
                      position: 'absolute',
                      right: '6px',
                      bottom: '8px',
                      background: 'none',
                      border: 'none',
                      color: aiGeneratingMsg ? '#06b6d4' : '#6b7280',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {aiGeneratingMsg ? <Loader size={13} className="animate-spin" /> : <Sparkles size={13} />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={gitLoading || !commitMsg.trim()}
                  style={{
                    background: (gitLoading || !commitMsg.trim()) ? '#1f2937' : '#06b6d4',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '5px',
                    padding: '6px 0',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: (gitLoading || !commitMsg.trim()) ? 'not-allowed' : 'pointer',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    transition: 'background 120ms',
                  }}
                >
                  {gitLoading ? <Loader size={11} className="animate-spin" /> : <Check size={11} />}
                  <span>Commit Workspace</span>
                </button>
              </form>

              {/* Changes section */}
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em',
                  textTransform: 'uppercase', color: '#6b7280', marginBottom: '6px',
                  flexShrink: 0,
                }}>
                  <span>Changes ({changedFiles.length})</span>
                  <button
                    onClick={fetchGitStatus}
                    disabled={gitLoading}
                    title="Refresh Working Status"
                    style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer' }}
                  >
                    <RefreshCw size={11} className={gitLoading ? "animate-spin" : ""} />
                  </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px', paddingBottom: '12px' }}>
                  {changedFiles.length > 0 ? (
                    changedFiles.map((file) => (
                      <div
                        key={file.path}
                        onClick={() => openFile(file.path)}
                        style={{
                          display: 'flex', alignItems: 'center', justifySelf: 'stretch', gap: '8px',
                          padding: '4px 6px', fontSize: '12px', color: '#9ca3af',
                          cursor: 'pointer', borderRadius: '4px',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                      >
                        <span style={{
                          color: getStatusColor(file.status),
                          fontSize: '10px',
                          fontWeight: 800,
                          fontFamily: 'monospace',
                          width: '14px',
                          textAlign: 'center',
                        }}>
                          {file.status}
                        </span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={file.path}>
                          {file.path.split('/').pop()}
                        </span>
                        <span style={{ fontSize: '9px', color: '#4b5563', marginLeft: 'auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100px' }}>
                          {file.path.substring(0, file.path.lastIndexOf('/'))}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: '#4b5563', fontSize: '11px', fontStyle: 'italic', padding: '4px' }}>
                      Working tree clean. No uncommitted modifications.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── RUN & DEBUG (activeTab === 3) ── */}
        {activeTab === 3 && (
          <div style={{ height: '100%', overflow: 'hidden' }}>
            <div style={{
              fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: '#c9d1d9', padding: '10px 14px 8px',
            }}>
              Run & Debug
            </div>
            <DebuggerPanel />
          </div>
        )}

        {/* ── TIME TRAVEL (activeTab === 4) ── */}
        {activeTab === 4 && (
          <div style={{ height: '100%', overflow: 'hidden' }}>
            <TimeTravelPanel />
          </div>
        )}

        {/* ── APP EXPORT (activeTab === 5) ── */}
        {activeTab === 5 && (
          <div style={{ height: '100%', overflow: 'hidden' }}>
            <BuildPanel />
          </div>
        )}

        {/* ── EXTENSIONS (activeTab === 6) ── */}
        {activeTab === 6 && (
          <div style={{ padding: '10px 12px 0' }}>
            <div style={{
              fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: '#c9d1d9', marginBottom: '10px',
            }}>
              Extensions
            </div>
            <input
              placeholder="Search Extensions in Marketplace"
              style={{
                width: '100%', background: '#0d1117', border: '1px solid #1f2937',
                borderRadius: '5px', color: '#e2e8f0', fontSize: '12.5px',
                padding: '5px 10px', outline: 'none', boxSizing: 'border-box', marginBottom: '14px',
              }}
            />
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: '6px' }}>
              Installed
            </div>
            {['Tailwind CSS IntelliSense', 'ESLint', 'Prettier', 'GitLens', 'Error Lens'].map((ext) => (
              <div key={ext} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '5px 6px', cursor: 'pointer', borderRadius: '4px',
              }}>
                <Package size={13} color="#6b7280" />
                <span style={{ fontSize: '12.5px', color: '#9ca3af' }}>{ext}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── AI TOOLS / AI TEAM (activeTab === 7) ── */}
        {activeTab === 7 && (
          <div style={{ height: '100%', overflow: 'hidden' }}>
            <div style={{
              fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: '#c9d1d9', padding: '10px 14px 8px',
            }}>
              AI Team
            </div>
            <AITeamPanel />
          </div>
        )}
      </motion.aside>
    </AnimatePresence>
  );
}
