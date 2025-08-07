import React, { useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import CaptureButton from './HUDBar/CaptureButton';
import InputField from './HUDBar/InputField';
import TogglePanelButton from './HUDBar/TogglePanelButton';
import CloseButton from './HUDBar/CloseButton';

interface HUDBarProps {
  isListening: boolean;
  inputText: string;
  isPanelExpanded: boolean;
  onCapture: () => void;
  onInputChange: (text: string) => void;
  onTogglePanel: () => void;
  onClose: () => void;
}

const HUDBar: React.FC<HUDBarProps> = ({
  isListening,
  inputText,
  isPanelExpanded,
  onCapture,
  onInputChange,
  onTogglePanel,
  onClose,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus automatique sur l'input
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Gestion du drag and drop natif
  const handleMouseDown = (e: React.MouseEvent) => {
    // Ne pas déclencher le drag si on clique sur un bouton
    if (e.target instanceof HTMLButtonElement) {
      return;
    }

    if (e.button === 0) {
      // Clic gauche seulement
      invoke('start_window_dragging').catch(console.error);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 20px',
        backgroundColor: 'rgba(0, 0, 0, 0.9)', // Couleur normale
        backdropFilter: 'blur(20px)',
        borderRadius: '50px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        minWidth: '400px',
        maxWidth: '600px',
        transition: 'all 0.3s ease',
        pointerEvents: 'auto',
        cursor: 'grab',
        zIndex: 1000,
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
    >
      <CaptureButton isListening={isListening} onCapture={onCapture} />

      <InputField ref={inputRef} value={inputText} onChange={onInputChange} />

      <div
        style={{
          width: '1px',
          height: '24px',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
        }}
      />

      <TogglePanelButton
        isExpanded={isPanelExpanded}
        onToggle={onTogglePanel}
      />

      <CloseButton onClose={onClose} />
    </div>
  );
};

export default HUDBar;
