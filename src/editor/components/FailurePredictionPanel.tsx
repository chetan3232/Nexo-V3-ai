import { useEffect } from 'react';
import { useFailurePredictionStore } from '@/store/useFailurePredictionStore';
import { useEditorStore } from '@/store/useEditorStore';
import { ShieldAlert, AlertTriangle, CheckCircle, RefreshCw, FileCode, Hammer } from 'lucide-react';
import { motion } from 'framer-motion';

export function FailurePredictionPanel() {
  const { memoryLeakRisk, timeoutRisk, bundleBloatRisk, issues, isPredicting, predictFailures } = useFailurePredictionStore();
  const { openFile } = useEditorStore();

  useEffect(() => {
    if (issues.length === 0 && !isPredicting) {
      void predictFailures();
    }
  }, [predictFailures, issues.length, isPredicting]);

  const getRiskColor = (risk: number) => {
    if (risk >= 70) return '#ef4444'; // Red
    if (risk >= 40) return '#f97316'; // Orange
    return '#10b981'; // Green
  };

  const getRiskLabel = (risk: number) => {
    if (risk >= 70) return 'High Risk';
    if (risk >= 40) return 'Moderate';
    return 'Low Risk';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0d1117', color: '#e2e8f0', padding: '14px', gap: '14px', overflowY: 'auto' }}>
      
      {/* ── Risk Speedometers Dials ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#4b5563', letterSpacing: '0.05em' }}>PROACTIVE RISK AUDIT</span>
        <button
          onClick={() => predictFailures()}
          disabled={isPredicting}
          style={{
            background: 'transparent', border: 'none', color: '#3b82f6',
            fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
          }}
        >
          <RefreshCw size={11} className={isPredicting ? 'animate-spin' : ''} />
          Scan Code
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        {[
          { label: 'Memory Leak', score: memoryLeakRisk },
          { label: 'API Timeout', score: timeoutRisk },
          { label: 'Bundle Bloat', score: bundleBloatRisk }
        ].map(dial => (
          <div key={dial.label} style={{
            background: 'rgba(255,255,255,0.01)', border: '1px solid #1f2937',
            borderRadius: '8px', padding: '10px 8px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', textAlign: 'center', gap: '6px'
          }}>
            {/* Small circular SVG gauge */}
            <div style={{ position: 'relative', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <circle cx="25" cy="25" r="21" fill="none" stroke="#1f2937" strokeWidth="4" />
                <circle
                  cx="25" cy="25" r="21" fill="none"
                  stroke={getRiskColor(dial.score)} strokeWidth="4"
                  strokeDasharray={2 * Math.PI * 21}
                  strokeDashoffset={2 * Math.PI * 21 * (1 - dial.score / 100)}
                  style={{ transition: 'stroke-dashoffset 800ms ease' }}
                />
              </svg>
              <span style={{ position: 'absolute', fontSize: '11.5px', fontWeight: 800, color: '#ffffff' }}>
                {dial.score}%
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <span style={{ fontSize: '9px', fontWeight: 700, color: '#9ca3af' }}>{dial.label}</span>
              <span style={{ fontSize: '8px', color: getRiskColor(dial.score), fontWeight: 700 }}>
                {getRiskLabel(dial.score)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Predicted Issues list ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#4b5563', letterSpacing: '0.05em' }}>PREDICTED ANOMALIES & VULNERABILITIES</span>
        {issues.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '12px', background: 'rgba(16,185,129,0.02)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '6px', fontSize: '11.5px', color: '#10b981' }}>
            <CheckCircle size={14} strokeWidth={2} />
            No structural anomalies predicted. Workspace looks extremely solid.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {issues.map(issue => (
              <div key={issue.id} style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid #1f2937',
                borderRadius: '6px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '4px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>{issue.title}</span>
                  <span style={{
                    fontSize: '8px', fontWeight: 700, textTransform: 'uppercase',
                    color: issue.severity === 'high' ? '#ef4444' : '#eab308',
                    background: issue.severity === 'high' ? 'rgba(239,68,68,0.1)' : 'rgba(234,179,8,0.1)',
                    padding: '1px 4px', borderRadius: '3px'
                  }}>{issue.severity}</span>
                </div>
                
                <p style={{ fontSize: '10.5px', color: '#9ca3af', margin: 0, lineHeight: '1.4' }}>{issue.description}</p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', borderTop: '1px solid #141b24', paddingTop: '6px' }}>
                  <button
                    onClick={() => openFile(issue.file)}
                    style={{
                      background: 'none', border: 'none', color: '#3b82f6',
                      fontSize: '9.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', padding: 0
                    }}
                  >
                    <FileCode size={11} />
                    <span>{issue.file.split('/').pop()}</span>
                  </button>

                  <button
                    onClick={() => alert(`Initiating code fix patch on ${issue.file}...`)}
                    style={{
                      background: 'rgba(167, 139, 250, 0.15)', border: '1px solid rgba(167, 139, 250, 0.25)',
                      borderRadius: '4px', color: '#c084fc', fontSize: '9px', fontWeight: 600,
                      padding: '2px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px'
                    }}
                  >
                    <Hammer size={10} />
                    <span>Refactor</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
export default FailurePredictionPanel;
