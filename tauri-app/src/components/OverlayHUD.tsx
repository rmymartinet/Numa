import React, { useState, useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';

interface OverlayHUDProps {
  // Props pour personnaliser l'affichage
  opacity?: number;
  fontSize?: number;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
}

const OverlayHUD: React.FC<OverlayHUDProps> = ({
  opacity = 0.8,
  fontSize = 14,
  position = 'top-right'
}) => {
  const [gptText, setGptText] = useState<string>('');
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const ref = useRef<HTMLDivElement>(null);

  // Écouter les événements de l'application principale
  useEffect(() => {
    const setupEventListeners = async () => {
      try {
        // Écouter les réponses GPT
        const unlistenGPT = await listen('gpt-response', (event) => {
          console.log('Overlay: Réponse GPT reçue', event.payload);
          setGptText(event.payload as string);
          setIsVisible(true);
          setIsLoading(false);
        });

        // Écouter les demandes GPT (pour afficher le loading)
        const unlistenGPTRequest = await listen('gpt-request', () => {
          console.log('Overlay: Demande GPT en cours');
          setIsLoading(true);
          setIsVisible(true);
        });

        // Écouter les commandes de visibilité
        const unlistenVisibility = await listen('overlay-toggle', (event) => {
          const { visible } = event.payload as { visible: boolean };
          setIsVisible(visible);
        });

        // Écouter les commandes de position
        const unlistenPosition = await listen('overlay-position', (event) => {
          const { x, y } = event.payload as { x: number; y: number };
          // TODO: Implémenter le changement de position
          console.log('Overlay: Nouvelle position', x, y);
        });

        return () => {
          unlistenGPT();
          unlistenGPTRequest();
          unlistenVisibility();
          unlistenPosition();
        };
      } catch (error) {
        console.error('Erreur lors de la configuration des événements overlay:', error);
      }
    };

    setupEventListeners();
  }, []);



  // Styles de position
  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      zIndex: 9999,
      padding: '12px',
      borderRadius: '8px',
      backdropFilter: 'blur(8px)',
      border: '3px solid red', // Bordure rouge temporaire pour test
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      maxWidth: '350px',
      wordWrap: 'break-word' as const,
      lineHeight: '1.4',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: `${fontSize}px`,
      opacity: opacity,
      transition: 'all 0.3s ease',
      pointerEvents: 'none' as const, // Permet de cliquer à travers
    };

    switch (position) {
      case 'top-left':
        return { ...baseStyles, top: '20px', left: '20px' };
      case 'top-right':
        return { ...baseStyles, top: '20px', right: '20px' };
      case 'bottom-left':
        return { ...baseStyles, bottom: '20px', left: '20px' };
      case 'bottom-right':
        return { ...baseStyles, bottom: '20px', right: '20px' };
      case 'center':
        return { 
          ...baseStyles, 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          maxWidth: '500px'
        };
      default:
        return { ...baseStyles, top: '20px', right: '20px' };
    }
  };

  // Styles conditionnels
  const containerStyles = {
    ...getPositionStyles(),
    backgroundColor: isLoading 
      ? 'rgba(59, 130, 246, 0.9)' // Bleu pour le loading
      : 'rgba(0, 0, 0, 0.8)', // Noir semi-transparent
    color: isLoading ? 'white' : '#e5e7eb',
    display: isVisible ? 'block' : 'none',
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div ref={ref} style={containerStyles}>
      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '16px',
            height: '16px',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderTop: '2px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <span>Analyse en cours...</span>
        </div>
      ) : (
        <div>
          <div style={{ 
            fontSize: '12px', 
            opacity: 0.7, 
            marginBottom: '4px',
            fontWeight: 'bold'
          }}>
            🤖 Numa IA
          </div>
          <div style={{ 
            fontSize: `${fontSize}px`,
            lineHeight: '1.5'
          }}>
            {gptText || 'En attente de réponse...'}
          </div>
        </div>
      )}
      
      {/* Styles CSS pour l'animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default OverlayHUD; 