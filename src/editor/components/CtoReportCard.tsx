import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, AlertTriangle, Info, ChevronDown, ChevronRight,
  Zap, Lock, Gauge, Layers, Clock, Eye, Wand2, X, CheckCircle2,
} from 'lucide-react';
import { CtoReport, CtoFinding, CtoFindingCategory, CtoSeverity, useCtoStore } from '@/store/useCtoStore';

const CATEGORY_CONFIG: Record<CtoFindingCategory, { icon: typeof Shield; label: string; color: string }> = {
  missing_feature: { icon: Zap, label: 'Missing Feature', color: '#f59e0b' },
  security:        { icon: Lock, label: 'Security', color: '#ef4444' },
  performance:     { icon: Gauge, label: 'Performance', color: '#f97316' },
  architecture:    { icon: Layers, label: 'Architecture', color: '#8b5cf6' },
  tech_debt:       { icon: Clock, label: 'Tech Debt', color: '#6366f1' },
  accessibility:   { icon: Eye, label: 'Accessibility', color: '#14b8a6' },
};

const SEVERITY_CONFIG: Record<CtoSeverity, { color: string; bg: string; label: string }> = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'CRITICAL' },
  warning:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'WARNING' },
  info:     { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', label: 'INFO' },
};

type Props = {
  report: CtoReport;
  compact?: boolean;
};

export default function CtoReportCard({ report, compact = false }: Props) {
  const [expanded, setExpanded] = useState(!compact);
  const [expandedFindings, setExpandedFindings] = useState<Set<number>>(new Set());
  const { dismissReport } = useCtoStore();

  if (report.dismissed) return null;

  const criticalCount = report.findings.filter(f => f.severity === 'critical').length;
  const warningCount = report.findings.filter(f => f.severity === 'warning').length;
  const infoCount = report.findings.filter(f => f.severity === 'info').length;

  const scoreColor = report.overallScore >= 80 ? '#10b981' :
    report.overallScore >= 60 ? '#f59e0b' :
      report.overallScore >= 40 ? '#f97316' : '#ef4444';

  const toggleFinding = (idx: number) => {
    setExpandedFindings(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        background: 'linear-gradient(135deg, rgba(139,92,246,0.04), rgba(59,130,246,0.04))',
        border: '1px solid rgba(139,92,246,0.2)',
        borderRadius: '10px',
        overflow: 'hidden',
        width: '100%',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 12px',
          cursor: 'pointer',
          background: 'rgba(139,92,246,0.06)',
          borderBottom: expanded ? '1px solid rgba(139,92,246,0.12)' : 'none',
          transition: 'background 120ms',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '6px',
            background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.2))',
            border: '1px solid rgba(139,92,246,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={12} color="#a78bfa" />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#e2e8f0', letterSpacing: '0.03em' }}>
              CTO REPORT
            </div>
            <div style={{ fontSize: '9px', color: '#6b7280' }}>
              {report.findings.length} findings · Score {report.overallScore}/100
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Score badge */}
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            border: `2px solid ${scoreColor}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 700, color: scoreColor,
          }}>
            {report.overallScore}
          </div>

          {/* Severity counts */}
          <div style={{ display: 'flex', gap: '3px' }}>
            {criticalCount > 0 && (
              <span style={{ fontSize: '9px', fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '1px 4px', borderRadius: '3px' }}>
                {criticalCount}🔴
              </span>
            )}
            {warningCount > 0 && (
              <span style={{ fontSize: '9px', fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '1px 4px', borderRadius: '3px' }}>
                {warningCount}🟡
              </span>
            )}
            {infoCount > 0 && (
              <span style={{ fontSize: '9px', fontWeight: 700, color: '#60a5fa', background: 'rgba(96,165,250,0.1)', padding: '1px 4px', borderRadius: '3px' }}>
                {infoCount}🔵
              </span>
            )}
          </div>

          {/* Dismiss */}
          <button
            onClick={(e) => { e.stopPropagation(); dismissReport(report.id); }}
            style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', padding: '2px', display: 'flex' }}
          >
            <X size={12} />
          </button>

          {expanded ? <ChevronDown size={12} color="#6b7280" /> : <ChevronRight size={12} color="#6b7280" />}
        </div>
      </div>

      {/* ── Expanded Content ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            {/* Recommendation */}
            <div style={{
              padding: '8px 12px',
              fontSize: '11px', color: '#9ca3af', fontStyle: 'italic',
              borderBottom: '1px solid rgba(139,92,246,0.08)',
              display: 'flex', alignItems: 'flex-start', gap: '6px',
            }}>
              <span style={{ fontSize: '12px', flexShrink: 0 }}>💡</span>
              {report.recommendation}
            </div>

            {/* Findings List */}
            <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {report.findings.map((finding, idx) => {
                const catConf = CATEGORY_CONFIG[finding.category] || CATEGORY_CONFIG.architecture;
                const sevConf = SEVERITY_CONFIG[finding.severity] || SEVERITY_CONFIG.info;
                const CatIcon = catConf.icon;
                const isOpen = expandedFindings.has(idx);

                return (
                  <div key={idx} style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isOpen ? sevConf.color + '30' : '#1f2937'}`,
                    borderRadius: '6px',
                    transition: 'border-color 120ms',
                  }}>
                    {/* Finding header */}
                    <div
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '7px 10px', cursor: 'pointer',
                      }}
                      onClick={() => toggleFinding(idx)}
                    >
                      <CatIcon size={12} color={catConf.color} style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#e2e8f0' }}>
                          {finding.title}
                        </div>
                      </div>
                      <span style={{
                        fontSize: '8px', fontWeight: 700, padding: '1px 5px', borderRadius: '3px',
                        background: sevConf.bg, color: sevConf.color, letterSpacing: '0.05em',
                      }}>
                        {sevConf.label}
                      </span>
                      {isOpen ? <ChevronDown size={10} color="#6b7280" /> : <ChevronRight size={10} color="#6b7280" />}
                    </div>

                    {/* Finding expanded details */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div style={{
                            padding: '0 10px 8px 30px',
                            display: 'flex', flexDirection: 'column', gap: '6px',
                          }}>
                            <div style={{ fontSize: '10.5px', color: '#9ca3af', lineHeight: '1.5' }}>
                              {finding.description}
                            </div>
                            <div style={{
                              fontSize: '10.5px', color: '#34d399', lineHeight: '1.5',
                              display: 'flex', alignItems: 'flex-start', gap: '4px',
                            }}>
                              <CheckCircle2 size={10} color="#34d399" style={{ flexShrink: 0, marginTop: '2px' }} />
                              <span><b>Fix:</b> {finding.suggestion}</span>
                            </div>
                            {finding.autoFixable && (
                              <button style={{
                                alignSelf: 'flex-start',
                                display: 'flex', alignItems: 'center', gap: '4px',
                                background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)',
                                borderRadius: '4px', color: '#60a5fa', fontSize: '10px', fontWeight: 600,
                                padding: '3px 8px', cursor: 'pointer', transition: 'all 120ms',
                              }}>
                                <Wand2 size={10} /> Auto-Fix
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
