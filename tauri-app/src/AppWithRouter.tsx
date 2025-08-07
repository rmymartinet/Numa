import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import MainHUDPage from './pages/MainHUDPage';
import BlankPage from './pages/BlankPage';
import PanelPage from './pages/PanelPage';

const AppWithRouter: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* <Route path="/" element={<MainHUDPage />} /> */}
        <Route path="/hud" element={<MainHUDPage />} />
        {/* <Route path="/blank" element={<BlankPage />} /> */}
        <Route path="/panel" element={<PanelPage />} />
      </Routes>
    </Router>
  );
};

export default AppWithRouter; 