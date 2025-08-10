import React, { useRef, useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import CaptureButton from './HUDBar/CaptureButton';
import TogglePanelButton from './HUDBar/TogglePanelButton';
import CloseButton from './HUDBar/CloseButton';
import LiquidGlassLens from './ui/LiquidGlassLens';
import GlassButton from './ui/GlassButton';
import '../styles/glass.css';
import { SlidersHorizontal } from 'lucide-react';

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
  inputText: _inputText,
  isPanelExpanded,
  onCapture,
  onInputChange: _onInputChange,
  onTogglePanel,
  onClose,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [isInputOpen, setIsInputOpen] = useState(false);

  // Focus automatique sur l'input
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Écouter les événements de fermeture des fenêtres
  useEffect(() => {
    const setupListeners = async () => {
      // Écouter la fermeture de InputPage
      await listen('input:hidden', () => {
        setIsInputOpen(false);
      });

      // Écouter la fermeture de ContextPage
      await listen('context:hidden', () => {
        setIsContextOpen(false);
      });
    };

    setupListeners();
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

  // 💬 Fonction pour toggle l'InputPage
  const handleAskClick = async () => {
    try {
      if (isInputOpen) {
        // Fermer l'InputPage
        await invoke('input_hide');
        setIsInputOpen(false);
        console.error('InputPage fermée');
      } else {
        // 🔄 Fermer le panel s'il est ouvert pour éviter la superposition
        if (isPanelExpanded) {
          await invoke('panel_hide');
          onTogglePanel(); // Mettre à jour l'état local
        }

        // Ouvrir l'InputPage
        await invoke('input_show');
        setIsInputOpen(true);
        console.error('InputPage affichée');
      }
    } catch (error) {
      console.error("Erreur lors du toggle de l'InputPage:", error);
    }
  };

  // 🧠 Fonction pour toggle la ContextPage
  const handleContextClick = async () => {
    try {
      if (isContextOpen) {
        // Fermer la ContextPage
        await invoke('context_hide');
        setIsContextOpen(false);
        console.error('ContextPage fermée');
      } else {
        // 🔄 Fermer le panel s'il est ouvert pour éviter la superposition
        if (isPanelExpanded) {
          await invoke('panel_hide');
          onTogglePanel(); // Mettre à jour l'état local
        }

        // Ouvrir la ContextPage
        await invoke('context_show');
        setIsContextOpen(true);
        console.error('ContextPage affichée');
      }
    } catch (error) {
      console.error('Erreur lors du toggle de la ContextPage:', error);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '10px' }}>
      <LiquidGlassLens
        width={300}
        height={50}
        radius={25}
        onMouseDown={handleMouseDown}
        className="cursor-grab select-none z-[1000]"
        style={{
          pointerEvents: 'auto',
        }}
      >
        <CaptureButton isListening={isListening} onCapture={onCapture} />

        <GlassButton
          onClick={handleContextClick}
          style={{
            backgroundColor: isContextOpen
              ? 'rgba(59, 130, 246, 0.3)'
              : undefined,
            border: isContextOpen
              ? '1px solid rgba(59, 130, 246, 0.5)'
              : undefined,
          }}
        >
          <span className="text-sm">Context</span>
        </GlassButton>

        <GlassButton
          onClick={handleAskClick}
          style={{
            backgroundColor: isInputOpen
              ? 'rgba(59, 130, 246, 0.3)'
              : undefined,
            border: isInputOpen
              ? '1px solid rgba(59, 130, 246, 0.5)'
              : undefined,
          }}
        >
          <span className="text-sm">Ask</span>
        </GlassButton>

        <div
          style={{
            width: '1px',
            height: '24px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
          }}
        />
      </LiquidGlassLens>

      <LiquidGlassLens
        width={120}
        height={50}
        radius={25}
        className="cursor-grab select-none z-[1000]"
        style={{
          pointerEvents: 'auto',
        }}
        onMouseDown={handleMouseDown}
      >
        <GlassButton title="Debug: Forcer le repositionnement du panel">
          <TogglePanelButton
            isExpanded={isPanelExpanded}
            onToggle={onTogglePanel}
          />
        </GlassButton>

        <CloseButton onClose={onClose} />
      </LiquidGlassLens>
    </div>
  );
};

export default HUDBar;
