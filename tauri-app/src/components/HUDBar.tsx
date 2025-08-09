import React, { useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import CaptureButton from './HUDBar/CaptureButton';
import InputField from './HUDBar/InputField';
import TogglePanelButton from './HUDBar/TogglePanelButton';
import CloseButton from './HUDBar/CloseButton';
import GlassContainer from './ui/GlassContainer';
import GlassButton from './ui/GlassButton';
import '../styles/glass.css';
import { SlidersHorizontal } from 'lucide-react';
import VibrantGlass from './VibrantGlass';

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

  // 💬 Fonction pour afficher l'InputPage (ferme le panel si ouvert)
  const handleAskClick = async () => {
    try {
      // 🔄 Fermer le panel s'il est ouvert pour éviter la superposition
      if (isPanelExpanded) {
        await invoke('panel_hide');
        onTogglePanel(); // Mettre à jour l'état local
      }

      // Afficher l'InputPage pour poser la question
      await invoke('input_show');
      console.log('InputPage affichée (panel fermé si nécessaire)');
    } catch (error) {
      console.error("Erreur lors de l'affichage de l'InputPage:", error);
    }
  };

  // 🧠 Fonction pour afficher la ContextPage
  const handleContextClick = async () => {
    try {
      // 🔄 Fermer le panel s'il est ouvert pour éviter la superposition
      if (isPanelExpanded) {
        await invoke('panel_hide');
        onTogglePanel(); // Mettre à jour l'état local
      }

      // Afficher la ContextPage pour la gestion du contexte
      await invoke('context_show');
      console.log('ContextPage affichée (panel fermé si nécessaire)');
    } catch (error) {
      console.error("Erreur lors de l'affichage de la ContextPage:", error);
    }
  };

  return (
    <>
      <GlassContainer
        onMouseDown={handleMouseDown}
        // variant="pill"
        className="min-w-[400px] max-w-[1000px] cursor-grab select-none z-[1000]"
        style={{
          pointerEvents: 'auto',
        }}
        // onMouseDown={handleMouseDown}
      >
        <CaptureButton isListening={isListening} onCapture={onCapture} />

        <GlassButton onClick={handleContextClick}>
          <span className="text-sm">Context</span>
        </GlassButton>

        <GlassButton onClick={handleAskClick}>
          <span className="text-sm">Ask</span>
        </GlassButton>

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
      </GlassContainer>

      {/* <GlassContainer>
        <GlassButton
          onClick={handleForceReposition}
          title="Debug: Forcer le repositionnement du panel"
        >
          <SlidersHorizontal />
        </GlassButton>

        <CloseButton onClose={onClose} />
      </GlassContainer> */}
    </>
  );
};

export default HUDBar;
