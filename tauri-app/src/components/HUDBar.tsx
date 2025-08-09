import React, { useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import CaptureButton from './HUDBar/CaptureButton';
import InputField from './HUDBar/InputField';
import TogglePanelButton from './HUDBar/TogglePanelButton';
import CloseButton from './HUDBar/CloseButton';
import GlassContainer from './ui/GlassContainer';
import GlassButton from './ui/GlassButton';
import '../styles/glass.css';

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

  // 🔧 Fonctions de debug temporaires
  const handleDebugPositions = async () => {
    try {
      const result = (await invoke('debug_get_positions')) as string;
      console.log('🔍 Debug positions:', result);
      alert(result);
    } catch (error) {
      console.error('Erreur debug positions:', error);
    }
  };

  const handleForceReposition = async () => {
    try {
      const result = (await invoke('debug_force_reposition')) as string;
      console.log('🔧 Force reposition:', result);
      alert(result);
    } catch (error) {
      console.error('Erreur force reposition:', error);
    }
  };

  // 💬 Fonction pour afficher la ResponsePage (fenêtre de chat)
  const handleAskClick = async () => {
    try {
      await invoke('response_show');
      console.log('ResponsePage affichée');
    } catch (error) {
      console.error('Erreur lors de l\'affichage de la ResponsePage:', error);
    }
  };

  return (
    <GlassContainer
      // variant="pill"
      className="min-w-[400px] max-w-[1000px] cursor-grab select-none z-[1000]"
      style={{
        pointerEvents: 'auto',
      }}
      onMouseDown={handleMouseDown}
    >
      <CaptureButton isListening={isListening} onCapture={onCapture} />

      <GlassButton>
        <span className="text-sm">Context</span>
      </GlassButton>

      <GlassButton onClick={handleAskClick}>
        <span className="text-sm">Ask</span>
      </GlassButton>
      {/*
      <InputField
        ref={inputRef}
        value={inputText}
        onChange={onInputChange}
        onChatSubmit={async (message: string) => {
          try {
            // Use the new start_chat command
            await invoke('start_chat', { message });
            console.log('Chat started:', message);
          } catch (error) {
            console.error('Error starting chat:', error);
          }
        }}
      /> */}

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

      {/* 🔧 Boutons de debug temporaires */}
      <GlassButton
        onClick={handleDebugPositions}
        title="Debug: Afficher positions actuelles"
      >
        📍
      </GlassButton>

      <GlassButton
        onClick={handleForceReposition}
        title="Debug: Forcer le repositionnement du panel"
      >
        🔧
      </GlassButton>
    </GlassContainer>
  );
};

export default HUDBar;
