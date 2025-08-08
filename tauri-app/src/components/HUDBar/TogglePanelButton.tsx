import React from 'react';

interface TogglePanelButtonProps {
  isExpanded: boolean;
  onToggle: () => void;
}

const TogglePanelButton: React.FC<TogglePanelButtonProps> = ({
  isExpanded,
  onToggle,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Empêcher la propagation vers le parent
    console.log('TogglePanelButton clicked!');
    onToggle();
  };

  return (
    <button
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 12px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: 'none',
        borderRadius: '20px',
        color: 'white',
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      <div
        style={{
          width: '12px',
          height: '12px',
          border: '2px solid white',
          borderTop: 'none',
          borderLeft: 'none',
          transform: isExpanded ? 'rotate(45deg)' : 'rotate(-135deg)',
          transition: 'transform 0.3s ease',
        }}
      />
    </button>
  );
};

export default TogglePanelButton;
