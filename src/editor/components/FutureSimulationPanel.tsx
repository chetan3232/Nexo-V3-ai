import { useState } from 'react';
import { useFutureSimStore } from '@/store/useFutureSimStore';
import { Play, TrendingUp, Info, ShieldAlert, Cpu, Database, Clock, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export function FutureSimulationPanel() {
  const { horizon, pathType, data, reports, isSimulating, setHorizon, setPathType, simulateGrowth } = useFutureSimStore();

  const handleSimulate = () => {
    void simulateGrowth();
  };

  const getPathColor = (type: string) => {
    switch (type) {
      case 'mvp': return '#ef4444'; // Red
      case 'scalable': return '#3b82f6'; // Blue
      case 'enterprise': return '#a855f7'; // Purple
      default: return '#9ca3af';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0d1117', color: '#e2e8f0', padding: '14px', gap: '14px', overflowY: 'auto' }}>
      
      {/* ── Settings Panel ── */}
      <div style={{
        background: 'rgba(255,255,255,0.02)', border: '1px solid #1f2937',
        borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px'
      }}>
        <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.05em' }}>
          GROWTH TIME HORIZON
        </div>

        {/* Month Slider */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#f3f4f6', fontWeight: 600 }}>
            <span>Time Horizon:</span>
            <span style={{ color: getPathColor(pathType) }}>{horizon} Months</span>
          </div>
          <input
            type="range"
            min="3"
            max="18"
            step="1"
            value={horizon}
            onChange={(e) => setHorizon(Number(e.target.value))}
            style={{ width: '100%', accentColor: getPathColor(pathType) }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#4b5563' }}>
            <span>3 Months</span>
            <span>18 Months</span>
          </div>
        </div>

        {/* Path Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
          <label style={{ fontSize: '9.5px', color: '#6b7280', fontWeight: 600 }}>ARCHITECTURAL PATTERNS</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            {[
              { id: 'mvp', title: 'Fast MVP', color: '#ef4444' },
              { id: 'scalable', title: 'Scalable', color: '#3b82f6' },
              { id: 'enterprise', title: 'Enterprise', color: '#a855f7' }
            ].map(path => (
              <button
                key={path.id}
                type="button"
                onClick={() => setPathType(path.id as any)}
                style={{
                  background: pathType === path.id ? `${path.color}15` : 'rgba(255, 255, 255, 0.01)',
                  border: `1.5px solid ${pathType === path.id ? path.color : '#1f2937'}`,
                  borderRadius: '6px', color: pathType === path.id ? '#ffffff' : '#9ca3af',
                  fontSize: '11px', fontWeight: 600, padding: '8px 4px', cursor: 'pointer',
                  transition: 'all 120ms'
                }}
              >
                {path.title}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSimulate}
          disabled={isSimulating}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', borderRadius: '6px',
            color: 'white', fontSize: '12px', fontWeight: 700, padding: '8px 0', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)', transition: 'transform 100ms', marginTop: '6px'
          }}
        >
          {isSimulating ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} fill="white" />}
          {isSimulating ? 'Simulating growth model...' : 'Simulate Growth'}
        </button>
      </div>

      {/* ── Simulation Charts & Results ── */}
      {data && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Simple SVG Chart representing connection spikes */}
          <div style={{ background: '#070a0f', border: '1px solid #1f2937', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', letterSpacing: '0.04em' }}>
              SIMULATED CONCURRENT CONNECTIONS
            </span>
            <div style={{ height: '100px', width: '100%', position: 'relative', overflow: 'hidden' }}>
              <svg style={{ width: '100%', height: '100%' }}>
                <path
                  d={`M ${data.activeSockets.map((s, idx) => {
                    const x = (idx / (data.activeSockets.length - 1)) * 320;
                    const y = 90 - Math.min(80, (s / Math.max(...data.activeSockets)) * 80);
                    return `${x} ${y}`;
                  }).join(' L ')}`}
                  fill="none"
                  stroke={getPathColor(pathType)}
                  strokeWidth="2.5"
                />
              </svg>
              <div style={{ position: 'absolute', bottom: '2px', left: '2px', fontSize: '8px', color: '#4b5563' }}>Start</div>
              <div style={{ position: 'absolute', bottom: '2px', right: '2px', fontSize: '8px', color: '#4b5563' }}>{horizon} Months</div>
              <div style={{ position: 'absolute', top: '2px', right: '2px', fontSize: '9px', fontWeight: 700, color: getPathColor(pathType) }}>
                Peak: {Math.max(...data.activeSockets).toLocaleString()} Sockets
              </div>
            </div>
          </div>

          {/* Scalability bottlenecks logs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#4b5563', letterSpacing: '0.05em' }}>BOTTLENECK PREDICTIONS</span>
            {reports.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px', background: 'rgba(16,185,129,0.02)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '6px', fontSize: '11.5px', color: '#10b981' }}>
                <Info size={13} />
                No bottlenecks found under the simulated traffic. Safe to proceed with this architecture.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {reports.map((rep, idx) => (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '8px',
                    background: rep.type === 'critical' ? 'rgba(239,68,68,0.05)' : 'rgba(249,115,22,0.05)',
                    border: `1px solid ${rep.type === 'critical' ? '#ef444430' : '#f9731630'}`,
                    borderRadius: '6px', padding: '10px'
                  }}>
                    <ShieldAlert size={14} color={rep.type === 'critical' ? '#ef4444' : '#f97316'} style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#f3f4f6' }}>{rep.title}</div>
                      <p style={{ fontSize: '10.5px', color: '#9ca3af', margin: '2px 0 0', lineHeight: '1.4' }}>{rep.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Growth metrics grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid #1f2937', borderRadius: '6px', padding: '8px 10px' }}>
              <div style={{ fontSize: '9px', color: '#6b7280', fontWeight: 600 }}>MAX CPU LOAD</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#e2e8f0', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Cpu size={14} />
                {Math.max(...data.cpuLoad)}%
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid #1f2937', borderRadius: '6px', padding: '8px 10px' }}>
              <div style={{ fontSize: '9px', color: '#6b7280', fontWeight: 600 }}>MAX DB QUERIES</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#e2e8f0', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Database size={14} />
                {Math.max(...data.dbQueries).toLocaleString()}/s
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid #1f2937', borderRadius: '6px', padding: '8px 10px', gridColumn: 'span 2' }}>
              <div style={{ fontSize: '9px', color: '#6b7280', fontWeight: 600 }}>MAX RESPONSE LATENCY</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#e2e8f0', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={14} />
                {Math.max(...data.latency)} ms
              </div>
            </div>
          </div>

        </motion.div>
      )}

      {/* Welcome state when no simulation is run yet */}
      {!data && !isSimulating && (
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#4b5563', padding: '36px 0' }}>
          <TrendingUp size={28} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af' }}>Time Machine Simulator Ready</span>
          <span style={{ fontSize: '11px', textAlign: 'center', maxWidth: '200px', lineHeight: '1.4' }}>
            Choose scale parameters and click "Simulate Growth" to evaluate bottlenecks.
          </span>
        </div>
      )}
    </div>
  );
}
export default FutureSimulationPanel;
