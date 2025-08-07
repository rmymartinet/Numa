import React from 'react';

interface PanelHeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

const PanelHeader: React.FC<PanelHeaderProps> = ({ isDark, onToggleTheme }) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <h1
        style={{
          fontSize: '24px',
          fontWeight: 'bold',
          margin: 0,
        }}
      >
        Numa - AI Assistant
      </h1>
      <button
        onClick={onToggleTheme}
        style={{
          padding: '8px',
          borderRadius: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: 'white',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        {isDark ? '☀️' : '🌙'}
      </button>
    </div>
  );
};

export default PanelHeader;
