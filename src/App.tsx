import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import Home from './pages/Home';
import ChatInterface from './pages/ChatInterface';
import Build from './pages/Build';
import Ide from './pages/Ide';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* IDE is the primary view — no Layout wrapper (full screen) */}
        <Route path="/ide"  element={<Ide />} />
        <Route path="/demo" element={<Ide />} />

        {/* Other pages use the layout wrapper */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/chat" element={<Layout><ChatInterface /></Layout>} />
        <Route path="/build" element={<Layout><Build /></Layout>} />
      </Routes>
    </Router>
  );
};

export default App;

