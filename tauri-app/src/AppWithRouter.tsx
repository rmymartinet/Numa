import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import MainHUDPage from './pages/MainHUDPage';
import PanelPage from './pages/PanelPage';
import ResponsePage from './pages/ResponsePage';
import InputPage from './pages/InputPage';
import InputPageSimple from './pages/InputPageSimple';
import InputPageFixed from './pages/InputPageFixed';
import { useDelayedObservability } from './hooks/useDelayedObservability';
import { useStealthObservability } from './hooks/useStealthObservability';

const AppWithRouter: React.FC = () => {
  // Initialiser l'observabilité de manière différée
  useDelayedObservability();

  // Gérer l'observabilité en fonction du mode furtif
  useStealthObservability();

  return (
    <Router>
      <Routes>
        <Route path="/hud" element={<MainHUDPage />} />
        <Route path="/panel" element={<PanelPage />} />
        <Route path="/response" element={<ResponsePage />} />
        <Route path="/input" element={<InputPageFixed />} />
      </Routes>
    </Router>
  );
};

export default AppWithRouter;
