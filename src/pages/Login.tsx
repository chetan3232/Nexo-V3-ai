import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { AlertCircle } from 'lucide-react';
import logoImage from '@/logo/image.png';
import { useNotificationStore } from '@/store/useNotificationStore';

const Login: React.FC = () => {
  const { signInWithGoogle, isAuthenticated, isAuthLoading, authError, isMock, rememberMe, setRememberMe } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [showError, setShowError] = useState(authError);
  const showToast = useNotificationStore((s) => s.showToast);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const redirectPath = (location.state as any)?.from?.pathname || '/ide';
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  useEffect(() => {
    setShowError(authError);
  }, [authError]);

  const handleGoogleLogin = async () => {
    setSubmitting(true);
    try {
      const loggedUser = await signInWithGoogle();
      if (loggedUser) {
        showToast(`Welcome back, ${loggedUser.displayName || 'Developer'}! Sign-in successful.`, 'success');
        const redirectPath = (location.state as any)?.from?.pathname || '/ide';
        navigate(redirectPath, { replace: true });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={containerStyle}>
      {/* Background Gradients */}
      <div style={glow1Style} />
      <div style={glow2Style} />
      
      {/* Login Card */}
      <div style={cardStyle}>
        
        {/* Branding Header */}
        <div style={brandHeaderStyle}>
          <div style={logoIconStyle}>
            <img src={logoImage} alt="Nexo Logo" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          </div>
          <h1 style={titleStyle}>NEXO <span style={titleAccentStyle}>V3</span></h1>
          <p style={subtitleStyle}>Next-Generation Multi-Agent IDE & Runtime</p>
        </div>

        {/* Informative Alert for Mock Mode */}
        {isMock && (
          <div style={mockInfoBoxStyle}>
            <p style={{ margin: 0, fontSize: '11px', lineHeight: '1.45', color: '#9ca3af' }}>
              <strong>Notice:</strong> Environment variables for Firebase are missing. Nexo will run in secure local database mode, allowing you to sign in instantly.
            </p>
          </div>
        )}

        {/* Error Alert */}
        {showError && (
          <div style={errorContainerStyle}>
            <AlertCircle size={15} style={{ color: '#f87171', flexShrink: 0, marginTop: '1px' }} />
            <span style={{ fontSize: '11.5px', color: '#fca5a5', lineHeight: '1.4' }}>{showError}</span>
          </div>
        )}

        {/* Button & Checkbox Settings */}
        <div style={formStyle}>
          
          {/* Remember Session Option */}
          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={checkboxStyle}
            />
            <span style={{ fontSize: '12.5px', color: '#9ca3af', userSelect: 'none' }}>
              Remember Login Session
            </span>
          </label>

          {/* Continue with Google Action */}
          <button
            onClick={handleGoogleLogin}
            disabled={submitting || isAuthLoading}
            style={submitting ? loginBtnLoadingStyle : loginBtnStyle}
            onMouseEnter={(e) => {
              if (!submitting) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(6, 182, 212, 0.15)';
                e.currentTarget.style.border = '1px solid rgba(6, 182, 212, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (!submitting) {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.border = '1px solid #1f2937';
              }
            }}
          >
            {submitting ? (
              <div style={btnSpinnerStyle} />
            ) : (
              <svg style={{ width: '16px', height: '16px', marginRight: '10px' }} viewBox="0 0 24 24">
                <path
                  fill="#ffffff"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#ea4335"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#fbbc05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#4285f4"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span style={{ fontWeight: 600 }}>
              {submitting ? 'Connecting Google Account...' : 'Continue with Google'}
            </span>
          </button>
          
        </div>
      </div>
      
      {/* Background Spinner Animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes rotateSpinner {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
};

// Vanilla styles configuration
const containerStyle: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh',
  width: '100vw',
  background: '#070a0f',
  color: '#e2e8f0',
  fontFamily: "'Inter', sans-serif",
  overflow: 'hidden',
};

const glow1Style: React.CSSProperties = {
  position: 'absolute',
  top: '20%',
  left: '15%',
  width: '500px',
  height: '500px',
  background: 'radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, rgba(0,0,0,0) 70%)',
  borderRadius: '50%',
  filter: 'blur(60px)',
  pointerEvents: 'none',
};

const glow2Style: React.CSSProperties = {
  position: 'absolute',
  bottom: '20%',
  right: '15%',
  width: '500px',
  height: '500px',
  background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, rgba(0,0,0,0) 70%)',
  borderRadius: '50%',
  filter: 'blur(60px)',
  pointerEvents: 'none',
};

const cardStyle: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  width: '380px',
  background: 'rgba(17, 24, 39, 0.55)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  borderRadius: '16px',
  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 50px rgba(6, 182, 212, 0.02)',
  padding: '36px',
  zIndex: 10,
};

const brandHeaderStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  marginBottom: '24px',
};

const logoIconStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  marginBottom: '14px',
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '24px',
  fontWeight: 900,
  letterSpacing: '0.06em',
  color: '#ffffff',
};

const titleAccentStyle: React.CSSProperties = {
  background: 'linear-gradient(to right, #06b6d4, #8b5cf6)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
};

const subtitleStyle: React.CSSProperties = {
  margin: '6px 0 0',
  fontSize: '12px',
  color: '#8b949e',
  fontWeight: 400,
};

const firebaseBadgeContainer: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  alignSelf: 'center',
  padding: '4px 12px',
  background: 'rgba(74, 222, 128, 0.06)',
  border: '1px solid rgba(74, 222, 128, 0.15)',
  borderRadius: '9999px',
  marginBottom: '20px',
};

const mockBadgeContainer: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  alignSelf: 'center',
  padding: '4px 12px',
  background: 'rgba(251, 146, 60, 0.06)',
  border: '1px solid rgba(251, 146, 60, 0.15)',
  borderRadius: '9999px',
  marginBottom: '20px',
};

const mockInfoBoxStyle: React.CSSProperties = {
  background: 'rgba(31, 41, 55, 0.35)',
  border: '1px solid rgba(255, 255, 255, 0.02)',
  borderRadius: '8px',
  padding: '10px 12px',
  marginBottom: '20px',
};

const errorContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '8px',
  background: 'rgba(239, 68, 68, 0.08)',
  border: '1px solid rgba(239, 68, 68, 0.2)',
  borderRadius: '8px',
  padding: '10px 12px',
  marginBottom: '20px',
};

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const checkboxLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  cursor: 'pointer',
  paddingLeft: '2px',
};

const checkboxStyle: React.CSSProperties = {
  width: '14px',
  height: '14px',
  accentColor: '#06b6d4',
  cursor: 'pointer',
};

const loginBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '44px',
  background: '#111827',
  border: '1px solid #1f2937',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '14px',
  cursor: 'pointer',
  transition: 'all 120ms ease',
  outline: 'none',
};

const loginBtnLoadingStyle: React.CSSProperties = {
  ...loginBtnStyle,
  background: 'rgba(17, 24, 39, 0.5)',
  borderColor: 'rgba(255, 255, 255, 0.02)',
  color: '#8b949e',
  cursor: 'not-allowed',
};

const btnSpinnerStyle: React.CSSProperties = {
  width: '14px',
  height: '14px',
  border: '2px solid rgba(255, 255, 255, 0.1)',
  borderTopColor: '#06b6d4',
  borderRadius: '50%',
  animation: 'rotateSpinner 0.75s linear infinite',
  marginRight: '10px',
};

export default Login;
