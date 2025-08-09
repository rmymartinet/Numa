import React, { useRef, useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import CaptureButton from './HUDBar/CaptureButton';
import TogglePanelButton from './HUDBar/TogglePanelButton';
// GlassContainer removed - using div with glass class instead
import GlassButton from './ui/GlassButton';
import '../styles/glass.css';

interface SplitHUDBarProps {
  isListening: boolean;
  isPanelExpanded: boolean;
  onCapture: () => void;
  onTogglePanel: () => void;
}

const SplitHUDBar: React.FC<SplitHUDBarProps> = ({
  isListening,
  isPanelExpanded,
  onCapture,
  onTogglePanel,
}) => {
  const [leftWidth, setLeftWidth] = useState(50); // Pourcentage pour la partie gauche
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus automatique sur l'input
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Gestion du drag and drop natif pour toute la barre
  const handleMouseDown = (e: React.MouseEvent) => {
    // Ne pas déclencher le drag si on clique sur un bouton ou la zone de resize
    if (
      e.target instanceof HTMLButtonElement ||
      (e.target as HTMLElement).classList.contains('resize-handle')
    ) {
      return;
    }

    if (e.button === 0) {
      // Clic gauche seulement
      invoke('start_window_dragging').catch(console.error);
    }
  };

  // Gestion du redimensionnement
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const startX = e.clientX;
    const startLeftWidth = leftWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const containerWidth = containerRect.width;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const newLeftWidth = Math.max(20, Math.min(80, startLeftWidth + deltaPercent));
      setLeftWidth(newLeftWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // 🎧 Fonction pour Listen (placeholder pour l'instant)
  const handleListenClick = async () => {
    console.log('Listen clicked - fonctionnalité à implémenter');
    // TODO: Implémenter la fonctionnalité Listen
  };

  // 🧠 Fonction pour afficher la ContextPage
  const handleContextClick = async () => {
    try {
      // Fermer le panel s'il est ouvert
      if (isPanelExpanded) {
        await invoke('panel_hide');
        onTogglePanel();
      }
      await invoke('context_show');
      console.log('ContextPage affichée');
    } catch (error) {
      console.error("Erreur lors de l'affichage de la ContextPage:", error);
    }
  };

  // 💬 Fonction pour afficher l'InputPage
  const handleAskClick = async () => {
    try {
      // Fermer le panel s'il est ouvert
      if (isPanelExpanded) {
        await invoke('panel_hide');
        onTogglePanel();
      }
      await invoke('input_show');
      console.log('InputPage affichée');
    } catch (error) {
      console.error("Erreur lors de l'affichage de l'InputPage:", error);
    }
  };

  return (
    <div
      ref={containerRef}
      className="glass flex items-center min-w-[400px] max-w-[1000px] cursor-grab select-none z-[1000]"
      style={{
        pointerEvents: 'auto',
        overflow: 'hidden',
        position: 'relative',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Partie Gauche - Listen + Context + Ask */}
      <div
        style={{
          width: `${leftWidth}%`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '8px 12px',
          minWidth: '200px',
        }}
      >
        <GlassButton onClick={handleListenClick}>
          <span className="text-sm">🎧 Listen</span>
        </GlassButton>

        <GlassButton onClick={handleContextClick}>
          <span className="text-sm">🧠 Context</span>
        </GlassButton>

        <GlassButton onClick={handleAskClick}>
          <span className="text-sm">💬 Ask</span>
        </GlassButton>
      </div>

      {/* Handle de redimensionnement */}
      <div
        className="resize-handle"
        style={{
          width: '8px',
          height: '100%',
          backgroundColor: isResizing 
            ? 'rgba(255, 255, 255, 0.4)' 
            : 'rgba(255, 255, 255, 0.2)',
          cursor: 'col-resize',
          transition: 'background-color 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
        onMouseDown={handleResizeStart}
      >
        {/* Indicateur visuel du handle */}
        <div
          style={{
            width: '2px',
            height: '20px',
            backgroundColor: 'rgba(255, 255, 255, 0.4)',
            borderRadius: '1px',
          }}
        />
      </div>

      {/* Partie Droite - Toggle Panel + Capture */}
      <div
        style={{
          width: `${100 - leftWidth}%`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '8px 12px',
          minWidth: '150px',
        }}
      >
        <TogglePanelButton
          isExpanded={isPanelExpanded}
          onToggle={onTogglePanel}
        />

        <CaptureButton isListening={isListening} onCapture={onCapture} />
      </div>

      {/* Indicateur de redimensionnement actif */}
      {isResizing && (
        <div
          style={{
            position: 'absolute',
            top: '-2px',
            bottom: '-2px',
            left: `${leftWidth}%`,
            transform: 'translateX(-50%)',
            width: '2px',
            backgroundColor: 'rgba(0, 150, 255, 0.8)',
            boxShadow: '0 0 10px rgba(0, 150, 255, 0.5)',
            borderRadius: '1px',
          }}
        />
      )}
    </div>
  );
};

export default SplitHUDBar;