import { useState } from 'react';
import { RotateCw, ExternalLink, Laptop, Tablet, Smartphone, HelpCircle } from 'lucide-react';
import { useIdeLayoutStore } from '@/store/useIdeLayoutStore';

export function LivePreview() {
  const { previewUrl, setPreviewUrl, previewOpen, setPreviewOpen } = useIdeLayoutStore();
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);
  const [urlInput, setUrlInput] = useState(previewUrl);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      let targetUrl = urlInput.trim();
      if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = 'http://' + targetUrl;
      }
      setPreviewUrl(targetUrl);
      setUrlInput(targetUrl);
    }
  };

  const handleOpenExternal = () => {
    window.open(previewUrl, '_blank');
  };

  const deviceWidths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '390px',
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#090d16',
      borderLeft: '1px solid #1f2937',
      overflow: 'hidden',
    }}>
      {/* Browser address bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 12px',
        background: '#111827',
        borderBottom: '1px solid #1f2937',
        height: '35px',
        flexShrink: 0,
      }}>
        {/* Refresh */}
        <button
          onClick={handleRefresh}
          title="Reload preview"
          style={navBtnStyle}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#e2e8f0'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#6b7280'; }}
        >
          <RotateCw size={13} />
        </button>

        {/* Address input */}
        <form onSubmit={handleUrlSubmit} style={{ flex: 1, display: 'flex' }}>
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="http://localhost:3000"
            style={{
              flex: 1,
              background: '#0d1117',
              border: '1px solid #1f2937',
              borderRadius: '4px',
              color: '#c9d1d9',
              fontSize: '11.5px',
              padding: '2px 8px',
              height: '22px',
              outline: 'none',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          />
        </form>

        {/* Device emulator selector */}
        <div style={{ display: 'flex', gap: '2px', background: '#0d1117', padding: '2px', borderRadius: '4px', border: '1px solid #1f2937' }}>
          {[
            { id: 'desktop', title: 'Desktop Layout', icon: Laptop },
            { id: 'tablet', title: 'Tablet Portrait', icon: Tablet },
            { id: 'mobile', title: 'Mobile Viewport', icon: Smartphone }
          ].map((dev) => {
            const Icon = dev.icon;
            const active = device === dev.id;
            return (
              <button
                key={dev.id}
                title={dev.title}
                onClick={() => setDevice(dev.id as any)}
                style={{
                  ...emulateBtnStyle,
                  background: active ? '#1e3a8a' : 'transparent',
                  color: active ? '#ffffff' : '#6b7280',
                }}
                onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = '#e2e8f0'; }}
                onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = '#6b7280'; }}
              >
                <Icon size={12} />
              </button>
            );
          })}
        </div>

        {/* External Link */}
        <button
          onClick={handleOpenExternal}
          title="Open in new browser window"
          style={navBtnStyle}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#e2e8f0'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#6b7280'; }}
        >
          <ExternalLink size={13} />
        </button>

        {/* Close Preview */}
        <button
          onClick={() => setPreviewOpen(false)}
          title="Hide Live Preview"
          style={{
            ...navBtnStyle,
            fontSize: '10px',
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: '4px',
            border: '1px solid #374151',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#ef4444'; (e.currentTarget as HTMLButtonElement).style.color = 'white'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#6b7280'; }}
        >
          ✕
        </button>
      </div>

      {/* Frame viewport container */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: device === 'desktop' ? '0' : '16px',
        overflow: 'auto',
        background: '#090d16',
      }}>
        <div style={{
          width: deviceWidths[device],
          height: device === 'desktop' ? '100%' : '80%',
          maxWidth: '100%',
          maxHeight: '100%',
          transition: 'width 200ms ease, height 200ms ease',
          boxShadow: device === 'desktop' ? 'none' : '0 20px 50px rgba(0,0,0,0.6)',
          borderRadius: device === 'desktop' ? '0' : '12px',
          border: device === 'desktop' ? 'none' : '6px solid rgba(31, 41, 55, 0.75)',
          overflow: 'hidden',
          background: '#ffffff',
          position: 'relative',
        }}>
          <iframe
            key={refreshKey}
            src={previewUrl}
            title="Nexo Live Preview Viewport"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: '#ffffff',
            }}
          />
        </div>
      </div>
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: '4px',
  cursor: 'pointer',
  color: '#6b7280',
  borderRadius: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'color 100ms, background 100ms',
};

const emulateBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: '3px 5px',
  cursor: 'pointer',
  borderRadius: '3px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 120ms',
};
