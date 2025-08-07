import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainHUDPage from './pages/MainHUDPage';

const AppWithRouter: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainHUDPage />} />
        <Route path="/hud" element={<MainHUDPage />} />
      </Routes>
    </Router>
  );
};

export default AppWithRouter; 