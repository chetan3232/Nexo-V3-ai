import { useEffect, useState, useRef } from 'react';
import { Cpu, Database, Activity, AlertTriangle, ShieldAlert, RefreshCw, Trash2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_NEXO_API_URL ?? 'http://localhost:8787';
const WS_BASE = API_BASE.replace(/^http/, 'ws') + '/api/ws';

type ErrorEntry = {
  message: string;
  stack: string;
  source: string;
  timestamp: number;
};

type TokenStat = {
  inputTokens: number;
  outputTokens: number;
  queryCount: number;
};

type AnalyticsData = {
  tokenUsage: Record<string, TokenStat>;
  errors: ErrorEntry[];
};

export function AnalyticsPanel() {
  const [pulseData, setPulseData] = useState<any>(null);
  const [cpuHistory, setCpuHistory] = useState<number[]>([]);
  const [ramHistory, setRamHistory] = useState<number[]>([]);
  const [stats, setStats] = useState<AnalyticsData>({ tokenUsage: {}, errors: [] });
  const [loading, setLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch token stats & errors
  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/analytics/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Failed to fetch analytics stats:', e);
    } finally {
      setLoading(false);
    }
  };

  // Connect to performance pulse WebSocket
  useEffect(() => {
    fetchStats();

    const ws = new WebSocket(WS_BASE);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'performance_pulse') {
          setPulseData(payload);
          setCpuHistory((prev) => {
            const next = [...prev, payload.cpu];
            if (next.length > 20) next.shift();
            return next;
          });
          setRamHistory((prev) => {
            const next = [...prev, payload.memory.systemPercent];
            if (next.length > 20) next.shift();
            return next;
          });
        }
      } catch (e) {
        // ignore
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  // Format bytes helper
  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Render inline SVG sparklines
  const renderSparkline = (dataPoints: number[], color: string) => {
    if (dataPoints.length === 0) {
      return (
        <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563', fontSize: '11px', fontStyle: 'italic' }}>
          Awaiting metrics...
        </div>
      );
    }
    const width = 360;
    const height = 80;
    const max = 100;
    const padding = 5;

    const points = dataPoints.map((val, index) => {
      const x = padding + (index / (dataPoints.length - 1 || 1)) * (width - padding * 2);
      const y = height - padding - (val / max) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');

    const gradId = `grad-${color.replace('#', '')}`;

    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {/* Helper grid lines */}
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="rgba(255,255,255,0.03)" strokeDasharray="3,3" />
        <line x1="0" y1={height - 1} x2={width} y2={height - 1} stroke="rgba(255,255,255,0.05)" />
        {/* Filled polygon below path */}
        <polygon
          fill={`url(#${gradId})`}
          points={`${padding},${height} ${points} ${width - padding},${height}`}
        />
        {/* Line path */}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={points}
          style={{ transition: 'all 0.1s linear' }}
        />
      </svg>
    );
  };

  const getModelColor = (modelName: string) => {
    if (modelName.includes('claude')) return '#f97316'; // Orange
    if (modelName.includes('gemini')) return '#3b82f6'; // Blue
    if (modelName.includes('openai')) return '#10b981'; // Green
    if (modelName.includes('nvidia') || modelName.includes('qwen')) return '#7c3aed'; // Violet
    return '#8b5cf6';
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      height: '100%',
      background: '#0d1117',
      color: '#c9d1d9',
      fontFamily: "'Inter', sans-serif",
      overflow: 'hidden',
    }}>
      {/* COLUMN 1: System Vitals (CPU & RAM) */}
      <div style={{
        flex: '1.2',
        borderRight: '1px solid #1f2937',
        padding: '12px 16px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={13} color="#58a6ff" />
            System Resource Vitals
          </span>
          <span style={{ fontSize: '9px', fontWeight: 700, color: wsConnected ? '#7ee787' : '#ff7b72', background: 'rgba(255,255,255,0.02)', padding: '2px 6px', borderRadius: '4px' }}>
            {wsConnected ? '● REAL-TIME' : '○ DISCONNECTED'}
          </span>
        </div>

        {/* CPU Panel */}
        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid #1f2937', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Cpu size={14} color="#79c0ff" />
              Process CPU Load
            </span>
            <span style={{ fontFamily: 'monospace', fontSize: '15px', fontWeight: 700, color: '#58a6ff' }}>
              {pulseData?.cpu ?? '0.0'}%
            </span>
          </div>
          <div style={{ padding: '4px 0' }}>
            {renderSparkline(cpuHistory, '#58a6ff')}
          </div>
          <span style={{ fontSize: '10.5px', color: '#6e7681' }}>
            Normalised across {navigator.hardwareConcurrency || 4} CPU cores.
          </span>
        </div>

        {/* Memory Panel */}
        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid #1f2937', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Database size={14} color="#7ee787" />
              System RAM Usage
            </span>
            <span style={{ fontFamily: 'monospace', fontSize: '15px', fontWeight: 700, color: '#7ee787' }}>
              {pulseData?.memory?.systemPercent ?? '0.0'}%
            </span>
          </div>
          <div style={{ padding: '4px 0' }}>
            {renderSparkline(ramHistory, '#7ee787')}
          </div>
          {pulseData?.memory && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '10.5px', color: '#8b949e', fontFamily: 'monospace' }}>
              <span>IDE RSS: {formatBytes(pulseData.memory.rss)}</span>
              <span>Heap: {formatBytes(pulseData.memory.heapUsed)} / {formatBytes(pulseData.memory.heapTotal)}</span>
            </div>
          )}
        </div>
      </div>

      {/* COLUMN 2: Model Token Tracker */}
      <div style={{
        flex: '1.5',
        borderRight: '1px solid #1f2937',
        padding: '12px 16px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Database size={13} color="#bc8cff" />
            Model Token Consumption
          </span>
          <button
            onClick={fetchStats}
            disabled={loading}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#6e7681' }}
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {Object.keys(stats.tokenUsage).length === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563', fontSize: '11.5px', fontStyle: 'italic', padding: '24px' }}>
            No tokens consumed in this session yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(stats.tokenUsage).map(([model, usage]) => {
              const total = usage.inputTokens + usage.outputTokens;
              const barColor = getModelColor(model);
              return (
                <div key={model} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid #1f2937', borderRadius: '6px', padding: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0', fontFamily: 'monospace' }}>
                      {model.split('/').pop()}
                    </span>
                    <span style={{ fontSize: '11px', color: '#6e7681' }}>
                      {usage.queryCount} queries
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: '6px', background: '#161b22', borderRadius: '3px', overflow: 'hidden', display: 'flex', marginBottom: '8px' }}>
                    <div style={{ width: `${(usage.inputTokens / total) * 100}%`, background: barColor, opacity: 0.8 }} />
                    <div style={{ width: `${(usage.outputTokens / total) * 100}%`, background: barColor }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#8b949e', fontFamily: 'monospace' }}>
                    <span>In: {usage.inputTokens.toLocaleString()}</span>
                    <span>Out: {usage.outputTokens.toLocaleString()}</span>
                    <span style={{ fontWeight: 'bold', color: '#c9d1d9' }}>Total: {total.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* COLUMN 3: Uncaught Exceptions Tracker */}
      <div style={{
        flex: '1.5',
        padding: '12px 16px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldAlert size={13} color="#f78166" />
            Uncaught Exceptions Tracker
          </span>
          <span style={{ fontSize: '10px', color: '#f78166', background: 'rgba(247,129,102,0.1)', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
            {stats.errors.length} detected
          </span>
        </div>

        {stats.errors.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#4b5563', gap: '6px', padding: '24px' }}>
            <ShieldAlert size={20} color="#374151" />
            <span style={{ fontSize: '11.5px', fontStyle: 'italic' }}>Zero exceptions raised. System is stable.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {stats.errors.map((err, i) => (
              <div key={i} style={{ background: 'rgba(247,129,102,0.02)', border: '1px solid rgba(247,129,102,0.15)', borderRadius: '6px', padding: '8px 10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#f78166', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={12} />
                    {err.message.length > 50 ? err.message.substring(0, 50) + '...' : err.message}
                  </span>
                  <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#8b949e', background: 'rgba(255,255,255,0.03)', padding: '1px 4px', borderRadius: '3px' }}>
                    {err.source}
                  </span>
                </div>
                {err.stack && (
                  <pre style={{ margin: '4px 0 0', padding: '6px', background: '#161b22', border: '1px solid #21262d', borderRadius: '4px', fontSize: '9.5px', color: '#8b949e', fontFamily: 'monospace', overflowX: 'auto', maxHeight: '60px' }}>
                    {err.stack}
                  </pre>
                )}
                <div style={{ fontSize: '9px', color: '#4b5563', textAlign: 'right', marginTop: '4px' }}>
                  {new Date(err.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
