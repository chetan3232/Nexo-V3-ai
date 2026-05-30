import React, { useState } from 'react';
import { useAuth } from '@/auth/useAuth';
import { RefreshCw, UserCheck, Trash2, LogOut, Terminal, Shield, Sparkles, X } from 'lucide-react';
import { useNotificationStore } from '@/store/useNotificationStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileDropdown: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user, logout, isMock, refreshUser, deleteAccount, reAuthenticateUser } = useAuth();
  const showToast = useNotificationStore((s) => s.showToast);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !user) return null;

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await refreshUser();
      showToast('Profile reloaded successfully!', 'success');
    } catch (e: any) {
      showToast(`Refresh failed: ${e.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReauth = async () => {
    setLoading(true);
    try {
      const success = await reAuthenticateUser();
      if (success) {
        showToast('Secure credentials re-validated!', 'success');
      }
    } catch (e: any) {
      showToast(`Re-authentication failed: ${e.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirm = window.confirm('Are you absolutely sure you want to permanently delete your NEXO account? This action is irreversible.');
    if (!confirm) return;
    
    setLoading(true);
    try {
      await deleteAccount();
      showToast('Your account was deleted successfully.', 'success');
    } catch (e: any) {
      showToast(`Account deletion failed: ${e.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      showToast('Signed out successfully.', 'info');
    } catch (e: any) {
      showToast(`Sign out failed: ${e.message}`, 'error');
    }
  };

  return (
    <div style={containerStyle}>
      {/* Click outside backdrop */}
      <div onClick={onClose} style={backdropStyle} />

      {/* Popover content card */}
      <div style={dropdownCardStyle}>
        
        {/* Header with Close */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} color="#06b6d4" />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#e2e8f0' }}>Account Profile</span>
          </div>
          <button onClick={onClose} style={closeBtnStyle}>
            <X size={14} />
          </button>
        </div>

        {/* User Info Card */}
        <div style={userInfoStyle}>
          <img
            src={user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80'}
            alt="Avatar"
            style={avatarStyle}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={nameStyle}>{user.displayName || 'Developer'}</div>
            <div style={emailStyle}>{user.email || 'developer@nexo.ai'}</div>
          </div>
        </div>

        {/* Info Grid */}
        <div style={infoGridStyle}>
          <div style={infoRowStyle}>
            <span style={labelStyle}>User ID:</span>
            <span style={valueStyle}>{user.uid}</span>
          </div>
          <div style={infoRowStyle}>
            <span style={labelStyle}>Auth Provider:</span>
            <span style={isMock ? mockBadge : firebaseBadge}>
              {isMock ? <Terminal size={10} /> : <Shield size={10} />}
              <span>{isMock ? 'Mock Server' : 'Google Auth'}</span>
            </span>
          </div>
        </div>

        {/* Divider */}
        <div style={dividerStyle} />

        {/* Action list */}
        <div style={actionListStyle}>
          <button onClick={handleRefresh} disabled={loading} style={actionBtnStyle}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Profile Data</span>
          </button>
          
          <button onClick={handleReauth} disabled={loading} style={actionBtnStyle}>
            <UserCheck size={13} />
            <span>Re-Authenticate Session</span>
          </button>
          
          <button onClick={handleDelete} disabled={loading} style={deleteBtnStyle}>
            <Trash2 size={13} />
            <span>Delete Nexo Account</span>
          </button>
        </div>

        {/* Footer with Logout */}
        <div style={footerStyle}>
          <button onClick={handleLogout} style={logoutBtnStyle}>
            <LogOut size={13} />
            <span>Logout of IDE</span>
          </button>
        </div>

      </div>
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: '54px', // Positioned above the activity bar buttons
  left: '48px',
  zIndex: 9990,
};

const backdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'transparent',
  zIndex: -1,
};

const dropdownCardStyle: React.CSSProperties = {
  width: '280px',
  background: '#111827',
  border: '1px solid #1f2937',
  borderRadius: '8px',
  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 20px rgba(6, 182, 212, 0.02)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 14px',
  borderBottom: '1px solid #1f2937',
  background: '#0d1117',
};

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#4b5563',
  cursor: 'pointer',
  padding: '2px',
  display: 'flex',
};

const userInfoStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '14px',
  background: '#0d1117',
};

const avatarStyle: React.CSSProperties = {
  width: '38px',
  height: '38px',
  borderRadius: '50%',
  border: '1.5px solid rgba(6, 182, 212, 0.25)',
  objectFit: 'cover',
};

const nameStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 700,
  color: '#ffffff',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const emailStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#6b7280',
  marginTop: '2px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const infoGridStyle: React.CSSProperties = {
  padding: '10px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const infoRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: '10.5px',
};

const labelStyle: React.CSSProperties = {
  color: '#6b7280',
};

const valueStyle: React.CSSProperties = {
  color: '#8b949e',
  fontFamily: 'monospace',
  fontWeight: 600,
};

const firebaseBadge: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  background: 'rgba(74, 222, 128, 0.08)',
  border: '1px solid rgba(74, 222, 128, 0.2)',
  padding: '2px 6px',
  borderRadius: '9999px',
  color: '#4ade80',
  fontSize: '9px',
  fontWeight: 700,
};

const mockBadge: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  background: 'rgba(251, 146, 60, 0.08)',
  border: '1px solid rgba(251, 146, 60, 0.2)',
  padding: '2px 6px',
  borderRadius: '9999px',
  color: '#fb923c',
  fontSize: '9px',
  fontWeight: 700,
};

const dividerStyle: React.CSSProperties = {
  height: '1px',
  background: '#1f2937',
};

const actionListStyle: React.CSSProperties = {
  padding: '6px',
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

const actionBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  width: '100%',
  background: 'transparent',
  border: 'none',
  color: '#9ca3af',
  fontSize: '11.5px',
  textAlign: 'left',
  padding: '7px 10px',
  borderRadius: '4px',
  cursor: 'pointer',
  transition: 'background 80ms, color 80ms',
};

const deleteBtnStyle: React.CSSProperties = {
  ...actionBtnStyle,
  color: '#f87171',
};

const footerStyle: React.CSSProperties = {
  padding: '6px',
  background: '#0d1117',
  borderTop: '1px solid #1f2937',
};

const logoutBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  justifyContent: 'center',
  width: '100%',
  background: 'rgba(239, 68, 68, 0.06)',
  border: '1px solid rgba(239, 68, 68, 0.15)',
  borderRadius: '5px',
  color: '#fca5a5',
  fontSize: '11.5px',
  fontWeight: 600,
  padding: '6px 0',
  cursor: 'pointer',
  transition: 'background 100ms',
};
