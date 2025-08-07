import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App';
import OverlayPage from './pages/OverlayPage';
import MainHUDPage from './pages/MainHUDPage';

const AppWithRouter: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/overlay" element={<OverlayPage />} />
        <Route path="/hud" element={<MainHUDPage />} />
      </Routes>
    </Router>
  );
};

export default AppWithRouter; 