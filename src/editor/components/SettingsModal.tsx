import React from 'react';
import { useAuth } from '@/auth/useAuth';
import { useSettingsStore } from '@/store/useSettingsStore';
import { X, Sliders, Type, ToggleLeft, ToggleRight, CloudLightning, ShieldCheck } from 'lucide-react';
import { useNotificationStore } from '@/store/useNotificationStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { saveEditorSettings, syncUserSettings, syncWorkspaces, syncChats } = useAuth();
  const { fontSize, wordWrap, autoSave } = useSettingsStore();
  const showToast = useNotificationStore((s) => s.showToast);

  if (!isOpen) return null;

  const handleSyncSettings = async () => {
    try {
      await syncUserSettings();
      showToast('Settings synced to Nexo Cloud successfully!', 'success');
    } catch (e: any) {
      showToast(`Sync failed: ${e.message}`, 'error');
    }
  };

  const handleSyncWorkspaces = async () => {
    try {
      await syncWorkspaces();
      showToast('Recent workspaces backed up to Nexo Cloud!', 'success');
    } catch (e: any) {
      showToast(`Sync failed: ${e.message}`, 'error');
    }
  };

  const handleSyncChats = async () => {
    try {
      await syncChats();
      showToast('Chat history synced with Cloud databases!', 'success');
    } catch (e: any) {
      showToast(`Sync failed: ${e.message}`, 'error');
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={16} color="#06b6d4" />
            <span style={titleStyle}>Editor Settings & Preferences</span>
          </div>
          <button onClick={onClose} style={closeBtnStyle}>
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={contentStyle}>
          
          {/* Editor Preferences */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>Editor Customization</h3>
            
            {/* Font size */}
            <div style={settingRowStyle}>
              <div style={labelContainerStyle}>
                <Type size={16} color="#8b949e" />
                <div>
                  <div style={settingNameStyle}>Font Size</div>
                  <div style={settingDescStyle}>Adjust size of source code in workspace</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="range"
                  min="10"
                  max="24"
                  step="0.5"
                  value={fontSize}
                  onChange={(e) => saveEditorSettings({ fontSize: parseFloat(e.target.value) })}
                  style={sliderStyle}
                />
                <span style={valueBadgeStyle}>{fontSize}px</span>
              </div>
            </div>

            {/* Word wrap */}
            <div style={settingRowStyle}>
              <div style={labelContainerStyle}>
                <ToggleLeft size={16} color="#8b949e" />
                <div>
                  <div style={settingNameStyle}>Word Wrap</div>
                  <div style={settingDescStyle}>Wrap lines that exceed page layout width</div>
                </div>
              </div>
              <select
                value={wordWrap}
                onChange={(e) => saveEditorSettings({ wordWrap: e.target.value as 'on' | 'off' })}
                style={selectStyle}
              >
                <option value="off">Off</option>
                <option value="on">On</option>
              </select>
            </div>

            {/* Auto save */}
            <div style={settingRowStyle}>
              <div style={labelContainerStyle}>
                <ToggleRight size={16} color="#8b949e" />
                <div>
                  <div style={settingNameStyle}>Auto Save</div>
                  <div style={settingDescStyle}>Automatically commit file edits to backend disk</div>
                </div>
              </div>
              <button
                onClick={() => saveEditorSettings({ autoSave: !autoSave })}
                style={autoSave ? toggleBtnActiveStyle : toggleBtnStyle}
              >
                {autoSave ? 'Enabled' : 'Disabled'}
              </button>
            </div>

          </div>

          {/* Cloud Sync Section */}
          <div style={sectionStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ ...sectionTitleStyle, marginBottom: 0 }}>Nexo Cloud Sync</h3>
              <div style={badgeStyle}>
                <ShieldCheck size={11} style={{ color: '#06b6d4' }} />
                <span>Cloud Sync Ready</span>
              </div>
            </div>

            <div style={syncGridStyle}>
              <button onClick={handleSyncSettings} style={syncBtnStyle}>
                <CloudLightning size={14} />
                <span>Sync Editor Preferences</span>
              </button>
              <button onClick={handleSyncWorkspaces} style={syncBtnStyle}>
                <CloudLightning size={14} />
                <span>Sync Recent Projects</span>
              </button>
              <button onClick={handleSyncChats} style={syncBtnStyle}>
                <CloudLightning size={14} />
                <span>Sync Conversations</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

// Styles
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(3, 7, 18, 0.7)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  padding: '16px',
};

const modalStyle: React.CSSProperties = {
  width: '520px',
  background: '#0d1117',
  border: '1px solid #1f2937',
  borderRadius: '12px',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px 18px',
  borderBottom: '1px solid #1f2937',
  background: '#111827',
};

const titleStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 700,
  color: '#e2e8f0',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
};

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#6b7280',
  cursor: 'pointer',
  padding: '4px',
  borderRadius: '4px',
  display: 'flex',
};

const contentStyle: React.CSSProperties = {
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 800,
  color: '#06b6d4',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: '4px',
};

const settingRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 12px',
  background: '#111827',
  border: '1px solid #1f2937',
  borderRadius: '8px',
};

const labelContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const settingNameStyle: React.CSSProperties = {
  fontSize: '12.5px',
  fontWeight: 600,
  color: '#f3f4f6',
};

const settingDescStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#6b7280',
  marginTop: '2px',
};

const sliderStyle: React.CSSProperties = {
  accentColor: '#06b6d4',
  cursor: 'pointer',
};

const valueBadgeStyle: React.CSSProperties = {
  fontSize: '11.5px',
  fontWeight: 700,
  color: '#06b6d4',
  background: 'rgba(6, 182, 212, 0.08)',
  border: '1px solid rgba(6, 182, 212, 0.2)',
  padding: '2px 6px',
  borderRadius: '4px',
  minWidth: '45px',
  textAlign: 'center',
};

const selectStyle: React.CSSProperties = {
  background: '#0d1117',
  border: '1px solid #1f2937',
  borderRadius: '5px',
  color: '#f3f4f6',
  fontSize: '12px',
  padding: '4px 8px',
  outline: 'none',
  cursor: 'pointer',
};

const toggleBtnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid #1f2937',
  borderRadius: '5px',
  color: '#9ca3af',
  fontSize: '11px',
  fontWeight: 600,
  padding: '5px 10px',
  cursor: 'pointer',
};

const toggleBtnActiveStyle: React.CSSProperties = {
  ...toggleBtnStyle,
  background: 'rgba(6, 182, 212, 0.1)',
  border: '1px solid rgba(6, 182, 212, 0.3)',
  color: '#06b6d4',
};

const badgeStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '3px 8px',
  background: 'rgba(6, 182, 212, 0.05)',
  border: '1px solid rgba(6, 182, 212, 0.15)',
  borderRadius: '9999px',
  fontSize: '9.5px',
  fontWeight: 700,
  color: '#06b6d4',
  textTransform: 'uppercase',
};

const syncGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '10px',
};

const syncBtnStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  background: '#111827',
  border: '1px solid #1f2937',
  borderRadius: '8px',
  color: '#e2e8f0',
  fontSize: '11px',
  fontWeight: 600,
  padding: '14px 10px',
  cursor: 'pointer',
  textAlign: 'center',
  transition: 'all 120ms',
};
