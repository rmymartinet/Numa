import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import MainHUDPage from './pages/MainHUDPage';
import PanelPage from './pages/PanelPage';
import { useDelayedObservability } from './hooks/useDelayedObservability';

const AppWithRouter: React.FC = () => {
  // Initialiser l'observabilité de manière différée
  useDelayedObservability();

  return (
    <Router>
      <Routes>
        <Route path="/hud" element={<MainHUDPage />} />
        <Route path="/panel" element={<PanelPage />} />
      </Routes>
    </Router>
  );
};

export default AppWithRouter;
