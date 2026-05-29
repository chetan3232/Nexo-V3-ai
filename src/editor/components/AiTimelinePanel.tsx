import { useEffect, useRef } from 'react';
import { useAiTimelineStore, TimelineEvent } from '@/store/useAiTimelineStore';
import { Clock, CheckCircle2, AlertCircle, Info, RefreshCw } from 'lucide-react';

function getStatusIcon(status: string) {
  switch (status) {
    case 'success':
      return <CheckCircle2 size={13} className="text-emerald-400" />;
    case 'failed':
      return <AlertCircle size={13} className="text-rose-400" />;
    case 'pending':
      return <RefreshCw size={13} className="text-cyan-400 animate-spin" />;
    default:
      return <Info size={13} className="text-slate-400" />;
  }
}

export function AiTimelinePanel() {
  const events = useAiTimelineStore((s) => s.events);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  if (events.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 12px',
        color: '#4b5563',
        textAlign: 'center',
        gap: '8px',
        fontSize: '11px',
      }}>
        <Clock size={20} color="#374151" />
        <span>Timeline Empty</span>
        <span style={{ color: '#3d444d' }}>Trigger the AI agent to log development actions.</span>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      padding: '10px 14px',
      maxHeight: '400px',
      overflowY: 'auto',
      borderLeft: '1px solid #1f2937',
      position: 'relative'
    }}>
      {events.map((event, idx) => {
        const time = new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const isLast = idx === events.length - 1;

        return (
          <div key={event.id} style={{
            display: 'flex',
            gap: '10px',
            position: 'relative',
            paddingBottom: isLast ? '0' : '14px'
          }}>
            {/* Timeline vertical connector line */}
            {!isLast && (
              <div style={{
                position: 'absolute',
                left: '11px',
                top: '22px',
                bottom: 0,
                width: '1px',
                background: 'rgba(55, 65, 81, 0.5)'
              }} />
            )}

            {/* Event icon bubble */}
            <div style={{
              width: '23px',
              height: '23px',
              borderRadius: '50%',
              background: '#111827',
              border: '1.5px solid #1f2937',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              flexShrink: 0,
              zIndex: 1,
              boxShadow: '0 0 8px rgba(0,0,0,0.4)'
            }}>
              {event.icon}
            </div>

            {/* Event detail */}
            <div style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.01)',
              border: '1px solid rgba(255,255,255,0.02)',
              borderRadius: '6px',
              padding: '6px 8px',
              minWidth: 0
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#e2e8f0' }}>{event.title}</span>
                <span style={{ fontSize: '9px', color: '#4b5563', fontFamily: 'monospace' }}>{time}</span>
              </div>
              <p style={{
                margin: 0,
                fontSize: '11px',
                color: '#8b949e',
                lineHeight: '1.4',
                wordBreak: 'break-word'
              }}>
                {event.detail}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '9.5px', color: '#6e7681' }}>
                {getStatusIcon(event.status)}
                <span style={{ textTransform: 'uppercase', fontSize: '8.5px', fontWeight: 700, letterSpacing: '0.04em' }}>
                  {event.agentId}
                </span>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
