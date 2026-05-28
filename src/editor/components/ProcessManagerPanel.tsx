import { useEffect, useState, useRef } from 'react';
import { Play, Square, RefreshCw, Terminal, Eye, AlertCircle } from 'lucide-react';
import { useIdeLayoutStore } from '@/store/useIdeLayoutStore';

type ProcessInfo = {
  id: string;
  name: string;
  command: string;
  runtime: string;
  port: number;
  status: 'idle' | 'booting' | 'active' | 'error';
  logs: string;
};

const API_BASE = import.meta.env.VITE_NEXO_API_URL ?? 'http://localhost:8787';
const WS_BASE = API_BASE.replace(/^http/, 'ws') + '/api/ws';

export function ProcessManagerPanel() {
  const { setPreviewOpen, setPreviewUrl } = useIdeLayoutStore();
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  const selectedProcess = processes.find(p => p.id === selectedId);

  // Auto scroll console logs
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedProcess?.logs]);

  // Connect to websocket gateway
  useEffect(() => {
    const ws = new WebSocket(WS_BASE);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      // Request initial list
      ws.send(JSON.stringify({ type: 'runtime_list' }));
    };

    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      const { type } = payload;

      if (type === 'runtime_processes') {
        setProcesses(payload.processes);
        if (payload.processes.length > 0 && !selectedId) {
          setSelectedId(payload.processes[0].id);
        }
      } else if (type === 'runtime_status') {
        const { id, status } = payload;
        setProcesses(prev => prev.map(p => p.id === id ? { ...p, status } : p));
      } else if (type === 'runtime_log') {
        const { id, data } = payload;
        setProcesses(prev => prev.map(p => p.id === id ? { ...p, logs: p.logs + data } : p));
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleStart = (id: string) => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify({ type: 'runtime_start', id }));
    }
  };

  const handleStop = (id: string) => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify({ type: 'runtime_stop', id }));
    }
  };

  const handleRestart = (id: string) => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify({ type: 'runtime_restart', id }));
    }
  };

  const handlePreview = (proc: ProcessInfo) => {
    const previewPort = proc.port;
    const url = `http://localhost:${previewPort}`;
    setPreviewUrl(url);
    setPreviewOpen(true);
  };

  const clearLogs = (id: string) => {
    setProcesses(prev => prev.map(p => p.id === id ? { ...p, logs: '' } : p));
  };

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      background: '#0d1117',
      color: '#c9d1d9',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Left Pane - Process list */}
      <div style={{
        width: '320px',
        borderRight: '1px solid #1f2937',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        flexShrink: 0,
      }}>
        <div style={{
          padding: '8px 12px',
          fontSize: '11px',
          fontWeight: 700,
          color: '#6e7681',
          borderBottom: '1px solid #111827',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>RUNTIMES</span>
          {!isConnected && <span style={{ color: '#ef4444', fontSize: '9px' }}>● OFFLINE</span>}
          {isConnected && <span style={{ color: '#10b981', fontSize: '9px' }}>● GATEWAY OK</span>}
        </div>

        <div style={{ flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {processes.map((proc) => {
            const isSelected = selectedId === proc.id;
            const statusColors = {
              idle: '#6e7681',
              booting: '#f59e0b',
              active: '#10b981',
              error: '#ef4444'
            };
            return (
              <div
                key={proc.id}
                onClick={() => setSelectedId(proc.id)}
                style={{
                  background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255,255,255,0.02)',
                  border: isSelected ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid #1f2937',
                  borderRadius: '6px',
                  padding: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  position: 'relative',
                  transition: 'all 120ms',
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      background: '#1e293b',
                      color: '#94a3b8',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      textTransform: 'uppercase'
                    }}>{proc.runtime}</span>
                    <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#e2e8f0' }}>{proc.name}</span>
                  </div>

                  {/* Status Dot */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span
                      className={proc.status === 'booting' ? 'animate-pulse' : ''}
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: statusColors[proc.status],
                        display: 'inline-block'
                      }}
                    />
                    <span style={{ fontSize: '10px', color: '#6e7681', textTransform: 'capitalize' }}>{proc.status}</span>
                  </div>
                </div>

                {/* Command & Port */}
                <div style={{ fontSize: '11px', color: '#6e7681', fontFamily: "'JetBrains Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  $ {proc.command}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                  {proc.port ? (
                    <span style={{ fontSize: '10.5px', color: '#3b82f6', fontFamily: "'JetBrains Mono', monospace" }}>
                      port {proc.port}
                    </span>
                  ) : <span />}

                  {/* Actions buttons */}
                  <div style={{ display: 'flex', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                    {proc.status === 'idle' || proc.status === 'error' ? (
                      <button
                        onClick={() => handleStart(proc.id)}
                        title="Start Server"
                        style={actionBtnStyle}
                      >
                        <Play size={11} fill="#10b981" color="#10b981" />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleStop(proc.id)}
                          title="Stop Server"
                          style={actionBtnStyle}
                        >
                          <Square size={11} fill="#ef4444" color="#ef4444" />
                        </button>
                        <button
                          onClick={() => handleRestart(proc.id)}
                          title="Restart Server"
                          style={actionBtnStyle}
                        >
                          <RefreshCw size={11} />
                        </button>
                      </>
                    )}

                    {proc.status === 'active' && (
                      <button
                        onClick={() => handlePreview(proc)}
                        title="Open Preview"
                        style={{ ...actionBtnStyle, background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.4)' }}
                      >
                        <Eye size={11} color="#60a5fa" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Pane - Logs viewport */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: '#070a0f',
        position: 'relative',
      }}>
        {selectedProcess ? (
          <>
            {/* Logs header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 14px',
              background: '#0d1117',
              borderBottom: '1px solid #1f2937',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Terminal size={12} color="#60a5fa" />
                <span>CONSOLE LOGS: {selectedProcess.name}</span>
              </span>
              <button
                onClick={() => clearLogs(selectedProcess.id)}
                style={{
                  background: 'none',
                  border: '1px solid #1f2937',
                  borderRadius: '4px',
                  color: '#6e7681',
                  fontSize: '10px',
                  padding: '2px 8px',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#374151'; (e.currentTarget as HTMLButtonElement).style.color = '#c9d1d9'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#1f2937'; (e.currentTarget as HTMLButtonElement).style.color = '#6e7681'; }}
              >
                Clear
              </button>
            </div>

            {/* Logs box */}
            <div style={{
              flex: 1,
              padding: '10px 14px',
              overflowY: 'auto',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
              lineHeight: '1.6',
              color: '#d1d5db',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}>
              {selectedProcess.logs ? (
                selectedProcess.logs.split('\n').map((line, i) => (
                  <div key={i} style={{ color: line.startsWith('[error]') ? '#f87171' : line.startsWith('[runtime]') ? '#60a5fa' : '#d1d5db' }}>
                    {line}
                  </div>
                ))
              ) : (
                <div style={{ color: '#4b5563', fontStyle: 'italic', padding: '10px 0' }}>Waiting for output logs...</div>
              )}
              <div ref={consoleEndRef} />
            </div>
          </>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            color: '#4b5563',
            gap: '8px',
          }}>
            <AlertCircle size={24} />
            <span style={{ fontSize: '12px' }}>No active runtime process selected.</span>
          </div>
        )}
      </div>
    </div>
  );
}

const actionBtnStyle: React.CSSProperties = {
  background: '#1f2937',
  border: '1px solid #374151',
  borderRadius: '4px',
  width: '22px',
  height: '22px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  color: '#c9d1d9',
  transition: 'all 120ms',
};
