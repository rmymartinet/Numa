import React from 'react';

interface CaptureButtonProps {
  isListening: boolean;
  onCapture: () => void;
}

const CaptureButton: React.FC<CaptureButtonProps> = ({ isListening, onCapture }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('CaptureButton clicked!');
    onCapture();
  };

  return (
    <button
      onClick={handleClick}
      disabled={isListening}
      className="hud-no-drag"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        backgroundColor: isListening ? 'rgba(59, 130, 246, 0.8)' : 'rgba(255, 255, 255, 0.1)',
        border: 'none',
        borderRadius: '25px',
        color: 'white',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        minWidth: '80px',
        justifyContent: 'center'
      }}
    >
      {/* Icône audio */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '2px',
        height: '16px'
      }}>
        <div style={{
          width: '3px',
          backgroundColor: 'white',
          borderRadius: '1px',
          height: isListening ? '16px' : '8px',
          transition: 'height 0.3s ease'
        }} />
        <div style={{
          width: '3px',
          backgroundColor: 'white',
          borderRadius: '1px',
          height: isListening ? '12px' : '12px',
          transition: 'height 0.3s ease'
        }} />
        <div style={{
          width: '3px',
          backgroundColor: 'white',
          borderRadius: '1px',
          height: isListening ? '8px' : '16px',
          transition: 'height 0.3s ease'
        }} />
      </div>
      <span>{isListening ? 'Capturing...' : 'Capture'}</span>
    </button>
  );
};

export default CaptureButton;
