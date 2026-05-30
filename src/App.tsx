import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import Home from './pages/Home';
import ChatInterface from './pages/ChatInterface';
import Build from './pages/Build';
import Ide from './pages/Ide';
import Login from './pages/Login';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { useAuthStore } from './auth/authStore';

const App: React.FC = () => {
  // Restore authentication session on app initialization
  useEffect(() => {
    useAuthStore.getState().restoreSession();
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public auth portal */}
        <Route path="/login" element={<Login />} />

        {/* IDE is the primary view — no Layout wrapper (full screen) */}
        <Route path="/ide"  element={<ProtectedRoute><Ide /></ProtectedRoute>} />
        <Route path="/demo" element={<ProtectedRoute><Ide /></ProtectedRoute>} />

        {/* Other pages use the layout wrapper */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/chat" element={<ProtectedRoute><Layout><ChatInterface /></Layout></ProtectedRoute>} />
        <Route path="/build" element={<Layout><Build /></Layout>} />
        
        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;

