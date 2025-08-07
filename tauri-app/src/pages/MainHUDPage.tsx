import React, { useState, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

const MainHUDPage: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState('');
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

  // Gestion de l'ouverture/fermeture des paramètres
  const handleToggleSettings = async () => {
    try {
      // Ouvrir la fenêtre principale Numa
      await invoke('show_main_window');
      console.log('Fenêtre principale ouverte');
    } catch (error) {
      console.error('Erreur ouverture fenêtre:', error);
    }
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

  return (
                    <div style={{
                  width: '100vw',
                  height: '100vh',
                  backgroundColor: 'rgba(255, 0, 0, 0.8)', // 🔴 ROUGE OPAQUE POUR DEBUG
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px',
                  overflow: 'hidden'
                }}>
      <div style={{
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
        transition: 'all 0.3s ease'
      }}>
        
        {/* Bouton Capture (Listen) */}
        <button
          onClick={handleCapture}
          disabled={isListening}
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

        {/* Bouton Hide */}
        <button
          onClick={handleToggleSettings}
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
          <span>Hide</span>
          <div style={{
            width: '12px',
            height: '12px',
            border: '2px solid white',
            borderTop: 'none',
            borderLeft: 'none',
            transform: 'rotate(-135deg)',
            transition: 'transform 0.3s ease'
          }} />
        </button>

        {/* Bouton fermer */}
        <button
          onClick={handleClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '50%',
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontSize: '16px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.8)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default MainHUDPage; 