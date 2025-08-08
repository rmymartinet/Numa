import React from 'react';
import { AudioLines } from 'lucide-react';

interface CaptureButtonProps {
  isListening: boolean;
  onCapture: () => void;
}

const CaptureButton: React.FC<CaptureButtonProps> = ({
  isListening,
  onCapture,
}) => {
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
        backgroundColor: isListening
          ? 'rgba(59, 130, 246, 0.8)'
          : 'rgba(255, 255, 255, 0.1)',
        border: 'none',
        borderRadius: '25px',
        color: 'white',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        minWidth: '80px',
        justifyContent: 'center',
      }}
    >
      <AudioLines size={16} />
      <span>{isListening ? 'Listening...' : 'Listen'}</span>
    </button>
  );
};

export default CaptureButton;
