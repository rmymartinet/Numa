import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
      className="glass__btn"
      style={{
        display: 'flex',
      }}
    >
      {isExpanded ? <ChevronUp /> : <ChevronDown />}
    </button>
  );
};

export default TogglePanelButton;
