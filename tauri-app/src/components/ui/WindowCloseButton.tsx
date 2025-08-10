import React from 'react';
import { X } from 'lucide-react';

interface WindowCloseButtonProps {
  onClick: () => void;
  size?: number;
}

const WindowCloseButton: React.FC<WindowCloseButtonProps> = ({ 
  onClick, 
  size = 14 
}) => {
  return (
    <button
      onClick={onClick}
      style={{
        // @ts-ignore
        WebkitAppRegion: 'no-drag',
        background: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '4px',
        color: 'rgba(255, 255, 255, 0.8)',
        cursor: 'pointer',
        padding: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        minWidth: '24px',
        minHeight: '24px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.8)';
        e.currentTarget.style.color = 'white';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
      }}
      title="Fermer la fenêtre"
    >
      <X size={size} />
    </button>
  );
};

export default WindowCloseButton;