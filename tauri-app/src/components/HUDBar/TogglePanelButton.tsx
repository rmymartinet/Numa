import React from 'react';
import { SlidersHorizontal } from 'lucide-react';

interface TogglePanelButtonProps {
  isExpanded: boolean;
  onToggle: () => void;
}

const TogglePanelButton: React.FC<TogglePanelButtonProps> = ({ onToggle }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Empêcher la propagation vers le parent
    onToggle();
  };

  return (
    <button onClick={handleClick} className="glass__btn">
      <SlidersHorizontal size={14} />
    </button>
  );
};

export default TogglePanelButton;
