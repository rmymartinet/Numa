import React from 'react';
import ReactDOM from 'react-dom/client';
import AppWithRouter from './AppWithRouter';
import './styles/accessibility-fixed.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppWithRouter />
  </React.StrictMode>
);
