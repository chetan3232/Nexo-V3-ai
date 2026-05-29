import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, RefreshCw, Server, Database, Palette, Code2,
  Package, GitBranch, Layers, Globe, Zap, Shield,
  ChevronRight, CheckCircle2, AlertCircle, Loader2,
  FileCode, FolderTree, Route, Cpu
} from 'lucide-react';
import { useProjectBrainStore, ProjectBrain } from '@/store/useProjectBrainStore';

export default function ProjectBrainPanel() {
  const {
    brain,
    scanStatus,
    scanProgress,
    lastScannedAt,
    scanError,
    scanProject,
  } = useProjectBrainStore();

  // Auto-scan on first mount if never scanned
  useEffect(() => {
    if (scanStatus === 'idle' && !lastScannedAt) {
      void scanProject();
    }
  }, []);

  const stackBadges = useMemo(() => {
    if (scanStatus !== 'ready') return [];
    const s = brain.stack;
    return [
      { label: s.framework, color: '#61dafb', icon: '⚛️' },
      { label: s.stateManager, color: '#ff6b35', icon: '📦' },
      { label: s.database, color: '#3ecf8e', icon: '🗄️' },
      { label: s.styling, color: '#a855f7', icon: '🎨' },
      { label: s.runtime, color: '#47848f', icon: '🖥️' },
      { label: s.language, color: '#3178c6', icon: '📝' },
      { label: s.bundler, color: '#ffc53d', icon: '📦' },
    ].filter(b => b.label !== 'Unknown');
  }, [brain.stack, scanStatus]);

  const brainScore = useMemo(() => {
    if (scanStatus !== 'ready') return 0;
    let score = 0;
    if (brain.stack.framework !== 'Unknown') score += 15;
    if (brain.stack.stateManager !== 'Unknown') score += 10;
    if (brain.stack.database !== 'Unknown') score += 10;
    if (brain.architecture.components.length > 0) score += 15;
    if (brain.architecture.stores.length > 0) score += 10;
    if (brain.apiSurface.length > 0) score += 15;
    if (brain.dbSchema.length > 0) score += 10;
    if (brain.businessLogic.length > 0) score += 10;
    if (brain.dependencies.length > 0) score += 5;
    return Math.min(score, 100);
  }, [brain, scanStatus]);

  const archStats = useMemo(() => {
    if (scanStatus !== 'ready') return [];
    return [
      { label: 'Components', count: brain.architecture.components.length, icon: Layers, color: '#60a5fa' },
      { label: 'Stores', count: brain.architecture.stores.length, icon: Database, color: '#a78bfa' },
      { label: 'Services', count: brain.architecture.services.length, icon: Server, color: '#34d399' },
      { label: 'Routes', count: brain.architecture.routes.length, icon: Route, color: '#f472b6' },
      { label: 'Hooks', count: brain.architecture.hooks.length, icon: GitBranch, color: '#fbbf24' },
      { label: 'Pages', count: brain.architecture.pages.length, icon: FileCode, color: '#fb923c' },
    ];
  }, [brain.architecture, scanStatus]);

  if (scanStatus === 'scanning') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', background: '#0a0e1a', padding: '24px' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Brain size={40} color="#60a5fa" />
        </motion.div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0', marginBottom: '4px' }}>
            Scanning Project DNA...
          </div>
          <div style={{ fontSize: '11px', color: '#6b7280' }}>
            Analyzing stack, architecture, APIs, and patterns
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ width: '200px', height: '4px', background: '#1f2937', borderRadius: '2px', overflow: 'hidden' }}>
          <motion.div
            animate={{ width: `${scanProgress}%` }}
            transition={{ duration: 0.3 }}
            style={{ height: '100%', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', borderRadius: '2px' }}
          />
        </div>
        <div style={{ fontSize: '10px', color: '#4b5563' }}>{scanProgress}%</div>
      </div>
    );
  }

  if (scanStatus === 'error') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', background: '#0a0e1a', padding: '24px' }}>
        <AlertCircle size={32} color="#ef4444" />
        <div style={{ fontSize: '13px', color: '#ef4444', textAlign: 'center' }}>
          Brain scan failed: {scanError}
        </div>
        <button
          onClick={() => scanProject()}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: '#3b82f6', border: 'none', borderRadius: '6px',
            color: 'white', fontSize: '12px', fontWeight: 600, padding: '8px 16px',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={12} /> Retry Scan
        </button>
      </div>
    );
  }

  if (scanStatus === 'idle') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', background: '#0a0e1a', padding: '24px' }}>
        <Brain size={40} color="#4b5563" />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#9ca3af', marginBottom: '4px' }}>
            Project Brain Not Initialized
          </div>
          <div style={{ fontSize: '11px', color: '#6b7280', maxWidth: '220px', lineHeight: '1.5' }}>
            Scan your project to build AI's understanding of your stack, architecture, and conventions.
          </div>
        </div>
        <button
          onClick={() => scanProject()}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none',
            borderRadius: '8px', color: 'white', fontSize: '13px', fontWeight: 600,
            padding: '10px 20px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
            transition: 'transform 100ms',
          }}
        >
          <Brain size={14} /> Initialize Brain
        </button>
      </div>
    );
  }

  // ── Ready state ──
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: '#0a0e1a', color: '#e2e8f0', overflowY: 'auto' }}>

      {/* ── Brain Health Header ── */}
      <div style={{
        padding: '14px', background: 'linear-gradient(180deg, rgba(59,130,246,0.06) 0%, transparent 100%)',
        borderBottom: '1px solid #1f2937', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))',
              border: '1px solid rgba(59,130,246,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Brain size={14} color="#60a5fa" />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em' }}>PROJECT BRAIN</div>
              <div style={{ fontSize: '9px', color: '#6b7280' }}>
                Scanned {lastScannedAt ? new Date(lastScannedAt).toLocaleTimeString() : 'never'}
              </div>
            </div>
          </div>
          <button
            onClick={() => scanProject()}
            title="Rescan Project"
            style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid #1f2937',
              borderRadius: '6px', color: '#9ca3af', padding: '5px 10px',
              fontSize: '10px', fontWeight: 600, cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: '4px', transition: 'all 120ms',
            }}
          >
            <RefreshCw size={10} /> Rescan
          </button>
        </div>

        {/* Brain Score Gauge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ flex: 1, height: '6px', background: '#1f2937', borderRadius: '3px', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${brainScore}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{
                height: '100%', borderRadius: '3px',
                background: brainScore > 70 ? 'linear-gradient(90deg, #10b981, #34d399)' :
                  brainScore > 40 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' :
                    'linear-gradient(90deg, #ef4444, #f87171)',
              }}
            />
          </div>
          <span style={{
            fontSize: '11px', fontWeight: 700,
            color: brainScore > 70 ? '#34d399' : brainScore > 40 ? '#fbbf24' : '#f87171',
          }}>
            {brainScore}%
          </span>
        </div>
        <div style={{ fontSize: '9px', color: '#4b5563', marginTop: '4px' }}>
          Brain comprehension · {brainScore > 70 ? 'Excellent' : brainScore > 40 ? 'Good' : 'Needs more data'}
        </div>
      </div>

      {/* ── Stack DNA Badges ── */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #1f2937', flexShrink: 0 }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: '#4b5563', letterSpacing: '0.08em', marginBottom: '8px' }}>
          🧬 STACK DNA
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {stackBadges.map((badge) => (
            <motion.div
              key={badge.label}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                background: `${badge.color}12`, border: `1px solid ${badge.color}30`,
                borderRadius: '6px', padding: '4px 8px',
              }}
            >
              <span style={{ fontSize: '11px' }}>{badge.icon}</span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: badge.color }}>
                {badge.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Architecture Stats Grid ── */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #1f2937', flexShrink: 0 }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: '#4b5563', letterSpacing: '0.08em', marginBottom: '8px' }}>
          🏗️ ARCHITECTURE MAP
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          {archStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid #1f2937',
                borderRadius: '6px', padding: '8px', textAlign: 'center',
              }}>
                <Icon size={14} color={stat.color} style={{ marginBottom: '4px' }} />
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0' }}>{stat.count}</div>
                <div style={{ fontSize: '9px', color: '#6b7280' }}>{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── API Surface ── */}
      {brain.apiSurface.length > 0 && (
        <div style={{ padding: '12px 14px', borderBottom: '1px solid #1f2937', flexShrink: 0 }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#4b5563', letterSpacing: '0.08em', marginBottom: '8px' }}>
            🌐 API SURFACE ({brain.apiSurface.length} endpoints)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxHeight: '140px', overflowY: 'auto' }}>
            {brain.apiSurface.map((ep, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '4px 8px', borderRadius: '4px',
                background: 'rgba(255,255,255,0.01)',
              }}>
                <span style={{
                  fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '3px',
                  background: ep.method === 'GET' ? 'rgba(52,211,153,0.15)' :
                    ep.method === 'POST' ? 'rgba(59,130,246,0.15)' :
                      ep.method === 'DELETE' ? 'rgba(239,68,68,0.15)' :
                        'rgba(251,191,36,0.15)',
                  color: ep.method === 'GET' ? '#34d399' :
                    ep.method === 'POST' ? '#60a5fa' :
                      ep.method === 'DELETE' ? '#f87171' : '#fbbf24',
                  minWidth: '38px', textAlign: 'center',
                }}>
                  {ep.method}
                </span>
                <span style={{ fontSize: '11px', color: '#e2e8f0', fontFamily: "'JetBrains Mono', monospace" }}>
                  {ep.path}
                </span>
                <span style={{ fontSize: '9px', color: '#374151', marginLeft: 'auto' }}>
                  {ep.file.split('/').pop()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Database Schema ── */}
      {brain.dbSchema.length > 0 && (
        <div style={{ padding: '12px 14px', borderBottom: '1px solid #1f2937', flexShrink: 0 }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#4b5563', letterSpacing: '0.08em', marginBottom: '8px' }}>
            🗄️ DATABASE SCHEMA ({brain.dbSchema.length} tables)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {brain.dbSchema.map((table, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid #1f2937',
                borderRadius: '6px', padding: '8px 10px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Database size={10} color="#3ecf8e" />
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#34d399' }}>{table.table}</span>
                  <span style={{ fontSize: '9px', color: '#4b5563' }}>({table.columns.length} cols)</span>
                </div>
                <div style={{
                  fontSize: '10px', color: '#6b7280',
                  fontFamily: "'JetBrains Mono', monospace",
                  lineHeight: '1.6',
                }}>
                  {table.columns.join(' · ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Business Logic Flows ── */}
      {brain.businessLogic.length > 0 && (
        <div style={{ padding: '12px 14px', borderBottom: '1px solid #1f2937', flexShrink: 0 }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#4b5563', letterSpacing: '0.08em', marginBottom: '8px' }}>
            ⚡ BUSINESS LOGIC FLOWS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {brain.businessLogic.map((bl, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '6px 8px', borderRadius: '6px',
                background: 'rgba(255,255,255,0.02)', border: '1px solid #1f2937',
              }}>
                <CheckCircle2 size={12} color="#10b981" />
                <div>
                  <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#e2e8f0' }}>{bl.flow}</div>
                  <div style={{ fontSize: '9px', color: '#6b7280' }}>{bl.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── UI Rules ── */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #1f2937', flexShrink: 0 }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: '#4b5563', letterSpacing: '0.08em', marginBottom: '8px' }}>
          🎨 UI/DESIGN RULES
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {[
            { label: 'Theme', value: brain.uiRules.theme },
            { label: 'Primary', value: brain.uiRules.primaryColor },
            { label: 'Font', value: brain.uiRules.fontFamily },
            { label: 'Icons', value: brain.uiRules.iconLibrary },
          ].map(rule => (
            <div key={rule.label} style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid #1f2937',
              borderRadius: '4px', padding: '6px 8px',
            }}>
              <div style={{ fontSize: '9px', color: '#4b5563', fontWeight: 600 }}>{rule.label}</div>
              <div style={{ fontSize: '11px', color: '#e2e8f0', fontWeight: 500 }}>{rule.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Dependencies ── */}
      {brain.dependencies.length > 0 && (
        <div style={{ padding: '12px 14px', flexShrink: 0 }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#4b5563', letterSpacing: '0.08em', marginBottom: '8px' }}>
            📦 DEPENDENCIES ({brain.dependencies.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxHeight: '100px', overflowY: 'auto' }}>
            {brain.dependencies.slice(0, 30).map((dep) => (
              <span key={dep.name} style={{
                fontSize: '9px', padding: '2px 6px', borderRadius: '3px',
                background: dep.type === 'production' ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${dep.type === 'production' ? 'rgba(59,130,246,0.15)' : '#1f2937'}`,
                color: dep.type === 'production' ? '#93c5fd' : '#6b7280',
              }}>
                {dep.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
