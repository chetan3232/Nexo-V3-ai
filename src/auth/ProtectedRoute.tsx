import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import logoImage from '@/logo/image.png';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        background: '#0d1117',
        color: '#c9d1d9',
        fontFamily: "'Inter', sans-serif",
      }}>
        {/* Pulsing NEXO loader */}
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '80px',
          height: '80px',
        }}>
          <div className="nexo-spinner" style={{
            position: 'absolute',
            width: '60px',
            height: '60px',
            border: '2.5px solid rgba(6, 182, 212, 0.1)',
            borderTopColor: '#06b6d4',
            borderRightColor: '#06b6d4',
            borderRadius: '50%',
            animation: 'spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite',
          }} />
          <img src={logoImage} alt="Nexo Logo" style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            objectFit: 'cover',
            animation: 'pulse 1.6s ease-in-out infinite',
          }} />
        </div>
        
        {/* Loading text */}
        <div style={{
          marginTop: '18px',
          fontSize: '12px',
          color: '#8b949e',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontWeight: 500,
        }}>
          Verifying Session...
        </div>

        {/* Embedded animations */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.5; transform: scale(0.92); }
            50% { opacity: 1; transform: scale(1.08); }
          }
        `}} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
