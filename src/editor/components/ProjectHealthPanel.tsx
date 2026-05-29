import { useEffect } from 'react';
import { useHealthStore } from '@/store/useHealthStore';
import { Shield, Zap, Cpu, FileText, CheckSquare, RefreshCw, ChevronUp, ChevronDown, Check, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export function ProjectHealthPanel() {
  const { healthScore, categories, suggestions, isCalculating, calculateHealth, lastCalculatedAt } = useHealthStore();

  useEffect(() => {
    if (categories.length === 0 && !isCalculating) {
      void calculateHealth();
    }
  }, [calculateHealth, categories.length, isCalculating]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'; // Green
    if (score >= 60) return '#eab308'; // Yellow
    if (score >= 40) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  const getIcon = (name: string) => {
    switch (name) {
      case 'security': return Shield;
      case 'performance': return Zap;
      case 'maintainability': return Cpu;
      default: return FileText;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0d1117', color: '#e2e8f0', padding: '14px', gap: '14px', overflowY: 'auto' }}>
      
      {/* ── Main Dashboard Header: Score Gauge ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(255,255,255,0.02)', border: '1px solid #1f2937',
        borderRadius: '8px', padding: '14px 18px', gap: '14px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#6b7280', letterSpacing: '0.08em' }}>PROJECT HEALTH DNA</span>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            {healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Healthy' : 'Needs Optimization'}
          </h2>
          {lastCalculatedAt && (
            <span style={{ fontSize: '9px', color: '#4b5563' }}>
              Last audit: {new Date(lastCalculatedAt).toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Circular SVG Speedometer Gauge */}
        <div style={{ position: 'relative', width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
            <circle cx="35" cy="35" r="30" fill="none" stroke="#1f2937" strokeWidth="6" />
            <circle
              cx="35" cy="35" r="30" fill="none"
              stroke={getScoreColor(healthScore)} strokeWidth="6"
              strokeDasharray={2 * Math.PI * 30}
              strokeDashoffset={2 * Math.PI * 30 * (1 - healthScore / 100)}
              style={{ transition: 'stroke-dashoffset 800ms ease' }}
            />
          </svg>
          <span style={{ position: 'absolute', fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>
            {healthScore}%
          </span>
        </div>
      </div>

      {/* ── Category Breakdown Gauges ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#4b5563', letterSpacing: '0.05em' }}>METRIC BREAKDOWN</span>
          <button
            onClick={() => calculateHealth()}
            disabled={isCalculating}
            style={{
              background: 'transparent', border: 'none', color: '#3b82f6',
              fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
            }}
          >
            <RefreshCw size={11} className={isCalculating ? 'animate-spin' : ''} />
            Re-Audit
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
          {categories.map(cat => {
            const CatIcon = getIcon(cat.name);
            const scoreColor = getScoreColor(cat.score);

            return (
              <div key={cat.name} style={{
                background: 'rgba(255,255,255,0.01)', border: '1px solid #1f2937',
                borderRadius: '6px', padding: '10px 12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CatIcon size={13} color={scoreColor} />
                    <span style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'capitalize', color: '#e2e8f0' }}>{cat.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: scoreColor }}>{cat.score}%</span>
                    {cat.trend === 'up' ? <ChevronUp size={10} color="#10b981" /> : cat.trend === 'down' ? <ChevronDown size={10} color="#ef4444" /> : null}
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ height: '4px', background: '#111827', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${cat.score}%`, background: scoreColor, borderRadius: '2px', transition: 'width 600ms ease' }} />
                </div>

                {/* Details Accordion style */}
                {cat.details && cat.details.length > 0 && (
                  <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {cat.details.map((detail, dIdx) => (
                      <span key={dIdx} style={{ fontSize: '9.5px', color: '#6b7280' }}>
                        • {detail}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Suggestions & Actions list ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#4b5563', letterSpacing: '0.05em' }}>HEALTH OPTIMIZATION SUGGESTIONS</span>
        {suggestions.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '12px', background: 'rgba(16,185,129,0.02)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '6px', fontSize: '11.5px', color: '#10b981' }}>
            <Check size={14} />
            Codebase health meets architectural benchmarks perfectly. Zero improvements needed.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {suggestions.map((sug, idx) => (
              <div key={idx} style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid #1f2937',
                borderRadius: '6px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '4px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#f3f4f6' }}>{sug.title}</span>
                  <span style={{
                    fontSize: '8px', fontWeight: 700, textTransform: 'uppercase',
                    color: sug.priority === 'high' ? '#ef4444' : sug.priority === 'medium' ? '#eab308' : '#3b82f6',
                    background: sug.priority === 'high' ? 'rgba(239,68,68,0.1)' : sug.priority === 'medium' ? 'rgba(234,179,8,0.1)' : 'rgba(59,130,246,0.1)',
                    padding: '1px 4px', borderRadius: '3px'
                  }}>{sug.priority}</span>
                </div>
                <p style={{ fontSize: '10.5px', color: '#9ca3af', margin: 0, lineHeight: '1.4' }}>{sug.description}</p>
                
                {sug.autoFixable && (
                  <button
                    onClick={() => alert(`Auto-Fix dispatched: ${sug.action}`)}
                    style={{
                      marginTop: '4px', background: 'rgba(59,130,246,0.15)', border: '1px solid #3b82f625',
                      borderRadius: '4px', color: '#60a5fa', fontSize: '10px', fontWeight: 600,
                      padding: '3px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', alignSelf: 'flex-start'
                    }}
                  >
                    <span>{sug.action}</span>
                    <ArrowRight size={10} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
export default ProjectHealthPanel;
