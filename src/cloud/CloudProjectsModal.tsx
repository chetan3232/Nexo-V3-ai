import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Cloud, CloudUpload, CloudDownload, RefreshCw, Plus, FolderGit2, Trash2 } from 'lucide-react';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useFileSystemStore } from '@/store/useFileSystemStore';

const API_BASE = import.meta.env.VITE_NEXO_API_URL ?? 'http://localhost:8787';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

type Project = {
  id: string;
  name: string;
  description: string;
  created_at: string;
};

export function CloudProjectsModal({ isOpen, onClose }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState<'idle' | 'pushing' | 'pulling' | 'done' | 'error'>('idle');
  const [syncLogs, setSyncLogs] = useState('');

  const showToast = useNotificationStore((s) => s.showToast);
  const syncFromBackend = useFileSystemStore((s) => s.syncFromBackend);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/projects`);
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      setProjects(data.projects || []);
      if (data.projects && data.projects.length > 0 && !selectedProject) {
        setSelectedProject(data.projects[0]);
      }
    } catch (err: any) {
      showToast(`Database error: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
      setSyncing('idle');
      setSyncLogs('');
    }
  }, [isOpen]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || loading) return;
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName.trim(), description: 'Cloud Workspace Backup' })
      });
      if (!response.ok) throw new Error('Create project failed');
      const data = await response.json();
      showToast(`Created cloud project "${newProjectName}"!`, 'success');
      setNewProjectName('');
      setSelectedProject(data.project);
      await fetchProjects();
    } catch (err: any) {
      showToast(`Failed to create project: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading) return;
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/projects/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Delete failed');
      showToast('Project deleted successfully.', 'success');
      if (selectedProject?.id === id) {
        setSelectedProject(null);
      }
      await fetchProjects();
    } catch (err: any) {
      showToast(`Delete failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePushSync = async () => {
    if (!selectedProject || syncing !== 'idle') return;
    setSyncing('pushing');
    setSyncLogs('Starting local files assembly...\nAnalyzing workspace directory index...\n');

    try {
      const response = await fetch(`${API_BASE}/api/sync/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: selectedProject.id })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Push sync failed');
      }

      const data = await response.json();
      setSyncLogs((prev) => prev + `[Cloud Sync] Upsert transaction executed successfully!\n${data.message}\nSync completed.`);
      setSyncing('done');
      showToast('Push sync completed successfully!', 'success');
    } catch (err: any) {
      setSyncLogs((prev) => prev + `[error] Push sync transaction failed: ${err.message}`);
      setSyncing('error');
      showToast(`Sync failed: ${err.message}`, 'error');
    }
  };

  const handlePullSync = async () => {
    if (!selectedProject || syncing !== 'idle') return;
    setSyncing('pulling');
    setSyncLogs('Fetching remote project tree from cloud...\nAnalyzing row segments...\n');

    try {
      const response = await fetch(`${API_BASE}/api/sync/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: selectedProject.id })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Pull sync failed');
      }

      const data = await response.json();
      setSyncLogs((prev) => prev + `[Cloud Sync] File segments pulled successfully!\nWriting workspace structures locally...\n${data.message}\nSync completed.`);
      setSyncing('done');
      showToast('Pull sync completed! Restored cloud files locally.', 'success');

      // Refresh workspace tree to show pulled files
      await syncFromBackend().catch(() => undefined);
    } catch (err: any) {
      setSyncLogs((prev) => prev + `[error] Pull sync transaction failed: ${err.message}`);
      setSyncing('error');
      showToast(`Sync failed: ${err.message}`, 'error');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(3, 7, 18, 0.7)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '16px',
        }}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              width: '720px', height: '480px', background: '#0d1117',
              border: '1px solid #1f2937', borderRadius: '12px',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 18px', borderBottom: '1px solid #1f2937', background: '#111827',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cloud size={16} style={{ color: '#06b6d4' }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0', letterSpacing: '0.04em' }}>
                  CLOUD PROJECTS MANAGER & SYNC
                </span>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer',
                  padding: '4px', borderRadius: '4px', display: 'flex',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Main Area */}
            <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
              {/* Left Column: Projects List */}
              <div style={{
                width: '45%', borderRight: '1px solid #1f2937', padding: '14px',
                display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto'
              }}>
                <h4 style={{ fontSize: '10px', fontWeight: 800, color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Cloud Projects
                </h4>

                <form onSubmit={handleCreateProject} style={{ display: 'flex', gap: '6px', width: '100%' }}>
                  <input
                    placeholder="New cloud project..."
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    disabled={loading}
                    style={{
                      flex: 1, background: '#111827', border: '1px solid #1f2937',
                      borderRadius: '5px', color: '#f3f4f6', fontSize: '11.5px', padding: '5px 8px',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={loading || !newProjectName.trim()}
                    style={{
                      background: '#06b6d4', border: 'none', borderRadius: '5px', color: '#ffffff',
                      padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                    }}
                  >
                    <Plus size={14} />
                  </button>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', flex: 1 }}>
                  {loading && projects.length === 0 ? (
                    <div style={{ color: '#4b5563', fontSize: '11px', fontStyle: 'italic' }}>Loading databases...</div>
                  ) : projects.length === 0 ? (
                    <div style={{ color: '#4b5563', fontSize: '11px', fontStyle: 'italic' }}>No projects registered yet.</div>
                  ) : (
                    projects.map((p) => {
                      const isSelected = selectedProject?.id === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => { if (syncing === 'idle') setSelectedProject(p); }}
                          style={{
                            display: 'flex', alignItems: 'center', justifySelf: 'stretch', gap: '8px',
                            padding: '8px 10px', background: isSelected ? 'rgba(6, 182, 212, 0.06)' : 'rgba(255,255,255,0.01)',
                            border: isSelected ? '1px solid #06b6d4' : '1px solid #1f2937',
                            borderRadius: '6px', cursor: syncing === 'idle' ? 'pointer' : 'not-allowed',
                            transition: 'all 120ms',
                          }}
                        >
                          <FolderGit2 size={14} style={{ color: isSelected ? '#06b6d4' : '#6b7280' }} />
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.name}
                          </span>
                          <button
                            onClick={(e) => handleDeleteProject(p.id, e)}
                            disabled={syncing !== 'idle'}
                            style={{
                              background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer',
                              display: 'flex', padding: '2px', borderRadius: '4px',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = '#4b5563'; }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Sync Panel */}
              <div style={{ width: '55%', padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 0 }}>
                {selectedProject ? (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', minHeight: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, minHeight: 0 }}>
                      <div>
                        <span style={{ fontSize: '8px', fontWeight: 800, color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}>
                          Target Cloud Project
                        </span>
                        <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#f3f4f6', marginTop: '2px' }}>{selectedProject.name}</h4>
                        <span style={{ fontSize: '9px', color: '#4b5563', fontFamily: 'monospace' }}>ID: {selectedProject.id}</span>
                      </div>

                      {/* Sync actions buttons */}
                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        <button
                          onClick={handlePushSync}
                          disabled={syncing !== 'idle'}
                          style={{
                            flex: 1, background: '#06b6d4', border: 'none', borderRadius: '6px',
                            color: '#ffffff', padding: '8px 0', fontSize: '11px', fontWeight: 700,
                            cursor: syncing !== 'idle' ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            textTransform: 'uppercase', transition: 'background 120ms',
                          }}
                        >
                          <CloudUpload size={13} />
                          <span>Push Sync</span>
                        </button>
                        <button
                          onClick={handlePullSync}
                          disabled={syncing !== 'idle'}
                          style={{
                            flex: 1, background: '#111827', border: '1px solid #1f2937', borderRadius: '6px',
                            color: '#e2e8f0', padding: '8px 0', fontSize: '11px', fontWeight: 700,
                            cursor: syncing !== 'idle' ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            textTransform: 'uppercase', transition: 'background 120ms',
                          }}
                        >
                          <CloudDownload size={13} />
                          <span>Pull Sync</span>
                        </button>
                      </div>

                      {/* Sync Logs Console */}
                      <div style={{
                        flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0,
                        background: '#070a0f', border: '1px solid #1f2937', borderRadius: '6px',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          padding: '4px 10px', background: '#0d1117', borderBottom: '1px solid #1f2937',
                          fontSize: '9px', color: '#6b7280', display: 'flex', justifyContent: 'space-between',
                        }}>
                          <span>SYNC TRANSACTION LOG</span>
                          {syncing === 'pushing' && <span style={{ color: '#06b6d4' }}>● PUSHING</span>}
                          {syncing === 'pulling' && <span style={{ color: '#06b6d4' }}>● PULLING</span>}
                          {syncing === 'done' && <span style={{ color: '#10b981' }}>✓ SUCCESS</span>}
                          {syncing === 'error' && <span style={{ color: '#ef4444' }}>✕ FAILED</span>}
                        </div>
                        <div style={{
                          flex: 1, overflowY: 'auto', padding: '8px 12px', fontFamily: 'monospace',
                          fontSize: '10.5px', lineHeight: '1.5', color: '#d1d5db', whiteSpace: 'pre-wrap',
                        }}>
                          {syncLogs || <span style={{ color: '#4b5563', fontStyle: 'italic' }}>Waiting for push/pull transfer triggers...</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    flex: 1, color: '#4b5563', gap: '8px', textAlign: 'center', padding: '24px',
                  }}>
                    <Cloud size={24} />
                    <span style={{ fontSize: '11px' }}>Create or select a cloud project from list on the left to sync.</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
