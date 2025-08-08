import React from 'react';
import ReactDOM from 'react-dom/client';
import AppWithRouter from './AppWithRouter';
import { errorReporter, setupGlobalErrorHandling } from './utils/errorReporting';
import { logger } from './utils/logger';
import { metricsTracker } from './utils/metrics';
import './styles/accessibility.css';

// Initialiser l'observabilité
logger.info('Application démarrée', { 
  version: process.env.VITE_APP_VERSION || 'dev',
  environment: process.env.NODE_ENV 
});

// Initialiser le reporting d'erreurs
errorReporter.initialize();
setupGlobalErrorHandling();

// Initialiser les métriques
metricsTracker.setSamplingRate(0.1); // 10% des sessions

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppWithRouter />
  </React.StrictMode>
);
