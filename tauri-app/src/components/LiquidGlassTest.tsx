import React from 'react';
import GlassContainer from './ui/GlassContainer';
import GlassButton from './ui/GlassButton';

const LiquidGlassTest: React.FC = () => {
  return (
    <div
      style={{
        padding: '50px',
        background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        alignItems: 'center',
      }}
    >
      <h1 style={{ color: 'white', marginBottom: '30px' }}>
        Test Liquid Glass avec SVG Filter
      </h1>

      {/* Test avec le nouveau GlassContainer */}
      <GlassContainer variant="pill" className="glass--grain">
        <GlassButton onClick={() => console.log('Test 1')}>
          🎤 Test 1
        </GlassButton>
        <GlassButton onClick={() => console.log('Test 2')}>
          🖥️ Test 2
        </GlassButton>
        <GlassButton onClick={() => console.log('Test 3')}>
          ⌨️ Test 3
        </GlassButton>
      </GlassContainer>

      {/* Test avec l'ancien style pour comparaison */}
      <div className="glass" style={{ marginTop: '20px' }}>
        <div className="glass__content">
          <button className="glass__btn">Ancien Style</button>
          <button className="glass__btn">Sans SVG</button>
        </div>
      </div>

      <div
        style={{
          marginTop: '30px',
          color: 'white',
          textAlign: 'center',
          fontSize: '14px',
        }}
      >
        <p>L'effet liquid devrait être visible sur le premier conteneur</p>
        <p>Le filtre SVG crée une distorsion subtile du backdrop-filter</p>
      </div>
    </div>
  );
};

export default LiquidGlassTest;
