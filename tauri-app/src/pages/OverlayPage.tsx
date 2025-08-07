import React from 'react';
import OverlayHUD from '../components/OverlayHUD';

const OverlayPage: React.FC = () => {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: 'transparent',
      overflow: 'hidden',
      position: 'relative',
      border: '2px solid red' // Bordure rouge temporaire pour test
    }}>
      {/* Le composant OverlayHUD sera affiché ici */}
      <OverlayHUD 
        opacity={0.85}
        fontSize={16}
        position="top-right"
      />
      
      {/* Debug info (optionnel, à retirer en production) */}
      {import.meta.env.DEV && (
        <div style={{
          position: 'fixed',
          bottom: '10px',
          left: '10px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          fontFamily: 'monospace',
          zIndex: 10000
        }}>
          Overlay Mode - Dev
        </div>
      )}
    </div>
  );
};

export default OverlayPage; 