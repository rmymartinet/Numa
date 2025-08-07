import React, { useState, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';


import './MainHUDPage.css';

const MainHUDPage: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Gestion de la capture d'écran
  const handleCapture = async () => {
    setIsListening(true);
    try {
      await invoke('capture_screen');
      console.log('Capture d\'écran déclenchée');
    } catch (error) {
      console.error('Erreur capture:', error);
    } finally {
      setIsListening(false);
    }
  };

  // Gestion de l'ouverture/fermeture du panneau
  const handleTogglePanel = () => {
    setIsPanelExpanded(!isPanelExpanded);
  };

  // Gestion de la fermeture de l'app
  const handleClose = async () => {
    try {
      await invoke('close_all_windows');
      console.log('Application fermée');
    } catch (error) {
      console.error('Erreur fermeture:', error);
    }
  };

  // Focus automatique sur l'input
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Gestion du drag and drop natif
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Clic gauche seulement
      invoke('start_window_dragging').catch(console.error);
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: 'transparent',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '10px',
      overflow: 'hidden',
      pointerEvents: 'none'
    }}>
      {/* HUD Principal - Toujours visible */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 20px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
          userSelect: 'none'
        }}
        onMouseDown={handleMouseDown}
      >
        
        {/* Bouton Capture (Listen) */}
        <button
          onClick={handleCapture}
          disabled={isListening}
          className="hud-no-drag"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: isListening ? 'rgba(59, 130, 246, 0.8)' : 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '25px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            minWidth: '80px',
            justifyContent: 'center'
          }}
        >
          {/* Icône audio */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '2px',
            height: '16px'
          }}>
            <div style={{
              width: '3px',
              backgroundColor: 'white',
              borderRadius: '1px',
              height: isListening ? '16px' : '8px',
              transition: 'height 0.3s ease'
            }} />
            <div style={{
              width: '3px',
              backgroundColor: 'white',
              borderRadius: '1px',
              height: isListening ? '12px' : '12px',
              transition: 'height 0.3s ease'
            }} />
            <div style={{
              width: '3px',
              backgroundColor: 'white',
              borderRadius: '1px',
              height: isListening ? '8px' : '16px',
              transition: 'height 0.3s ease'
            }} />
          </div>
          <span>{isListening ? 'Capturing...' : 'Capture'}</span>
        </button>

        {/* Champ de saisie (I Ask) */}
        <div style={{
          flex: 1,
          position: 'relative'
        }}>
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="I Ask..."
            style={{
              width: '100%',
              padding: '8px 16px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '25px',
              color: 'white',
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && inputText.trim()) {
                console.log('Prompt envoyé:', inputText);
                setInputText('');
              }
            }}
          />
          {inputText && (
            <button
              onClick={() => setInputText('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '4px'
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* Séparateur */}
        <div style={{
          width: '1px',
          height: '24px',
          backgroundColor: 'rgba(255, 255, 255, 0.2)'
        }} />

        {/* Bouton Toggle Panel */}
        <button
          onClick={handleTogglePanel}
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
            transition: 'all 0.2s ease'
          }}
        >
          <span>{isPanelExpanded ? 'Hide' : 'Show'}</span>
          <div style={{
            width: '12px',
            height: '12px',
            border: '2px solid white',
            borderTop: 'none',
            borderLeft: 'none',
            transform: isPanelExpanded ? 'rotate(45deg)' : 'rotate(-135deg)',
            transition: 'transform 0.3s ease'
          }} />
        </button>

        {/* Bouton fermer - Croix rouge */}
        <button
          onClick={handleClose}
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
      </div>

      {/* Panneau déroulant - Contenu principal */}
      <div style={{
        width: '100%',
        maxWidth: '1200px',
        height: isPanelExpanded ? '600px' : '0px',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        marginTop: '20px',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        pointerEvents: isPanelExpanded ? 'auto' : 'none',
        opacity: isPanelExpanded ? 1 : 0
      }}>
        {isPanelExpanded && (
          <div style={{
            width: '100%',
            height: '100%',
            padding: '20px',
            color: 'white',
            overflow: 'auto'
          }}>
            {/* Contenu de la page principale */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              <h1 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                margin: '0 0 20px 0'
              }}>
                Numa - AI Assistant
              </h1>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px'
              }}>
                {/* Section Capture */}
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '20px'
                }}>
                  <h3 style={{ margin: '0 0 15px 0', fontSize: '18px' }}>Capture d'écran</h3>
                  <p style={{ margin: '0', opacity: 0.8 }}>
                    Utilisez le bouton "Capture" dans la barre HUD pour capturer votre écran et analyser le contenu.
                  </p>
                </div>

                {/* Section Analyse */}
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '20px'
                }}>
                  <h3 style={{ margin: '0 0 15px 0', fontSize: '18px' }}>Analyse IA</h3>
                  <p style={{ margin: '0', opacity: 0.8 }}>
                    Posez des questions sur le contenu capturé et obtenez des réponses intelligentes.
                  </p>
                </div>

                {/* Section Historique */}
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '20px'
                }}>
                  <h3 style={{ margin: '0 0 15px 0', fontSize: '18px' }}>Historique</h3>
                  <p style={{ margin: '0', opacity: 0.8 }}>
                    Consultez vos captures précédentes et analyses.
                  </p>
                </div>
              </div>

              {/* Zone de test */}
              <div style={{
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '18px' }}>Zone de test</h3>
                <p style={{ margin: '0', opacity: 0.8 }}>
                  Cette zone peut contenir des fonctionnalités avancées, des paramètres, ou d'autres outils.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainHUDPage; 