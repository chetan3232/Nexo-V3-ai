import { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, Info, ChevronDown, RefreshCw, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useImpactStore } from '@/store/useImpactStore';
import { useEditorStore } from '@/store/useEditorStore';

export function ImpactAnalysisPanel() {
  const { report, isAnalyzing, analyzeImpact, clearReport } = useImpactStore();
  const { activeFile } = useEditorStore();
  const [desc, setDesc] = useState('');
  const [scenariosOpen, setScenariosOpen] = useState(true);
  const [stepsOpen, setStepsOpen] = useState(true);

  // Trigger analysis for active file
  const handleAnalyze = () => {
    if (!activeFile) return;
    void analyzeImpact(activeFile, desc || `Analyze impact of editing ${activeFile}`);
  };

  const getRiskDetails = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'critical':
        return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', border: '#ef444450', text: 'Critical Risk', icon: ShieldAlert };
      case 'high':
        return { color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', border: '#f9731650', text: 'High Risk', icon: AlertTriangle };
      case 'medium':
        return { color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)', border: '#eab30850', text: 'Medium Risk', icon: AlertTriangle };
      case 'low':
      default:
        return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: '#10b98150', text: 'Low Risk', icon: CheckCircle };
    }
  };

  const risk = report ? getRiskDetails(report.overallRisk) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0d1117', color: '#e2e8f0', padding: '14px', gap: '14px', overflowY: 'auto' }}>
      
      {/* ── Active File Check ── */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #1f2937', borderRadius: '8px', padding: '10px 12px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.05em', marginBottom: '6px' }}>
          TARGET COMPONENT
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: activeFile ? '#3b82f6' : '#6b7280', fontWeight: 600 }}>
          <FileText size={14} />
          <span style={{ wordBreak: 'break-all' }}>{activeFile || 'No file selected in editor'}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '10px' }}>
          <label style={{ fontSize: '10px', color: '#6b7280', fontWeight: 600 }}>CHANGE DESCRIPTION (OPTIONAL)</label>
          <input
            type="text"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="e.g., Rename active properties, change function signature..."
            style={{
              width: '100%', background: '#111827', border: '1px solid #1f2937',
              borderRadius: '6px', padding: '6px 8px', fontSize: '12px',
              color: '#e2e8f0', outline: 'none'
            }}
          />
        </div>

        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !activeFile}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            background: !activeFile ? '#1f2937' : '#3b82f6', border: 'none', borderRadius: '6px',
            color: !activeFile ? '#4b5563' : 'white', fontSize: '12px', fontWeight: 600,
            padding: '7px 0', cursor: !activeFile ? 'not-allowed' : 'pointer', marginTop: '10px',
            transition: 'background 120ms'
          }}
        >
          {isAnalyzing ? <RefreshCw size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          {isAnalyzing ? 'Analyzing Impact...' : 'Analyze Active File'}
        </button>
      </div>

      {/* ── Report Card ── */}
      {report && risk && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Overall Risk Badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '12px',
            background: risk.bg, border: `1px solid ${risk.border}`, borderRadius: '8px'
          }}>
            <risk.icon size={20} color={risk.color} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: risk.color }}>{risk.text}</div>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                Found {report.affectedFiles.length} direct/indirect downstream dependents.
              </div>
            </div>
          </div>

          {/* Affected Files */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#4b5563', letterSpacing: '0.05em' }}>AFFECTED DEPENDENTS</div>
            {report.affectedFiles.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid #1f2937', borderRadius: '6px', fontSize: '11.5px', color: '#6b7280' }}>
                <Info size={12} />
                No downstream modules import this file. Safe to refactor directly.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {report.affectedFiles.map((f, i) => {
                  const fileRisk = getRiskDetails(f.risk);
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'rgba(255,255,255,0.02)', border: '1px solid #1f2937',
                      borderRadius: '6px', padding: '8px 10px'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: 500, wordBreak: 'break-all' }}>{f.path.split('/').pop()}</span>
                        <span style={{ fontSize: '9.5px', color: '#6b7280', marginTop: '2px' }}>{f.path}</span>
                      </div>
                      <span style={{
                        fontSize: '9px', fontWeight: 700, textTransform: 'uppercase',
                        color: fileRisk.color, background: fileRisk.bg, border: `1px solid ${fileRisk.border}`,
                        padding: '1px 5px', borderRadius: '3px', flexShrink: 0
                      }}>
                        {f.risk}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Breakage Scenarios Accordion */}
          <div style={{ border: '1px solid #1f2937', borderRadius: '6px', overflow: 'hidden' }}>
            <button
              onClick={() => setScenariosOpen(!scenariosOpen)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: '#111827', border: 'none', padding: '8px 10px',
                color: '#e2e8f0', fontSize: '11px', fontWeight: 700, cursor: 'pointer'
              }}
            >
              <span>POTENTIAL BREAKAGE SCENARIOS</span>
              <ChevronDown size={12} style={{ transform: scenariosOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
            </button>
            <AnimatePresence initial={false}>
              {scenariosOpen && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden', background: '#0d1117' }}>
                  <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #1f2937' }}>
                    {report.breakageScenarios.map((s, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '8px', fontSize: '11.5px', color: '#9ca3af', lineHeight: '1.4' }}>
                        <span style={{ color: '#ef4444', fontWeight: 700 }}>•</span>
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Safe Refactor Steps Accordion */}
          <div style={{ border: '1px solid #1f2937', borderRadius: '6px', overflow: 'hidden' }}>
            <button
              onClick={() => setStepsOpen(!stepsOpen)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: '#111827', border: 'none', padding: '8px 10px',
                color: '#e2e8f0', fontSize: '11px', fontWeight: 700, cursor: 'pointer'
              }}
            >
              <span>SAFE REFACTORING STEPS</span>
              <ChevronDown size={12} style={{ transform: stepsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
            </button>
            <AnimatePresence initial={false}>
              {stepsOpen && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden', background: '#0d1117' }}>
                  <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #1f2937' }}>
                    {report.safeRefactorSteps.map((step, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '8px', fontSize: '11.5px', color: '#9ca3af', lineHeight: '1.4' }}>
                        <span style={{ color: '#10b981', fontWeight: 700 }}>{idx + 1}.</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </motion.div>
      )}

      {/* Welcome state when no report is built yet */}
      {!report && !isAnalyzing && (
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#4b5563', padding: '36px 0' }}>
          <ShieldAlert size={28} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af' }}>No Active Analysis</span>
          <span style={{ fontSize: '11px', textAlign: 'center', maxWidth: '200px', lineHeight: '1.4' }}>
            Click "Analyze Active File" to scan downstream dependencies and evaluate break risks.
          </span>
        </div>
      )}
    </div>
  );
}
