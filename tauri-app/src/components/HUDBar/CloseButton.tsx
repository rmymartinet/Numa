import React from 'react';

interface CloseButtonProps {
  onClose: () => void;
}

const CloseButton: React.FC<CloseButtonProps> = ({ onClose }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('CloseButton clicked!');
    onClose();
  };

  return (
    <button
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        backgroundColor: 'rgba(239, 68, 68, 0.8)', // 🔴 ROUGE
        border: 'none',
        borderRadius: '50%',
        color: 'white',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontSize: '18px',
        fontWeight: 'bold'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 1)'; // Rouge plus foncé
        e.currentTarget.style.transform = 'scale(1.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.8)';
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      ✕
    </button>
  );
};

export default CloseButton;
