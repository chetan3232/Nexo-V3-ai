import { useState, useEffect } from 'react';
import { RotateCcw, Clock, CheckCircle2, FileCode, AlertCircle, Plus, Camera } from 'lucide-react';
import { readWorkspaceFile } from '@/services/fileSystemClient';
import { useFileSystemStore } from '@/store/useFileSystemStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { DiffModal } from './DiffModal';

const API_BASE = import.meta.env.VITE_NEXO_API_URL ?? 'http://localhost:8787';

type GitCommit = {
  id: string;
  label: string;
  title: string;
  time: string;
  author: string;
  files: string[];
  changes: string;
};

export function TimeTravelPanel() {
  const [history, setHistory] = useState<GitCommit[]>([]);
  const [selectedVer, setSelectedVer] = useState<string | null>(null);
  const [rollingBack, setRollingBack] = useState(false);
  const [activeVer, setActiveVer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Snapshot input
  const [snapshotName, setSnapshotName] = useState('');
  const [savingSnapshot, setSavingSnapshot] = useState(false);

  // Diff Modal states
  const [diffModalOpen, setDiffModalOpen] = useState(false);
  const [diffFileName, setDiffFileName] = useState('');
  const [diffOriginalCode, setDiffOriginalCode] = useState('');
  const [diffModifiedCode, setDiffModifiedCode] = useState('');
  const [diffCommitLabel, setDiffCommitLabel] = useState('');

  const syncFromBackend = useFileSystemStore((s) => s.syncFromBackend);
  const showToast = useNotificationStore((s) => s.showToast);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/git/history`);
      if (!response.ok) throw new Error('Failed to fetch git history');
      const data = await response.json();
      setHistory(data.history || []);
      if (data.history && data.history.length > 0) {
        // Set the active ver to the first commit initially
        const latestCommit = data.history[0].id;
        setActiveVer(latestCommit);
        setSelectedVer(latestCommit);
      }
    } catch (err: any) {
      showToast(`Error fetching version history: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleRevert = async (sha: string) => {
    if (rollingBack) return;
    setRollingBack(true);
    try {
      const response = await fetch(`${API_BASE}/api/git/revert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sha })
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Revert failed');
      }
      showToast(`Successfully reverted workspace state to commit ${sha.substring(0, 7)}!`, 'success');
      setActiveVer(sha);
      
      // Sync file system store to reflect checkout changes in UI
      await syncFromBackend().catch(() => undefined);
    } catch (err: any) {
      showToast(`Revert failed: ${err.message}`, 'error');
    } finally {
      setRollingBack(false);
    }
  };

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshotName.trim() || savingSnapshot) return;
    setSavingSnapshot(true);
    try {
      const response = await fetch(`${API_BASE}/api/git/snapshot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: snapshotName.trim() })
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to create snapshot');
      }
      showToast(`Created snapshot "${snapshotName}" successfully!`, 'success');
      setSnapshotName('');
      await fetchHistory();
    } catch (err: any) {
      showToast(`Snapshot error: ${err.message}`, 'error');
    } finally {
      setSavingSnapshot(false);
    }
  };

  const handleDiffClick = async (file: string, sha: string, label: string) => {
    try {
      showToast(`Loading diff for ${file.split('/').pop()}...`, 'info');
      
      // 1. Fetch file content at the specific commit
      const histResponse = await fetch(`${API_BASE}/api/git/show-file?sha=${sha}&path=${encodeURIComponent(file)}`);
      if (!histResponse.ok) {
        throw new Error(`Failed to load historical version of file`);
      }
      const histData = await histResponse.json();
      
      // 2. Fetch current file content from the local workspace
      let currentContent = '';
      try {
        const curData = await readWorkspaceFile(file);
        currentContent = curData.content;
      } catch (err) {
        // File might have been deleted locally
        currentContent = '';
      }

      setDiffFileName(file);
      setDiffOriginalCode(histData.content);
      setDiffModifiedCode(currentContent);
      setDiffCommitLabel(label);
      setDiffModalOpen(true);
    } catch (err: any) {
      showToast(`Failed to generate code diff: ${err.message}`, 'error');
    }
  };

  const activeCheckpoint = history.find(v => v.id === selectedVer);

  return (
    <section style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#111827',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px 8px',
        borderBottom: '1px solid #1f2937',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: '#c9d1d9',
        flexShrink: 0,
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={14} style={{ color: '#06b6d4' }} /> Time Travel History
        </span>
        <span style={{ fontSize: '10px', color: '#06b6d4', fontWeight: 'bold' }}>
          {history.length} Checkpoints
        </span>
      </div>

      {/* Snapshot form */}
      <form onSubmit={handleCreateSnapshot} style={{
        padding: '10px 12px',
        borderBottom: '1px solid #1f2937',
        background: '#0d1117',
        display: 'flex',
        gap: '6px',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <input
          placeholder="New snapshot name..."
          value={snapshotName}
          onChange={(e) => setSnapshotName(e.target.value)}
          disabled={savingSnapshot}
          style={{
            flex: 1,
            background: '#111827',
            border: '1px solid #1f2937',
            borderRadius: '5px',
            color: '#e2e8f0',
            fontSize: '11px',
            padding: '5px 8px',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={savingSnapshot || !snapshotName.trim()}
          title="Create Snapshot Tag"
          style={{
            background: '#06b6d4',
            border: 'none',
            borderRadius: '5px',
            color: '#ffffff',
            padding: '5px 8px',
            cursor: (savingSnapshot || !snapshotName.trim()) ? 'not-allowed' : 'pointer',
            opacity: (savingSnapshot || !snapshotName.trim()) ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Camera size={13} />
        </button>
      </form>

      {/* Layout Columns */}
      <div style={{
        display: 'flex',
        flex: 1,
        minHeight: 0,
        padding: '10px',
        gap: '10px',
        overflow: 'hidden',
      }}>
        {/* Timeline list */}
        <div style={{
          flex: '1.2 1 0%',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          paddingRight: '4px',
        }}>
          {loading ? (
            <div style={{ color: '#4b5563', fontSize: '11px', fontStyle: 'italic', padding: '10px' }}>
              Reading repository logs...
            </div>
          ) : history.length === 0 ? (
            <div style={{ color: '#4b5563', fontSize: '11px', fontStyle: 'italic', padding: '10px' }}>
              No git history checkpoints found. Make a commit to start tracking timeline snapshots.
            </div>
          ) : (
            history.map((v) => {
              const isActive = activeVer === v.id;
              const isSelected = selectedVer === v.id;

              return (
                <div
                  key={v.id}
                  onClick={() => setSelectedVer(v.id)}
                  style={{
                    background: isSelected ? 'rgba(6, 182, 212, 0.08)' : 'rgba(255,255,255,0.01)',
                    border: isSelected ? '1px solid #06b6d4' : '1px solid #1f2937',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    cursor: 'pointer',
                    transition: 'all 120ms',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      color: isActive ? '#34d399' : '#6b7280',
                    }}>
                      {v.label} {isActive && '● (Active)'}
                    </span>
                    <span style={{ fontSize: '8px', color: '#4b5563' }}>{v.time}</span>
                  </div>
                  <h4 style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#e2e8f0',
                    marginTop: '3px',
                    lineHeight: '1.3',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }} title={v.title}>
                    {v.title}
                  </h4>
                  <div style={{
                    marginTop: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '8px',
                    color: '#6b7280',
                    borderTop: '1px solid #1f2937',
                    paddingTop: '4px',
                  }}>
                    <span>By {v.author}</span>
                    <span style={{ color: '#06b6d4', fontWeight: 700 }}>{v.changes}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Details Side Column */}
        <div style={{
          flex: '0.8 1 0%',
          background: 'rgba(255,255,255,0.01)',
          border: '1px solid #1f2937',
          borderRadius: '8px',
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minWidth: 0,
        }}>
          {activeCheckpoint ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', minHeight: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', minHeight: 0 }}>
                <div>
                  <span style={{ fontSize: '8px', fontWeight: 800, color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '2px' }}>
                    Checkpoint Info
                  </span>
                  <h4 style={{ fontSize: '11px', fontWeight: 700, color: '#f3f4f6' }}>{activeCheckpoint.label}</h4>
                  <p style={{ fontSize: '10px', color: '#9ca3af', marginTop: '3px', lineHeight: '1.4' }}>{activeCheckpoint.title}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <span style={{ fontSize: '8px', fontWeight: 800, color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>
                    Affected Assets ({activeCheckpoint.files.length})
                  </span>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    overflowY: 'auto',
                    minHeight: 0,
                  }}>
                    {activeCheckpoint.files.map((file) => (
                      <div
                        key={file}
                        onClick={() => handleDiffClick(file, activeCheckpoint.id, activeCheckpoint.label)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '9.5px',
                          color: '#e5e7eb',
                          fontFamily: 'monospace',
                          cursor: 'pointer',
                          padding: '4px 6px',
                          borderRadius: '4px',
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid #1f2937',
                          transition: 'all 120ms',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#06b6d4';
                          e.currentTarget.style.background = 'rgba(6, 182, 212, 0.04)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#1f2937';
                          e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                        }}
                        title="Click to view side-by-side Visual Diff"
                      >
                        <FileCode size={11} style={{ color: '#9ca3af', flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {file.split('/').pop()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #1f2937', paddingTop: '10px', marginTop: '10px' }}>
                {activeVer !== activeCheckpoint.id ? (
                  <button
                    onClick={() => handleRevert(activeCheckpoint.id)}
                    disabled={rollingBack}
                    style={{
                      width: '100%',
                      background: '#ef4444',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '5px',
                      padding: '6px 0',
                      fontSize: '10px',
                      fontWeight: 700,
                      cursor: rollingBack ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      textTransform: 'uppercase',
                      transition: 'background 120ms',
                    }}
                    onMouseEnter={(e) => { if (!rollingBack) e.currentTarget.style.background = '#dc2626'; }}
                    onMouseLeave={(e) => { if (!rollingBack) e.currentTarget.style.background = '#ef4444'; }}
                  >
                    <RotateCcw size={11} />
                    <span>{rollingBack ? 'Restoring State...' : 'Revert State'}</span>
                  </button>
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    borderRadius: '5px',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    padding: '6px 0',
                    fontSize: '9px',
                    fontWeight: 700,
                    color: '#34d399',
                    textTransform: 'uppercase',
                  }}>
                    <CheckCircle2 size={11} />
                    <span>Current Active</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              color: '#4b5563',
              gap: '6px',
              textAlign: 'center',
              padding: '12px',
            }}>
              <AlertCircle size={18} />
              <span style={{ fontSize: '9px' }}>Select a history checkpoint on the left to view detail parameters.</span>
            </div>
          )}
        </div>
      </div>

      {/* Visual Diff Viewport Modal */}
      <DiffModal
        isOpen={diffModalOpen}
        onClose={() => setDiffModalOpen(false)}
        fileName={diffFileName}
        originalCode={diffOriginalCode}
        modifiedCode={diffModifiedCode}
        commitLabel={diffCommitLabel}
      />
    </section>
  );
}
