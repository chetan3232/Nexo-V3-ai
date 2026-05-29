import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Moon, Sun, GitBranch, FileCode, Clock, CheckCircle2,
  XCircle, AlertCircle, Loader2, Zap, Brain, Shield,
  GitMerge, Trash2, ChevronDown, ChevronRight, X,
} from 'lucide-react';
import { useDreamStore, DreamLogEntry } from '@/store/useDreamStore';
import { useCtoStore } from '@/store/useCtoStore';
import CtoReportCard from './CtoReportCard';

const ACTION_ICONS: Record<string, { icon: typeof Moon; color: string }> = {
  plan:   { icon: Brain, color: '#a78bfa' },
  code:   { icon: FileCode, color: '#60a5fa' },
  test:   { icon: Zap, color: '#fbbf24' },
  fix:    { icon: AlertCircle, color: '#f97316' },
  commit: { icon: GitBranch, color: '#34d399' },
  cto:    { icon: Shield, color: '#c084fc' },
  info:   { icon: Moon, color: '#6b7280' },
  error:  { icon: XCircle, color: '#ef4444' },
};

const STATUS_COLOR: Record<string, string> = {
  success: '#10b981',
  failed: '#ef4444',
  info: '#6b7280',
  pending: '#fbbf24',
};

export default function DreamModePanel() {
  const {
    dreamGoal,
    dreamStatus,
    dreamProgress,
    dreamLog,
    dreamBranch,
    dreamStartTime,
    dreamEndTime,
    filesCreated,
    filesModified,
    cancelDream,
    resetDream,
  } = useDreamStore();

  const { lastReport } = useCtoStore();
  const logEndRef = useRef<HTMLDivElement>(null);
  const [showLog, setShowLog] = useState(true);

  // Auto-scroll log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dreamLog]);

  const elapsed = useMemo(() => {
    if (!dreamStartTime) return '0s';
    const end = dreamEndTime || Date.now();
    const diffSec = Math.floor((end - dreamStartTime) / 1000);
    const min = Math.floor(diffSec / 60);
    const sec = diffSec % 60;
    return min > 0 ? `${min}m ${sec}s` : `${sec}s`;
  }, [dreamStartTime, dreamEndTime, dreamLog]);

  const progressPercent = dreamProgress.total > 0
    ? Math.round((dreamProgress.completed / dreamProgress.total) * 100)
    : 0;

  if (dreamStatus === 'idle') return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(5, 8, 22, 0.96)',
        backdropFilter: 'blur(20px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* ── Background Stars Effect ── */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
              opacity: 0,
            }}
            animate={{
              opacity: [0, Math.random() * 0.6 + 0.1, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: Math.random() * 4 + 3,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
            style={{
              position: 'absolute',
              width: Math.random() * 3 + 1,
              height: Math.random() * 3 + 1,
              borderRadius: '50%',
              background: '#60a5fa',
              boxShadow: '0 0 6px rgba(96,165,250,0.4)',
            }}
          />
        ))}
      </div>

      {/* ── Main Content ── */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: '600px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '20px', padding: '24px',
        maxHeight: '90vh', overflowY: 'auto',
      }}>

        {/* ── Dream Header ── */}
        <motion.div
          animate={dreamStatus === 'dreaming' ? { y: [0, -4, 0] } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ textAlign: 'center' }}
        >
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 12px',
            background: dreamStatus === 'dreaming'
              ? 'linear-gradient(135deg, rgba(96,165,250,0.15), rgba(139,92,246,0.15))'
              : dreamStatus === 'complete'
                ? 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(52,211,153,0.15))'
                : 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(248,113,113,0.15))',
            border: `2px solid ${dreamStatus === 'dreaming' ? 'rgba(96,165,250,0.3)' : dreamStatus === 'complete' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 30px ${dreamStatus === 'dreaming' ? 'rgba(96,165,250,0.2)' : dreamStatus === 'complete' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
          }}>
            {dreamStatus === 'dreaming' ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}>
                <Moon size={28} color="#60a5fa" />
              </motion.div>
            ) : dreamStatus === 'complete' ? (
              <Sun size={28} color="#34d399" />
            ) : (
              <XCircle size={28} color="#f87171" />
            )}
          </div>

          <h1 style={{
            fontSize: '22px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em',
            background: dreamStatus === 'complete'
              ? 'linear-gradient(135deg, #34d399, #10b981)'
              : 'linear-gradient(135deg, #60a5fa, #a78bfa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            {dreamStatus === 'dreaming' ? 'Dream Mode Active' :
              dreamStatus === 'complete' ? '☀️ Dream Complete!' :
                dreamStatus === 'cancelled' ? 'Dream Cancelled' : 'Dream Failed'}
          </h1>

          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px', maxWidth: '400px' }}>
            {dreamStatus === 'dreaming' ? `"${dreamGoal}"` :
              dreamStatus === 'complete' ? 'Your project has been built while you were away.' :
                'The dream was interrupted.'}
          </p>
        </motion.div>

        {/* ── Progress Section (dreaming) ── */}
        {dreamStatus === 'dreaming' && (
          <div style={{ width: '100%', maxWidth: '440px' }}>
            {/* Progress bar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '8px',
            }}>
              <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600 }}>
                Task {dreamProgress.completed}/{dreamProgress.total}
              </span>
              <span style={{ fontSize: '11px', color: '#60a5fa', fontWeight: 600 }}>
                {progressPercent}%
              </span>
            </div>
            <div style={{ height: '6px', background: '#1f2937', borderRadius: '3px', overflow: 'hidden' }}>
              <motion.div
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5 }}
                style={{
                  height: '100%', borderRadius: '3px',
                  background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                  boxShadow: '0 0 10px rgba(59,130,246,0.4)',
                }}
              />
            </div>
            <div style={{ fontSize: '10px', color: '#4b5563', marginTop: '6px', textAlign: 'center' }}>
              {dreamProgress.currentTask}
            </div>

            {/* Elapsed time */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '6px', marginTop: '12px',
            }}>
              <Clock size={12} color="#4b5563" />
              <span style={{ fontSize: '11px', color: '#6b7280' }}>Elapsed: {elapsed}</span>
            </div>
          </div>
        )}

        {/* ── Summary (complete/failed) ── */}
        {(dreamStatus === 'complete' || dreamStatus === 'failed' || dreamStatus === 'cancelled') && (
          <div style={{
            width: '100%', maxWidth: '440px',
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px',
          }}>
            <div style={{
              background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: '8px', padding: '12px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#34d399' }}>{filesCreated.length}</div>
              <div style={{ fontSize: '10px', color: '#6b7280' }}>Files Created</div>
            </div>
            <div style={{
              background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: '8px', padding: '12px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#60a5fa' }}>{filesModified.length}</div>
              <div style={{ fontSize: '10px', color: '#6b7280' }}>Files Modified</div>
            </div>
            <div style={{
              background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)',
              borderRadius: '8px', padding: '12px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#a78bfa' }}>
                <Clock size={16} style={{ display: 'inline' }} /> {elapsed}
              </div>
              <div style={{ fontSize: '10px', color: '#6b7280' }}>Duration</div>
            </div>
          </div>
        )}

        {/* ── CTO Report (if available after dream) ── */}
        {dreamStatus === 'complete' && lastReport && !lastReport.dismissed && (
          <div style={{ width: '100%', maxWidth: '440px' }}>
            <CtoReportCard report={lastReport} compact />
          </div>
        )}

        {/* ── Live Execution Log ── */}
        <div style={{ width: '100%', maxWidth: '440px' }}>
          <button
            onClick={() => setShowLog(!showLog)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', width: '100%',
              background: 'rgba(255,255,255,0.02)', border: '1px solid #1f2937',
              borderRadius: '6px', padding: '8px 12px', cursor: 'pointer',
              color: '#9ca3af', fontSize: '11px', fontWeight: 600,
              marginBottom: showLog ? '8px' : 0,
            }}
          >
            {showLog ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            EXECUTION LOG ({dreamLog.length} entries)
          </button>

          <AnimatePresence>
            {showLog && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{
                  overflow: 'hidden',
                  background: 'rgba(7, 10, 15, 0.8)',
                  border: '1px solid #1f2937',
                  borderRadius: '8px',
                  maxHeight: '250px',
                  overflowY: 'auto',
                  padding: '8px',
                }}
              >
                {dreamLog.length === 0 ? (
                  <div style={{ fontSize: '11px', color: '#4b5563', textAlign: 'center', padding: '12px' }}>
                    Waiting for first log entry...
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {dreamLog.map((entry) => {
                      const actionConf = ACTION_ICONS[entry.action] || ACTION_ICONS.info;
                      const Icon = actionConf.icon;
                      const statusCol = STATUS_COLOR[entry.status] || '#6b7280';

                      return (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          style={{
                            display: 'flex', alignItems: 'flex-start', gap: '8px',
                            padding: '4px 6px', borderRadius: '4px',
                            background: entry.status === 'failed' ? 'rgba(239,68,68,0.04)' : 'transparent',
                          }}
                        >
                          <div style={{ flexShrink: 0, marginTop: '2px' }}>
                            {entry.status === 'pending' ? (
                              <Loader2 size={10} color="#fbbf24" className="animate-spin" />
                            ) : (
                              <Icon size={10} color={statusCol} />
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: '10.5px', color: statusCol,
                              fontFamily: "'JetBrains Mono', monospace",
                              lineHeight: '1.5',
                            }}>
                              <span style={{ color: actionConf.color, fontWeight: 600 }}>[{entry.agent}]</span>{' '}
                              {entry.detail}
                            </div>
                            {entry.file && (
                              <div style={{ fontSize: '9px', color: '#374151', marginTop: '1px' }}>
                                📄 {entry.file}
                              </div>
                            )}
                          </div>
                          <span style={{ fontSize: '8px', color: '#374151', flexShrink: 0 }}>
                            {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </motion.div>
                      );
                    })}
                    <div ref={logEndRef} />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Action Buttons ── */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
          {dreamStatus === 'dreaming' && (
            <button
              onClick={cancelDream}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '8px', color: '#f87171', fontSize: '13px', fontWeight: 600,
                padding: '10px 24px', cursor: 'pointer', transition: 'all 120ms',
              }}
            >
              <XCircle size={14} /> Wake Up (Cancel)
            </button>
          )}

          {(dreamStatus === 'complete' || dreamStatus === 'failed' || dreamStatus === 'cancelled') && (
            <>
              <button
                onClick={resetDream}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  border: 'none', borderRadius: '8px', color: 'white',
                  fontSize: '13px', fontWeight: 600, padding: '10px 24px', cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
                }}
              >
                <X size={14} /> Close Dream Panel
              </button>
            </>
          )}
        </div>

        {/* Dream branch info */}
        {dreamBranch && (
          <div style={{
            fontSize: '10px', color: '#374151',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}>
            <GitBranch size={10} />
            Branch: {dreamBranch}
          </div>
        )}
      </div>
    </motion.div>
  );
}
