import { useState, useRef, useEffect } from 'react';
import { Package, Smartphone, Download, Blocks, RotateCw, CheckCircle2, AlertCircle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_NEXO_API_URL ?? 'http://localhost:8787';

type BuildTarget = {
  id: 'electron' | 'apk' | 'pwa' | 'tauri';
  name: string;
  desc: string;
  icon: React.ElementType;
  ext: string;
};

export function BuildPanel() {
  const [activeTarget, setActiveTarget] = useState<'electron' | 'apk' | 'pwa' | 'tauri' | null>(null);
  const [building, setBuilding] = useState(false);
  const [logs, setLogs] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const consoleEndRef = useRef<HTMLDivElement>(null);

  const targets: BuildTarget[] = [
    { id: 'electron', name: 'Electron Desktop', desc: 'Build native Win/macOS installer packages', icon: Package, ext: '.exe / .dmg' },
    { id: 'tauri', name: 'Tauri App', desc: 'Lightweight Rust-backed desktop bundle', icon: Blocks, ext: '.msi / .app' },
    { id: 'apk', name: 'Capacitor Android APK', desc: 'Package app bundle for Google Play / Android devices', icon: Smartphone, ext: '.apk' },
    { id: 'pwa', name: 'Progressive Web App', desc: 'Zip archive with offline service worker config', icon: Download, ext: '.zip' }
  ];

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleBuild = async (targetId: 'electron' | 'apk' | 'pwa' | 'tauri') => {
    if (building) return;
    setBuilding(true);
    setActiveTarget(targetId);
    setLogs('');
    setProgress(15);
    setStatus('idle');

    try {
      const response = await fetch(`${API_BASE}/api/build/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: targetId })
      });

      if (!response.ok) {
        throw new Error(`Build trigger failed: HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response stream not readable');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const textChunk = decoder.decode(value, { stream: true });
        const events = textChunk.split('\n\n');

        for (const event of events) {
          if (event.trim().startsWith('data: ')) {
            const dataStr = event.trim().substring(6);
            try {
              const payload = JSON.parse(dataStr);
              if (payload.log) {
                setLogs((prev) => prev + payload.log);
              }
              if (payload.result) {
                if (payload.result.status === 'success') {
                  setProgress(100);
                  setStatus('success');
                } else {
                  setStatus('error');
                }
                setBuilding(false);
              }
            } catch (e) {
              // Ignore partial JSON chunks
            }
          }
        }
      }
    } catch (err: any) {
      setLogs((prev) => prev + `\n[error] Export failed: ${err.message}\n`);
      setStatus('error');
      setBuilding(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#111827',
      overflow: 'hidden',
    }}>
      {/* Target Selector */}
      <div style={{ flex: '0 0 auto', padding: '12px 14px', borderBottom: '1px solid #1f2937' }}>
        <h3 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c9d1d9', marginBottom: '12px' }}>
          APP EXPORT TARGETS
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {targets.map((tgt) => {
            const Icon = tgt.icon;
            const isSelected = activeTarget === tgt.id;
            return (
              <div
                key={tgt.id}
                style={{
                  background: isSelected ? 'rgba(59, 130, 246, 0.06)' : 'rgba(255,255,255,0.01)',
                  border: isSelected ? '1px solid #3b82f6' : '1px solid #1f2937',
                  borderRadius: '8px',
                  padding: '10px',
                  display: 'flex',
                  alignItems: 'start',
                  gap: '10px',
                  cursor: building ? 'not-allowed' : 'pointer',
                  transition: 'all 120ms',
                }}
                onClick={() => { if (!building) setActiveTarget(tgt.id); }}
              >
                <div style={{
                  background: isSelected ? '#1e3a8a' : '#1f2937',
                  borderRadius: '6px',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isSelected ? '#ffffff' : '#6b7280',
                  marginTop: '2px',
                }}>
                  <Icon size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0' }}>{tgt.name}</span>
                    <span style={{ fontSize: '9px', color: '#4b5563', fontFamily: 'monospace' }}>{tgt.ext}</span>
                  </div>
                  <p style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px', lineHeight: '1.4' }}>{tgt.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {activeTarget && (
          <button
            onClick={() => handleBuild(activeTarget)}
            disabled={building}
            style={{
              width: '100%',
              background: building ? '#1f2937' : '#10b981',
              color: building ? '#4b5563' : '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 0',
              fontSize: '11px',
              fontWeight: 700,
              cursor: building ? 'not-allowed' : 'pointer',
              marginTop: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              transition: 'background 120ms',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            {building && <RotateCw size={12} className="animate-spin" />}
            <span>{building ? 'Exporting Package...' : 'Assemble & Export'}</span>
          </button>
        )}
      </div>

      {/* Progress & Log Console */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: '#070a0f',
        minHeight: 0,
      }}>
        {activeTarget ? (
          <>
            {/* Status bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 12px',
              background: '#0d1117',
              borderBottom: '1px solid #1f2937',
              fontSize: '10px',
              color: '#6e7681',
            }}>
              <span>COMPILATION: {activeTarget.toUpperCase()}</span>
              {status === 'success' && <span style={{ color: '#10b981', fontWeight: 700 }}>✓ COMPLETED</span>}
              {status === 'error' && <span style={{ color: '#ef4444', fontWeight: 700 }}>✕ FAILED</span>}
              {building && <span style={{ color: '#f59e0b' }}>● COMPILING ({progress}%)</span>}
            </div>

            {/* Logs console */}
            <div style={{
              flex: 1,
              padding: '10px 14px',
              overflowY: 'auto',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              lineHeight: '1.6',
              color: '#d1d5db',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}>
              {logs ? (
                logs.split('\n').map((line, i) => (
                  <div key={i} style={{ color: line.startsWith('[error]') ? '#f87171' : line.startsWith('[build]') ? '#60a5fa' : '#d1d5db' }}>
                    {line}
                  </div>
                ))
              ) : (
                <div style={{ color: '#4b5563', fontStyle: 'italic' }}>Waiting for compiler assembly trigger...</div>
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
            padding: '24px',
            textAlign: 'center',
          }}>
            <Package size={24} />
            <span style={{ fontSize: '11px' }}>Select an export target environment from list above to assemble app packages.</span>
          </div>
        )}
      </div>
    </div>
  );
}
