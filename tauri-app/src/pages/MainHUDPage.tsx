import React, { useState, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import Tesseract from 'tesseract.js';
import { OPENAI_API_KEY, OPENAI_CONFIG } from '../config';
import LoadingSpinner from '../components/LoadingSpinner';
import { usePreferences } from '../utils/storage';
import { useLogger, logError, logPerformance } from '../utils/logger';
import { useTheme } from '../hooks/useTheme';
import { useKeyboardNavigation, APP_SHORTCUTS } from '../hooks/useKeyboardNavigation';
import { fetchWithRetry } from '../utils/api';
import { LazyActivityContent, LazyPersonalizeContent, LazySettingsContent } from '../components/LazyComponents';
import Sidebar from '../components/Sidebar';

import './MainHUDPage.css';

// Types
type TabType = 'activity' | 'prompts' | 'settings';

const MainHUDPage: React.FC = () => {
  // États HUD
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // États de l'application principale
  const [shortcutStatus, setShortcutStatus] = useState<string>("");
  const [screenshotPath, setScreenshotPath] = useState<string>("");
  const [extractedText, setExtractedText] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [gptResponse, setGptResponse] = useState<string>("");
  const [isAskingGPT, setIsAskingGPT] = useState<boolean>(false);
  const [showFloatingBubble, setShowFloatingBubble] = useState<boolean>(false);
  const [preferences, updatePreferences] = usePreferences();
  const [activeTab, setActiveTab] = useState<TabType>(preferences.activeTab);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(true);
  const logger = useLogger('MainHUDPage');
  const { toggleTheme, isDark } = useTheme();

    // Gestion des onglets
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    updatePreferences({ activeTab: tab });
  };

  // Gestion de la capture d'écran complète
  const handleCapture = async () => {
    const startTime = performance.now();
    try {
      logger.info('Début de la capture d\'écran');
      setIsProcessing(true);
      setIsListening(true);
    
      const imagePath = await invoke('capture_screen') as string;
      logger.info('Capture d\'écran réussie', { imagePath });
      setScreenshotPath(imagePath);
      await runOCR(imagePath);
      logPerformance('Capture et OCR complète', performance.now() - startTime);
    } catch (error) {
      logError(error as Error, 'handleCapture');
      setScreenshotPath("Erreur lors de la capture");
      setShortcutStatus("Erreur lors de la capture d'écran");
    } finally {
      setIsProcessing(false);
      setIsListening(false);
    }
  };

  // Fonction OCR
  async function runOCR(imagePath: string): Promise<string> {
    try {
      setExtractedText("Traitement en cours...");
      
      const result = await Tesseract.recognize(imagePath, 'fra+eng', {
        logger: m => console.log(m)
      });
      
      const text = result.data.text;
      setExtractedText(text);
      return text;
    } catch (error) {
      console.error('Erreur OCR:', error);
      setExtractedText("Erreur lors de l'extraction du texte");
      return "";
    }
  }

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

  // Configuration des event listeners
  useEffect(() => {
    const setupEventListeners = async () => {
      try {
        // Écouter le raccourci global
        const unlistenGlobalShortcut = await listen("global-shortcut-triggered", (event) => {
          console.log("Raccourci global détecté:", event.payload);
          setShortcutStatus("Raccourci global activé !");
          // Déclencher automatiquement la capture
          handleCapture();
        });

        const unlistenSuccess = await listen("screenshot-captured", (event) => {
          console.log("Capture d'écran réussie:", event.payload);
          setScreenshotPath(event.payload as string);
          setShortcutStatus("Capture d'écran réussie !");
        });

        const unlistenError = await listen("screenshot-error", (event) => {
          console.log("Erreur de capture d'écran:", event.payload);
          setShortcutStatus("Erreur lors de la capture d'écran");
        });

        return () => {
          unlistenGlobalShortcut();
          unlistenSuccess();
          unlistenError();
        };
      } catch (error) {
        console.error("Erreur lors de la configuration des événements:", error);
      }
    };

    setupEventListeners();
  }, []);

  // Navigation par clavier
  const shortcuts = [
    ...APP_SHORTCUTS,
    {
      key: '1',
      action: () => handleTabChange('activity'),
      description: 'Aller à l\'onglet Activity',
    },
    {
      key: '2',
      action: () => handleTabChange('prompts'),
      description: 'Aller à l\'onglet Personalize',
    },
    {
      key: '3',
      action: () => handleTabChange('settings'),
      description: 'Aller à l\'onglet Settings',
    },
    {
      key: 'c',
      ctrlKey: true,
      action: handleCapture,
      description: 'Capturer l\'écran',
    },
    {
      key: 't',
      ctrlKey: true,
      action: toggleTheme,
      description: 'Changer de thème',
    },
    {
      key: 'Escape',
      action: () => setShowFloatingBubble(false),
      description: 'Fermer la bulle',
    },
  ];
  
  useKeyboardNavigation(shortcuts);

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
            display: 'flex',
            color: 'white'
          }}>
            {/* Sidebar */}
            <div style={{
              width: '288px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRight: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Upgrade button */}
              <div style={{ padding: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <button style={{
                  width: '100%',
                  backgroundColor: 'rgba(59, 130, 246, 0.8)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}>
                  Upgrade to Pro
                </button>
              </div>
              
              {/* Navigation tabs */}
              <div style={{ flex: 1, padding: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { id: 'activity', icon: '📈', label: 'My Activity' },
                    { id: 'prompts', icon: '📖', label: 'Personalize' },
                    { id: 'settings', icon: '⚙️', label: 'Settings' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id as TabType)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        backgroundColor: activeTab === tab.id ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                        color: activeTab === tab.id ? 'white' : 'rgba(255, 255, 255, 0.8)'
                      }}
                    >
                      <span style={{ fontSize: '16px' }}>{tab.icon}</span>
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* User profile */}
              <div style={{ padding: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    R
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>Rémy Martinet</div>
                    <div style={{ fontSize: '12px', opacity: 0.7 }}>Free Plan</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Main content */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              {/* Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '24px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h1 style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  margin: 0
                }}>
                  Numa - AI Assistant
                </h1>
                <button
                  onClick={toggleTheme}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isDark ? '☀️' : '🌙'}
                </button>
              </div>
              
              {/* Content area */}
              <div style={{
                flex: 1,
                padding: '24px',
                overflow: 'auto'
              }}>
                {/* Header greeting */}
                <div style={{ marginBottom: '24px' }}>
                  <h2 style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    margin: '0 0 8px 0'
                  }}>
                    Good afternoon, rémy
                  </h2>
                </div>
                
                {/* Content based on active tab */}
                {activeTab === 'activity' && (
                  <div style={{ color: 'white' }}>
                    <LazyActivityContent />
                  </div>
                )}
                
                {activeTab === 'settings' && (
                  <div style={{ color: 'white' }}>
                    <LazySettingsContent />
                  </div>
                )}
                
                {activeTab === 'prompts' && (
                  <div style={{ color: 'white' }}>
                    <LazyPersonalizeContent />
                  </div>
                )}
                
                {/* Original content for other tabs */}
                {activeTab !== 'activity' && activeTab !== 'prompts' && activeTab !== 'settings' && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    overflow: 'hidden'
                  }}>
                    {/* Capture Section */}
                    <div style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '20px'
                    }}>
                      <h2 style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        margin: '0 0 16px 0',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        📸 Capture d'écran
                      </h2>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <p style={{ margin: 0, opacity: 0.8 }}>
                          Cliquez sur le bouton pour capturer l'écran et extraire le texte
                        </p>
                        
                        <button
                          onClick={handleCapture} 
                          disabled={isProcessing}
                          style={{
                            width: '100%',
                            backgroundColor: isProcessing ? 'rgba(156, 163, 175, 0.8)' : 'rgba(59, 130, 246, 0.8)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '12px 24px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                          }}
                        >
                          {isProcessing ? (
                            <>
                              <LoadingSpinner size="sm" color="white" variant="dots" />
                              <span>Traitement...</span>
                            </>
                          ) : (
                            <>
                              <span>📷</span>
                              <span>Capturer l'écran et extraire le texte</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Results Section */}
                    {extractedText && (
                      <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        padding: '20px'
                      }}>
                        <h3 style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          margin: '0 0 16px 0'
                        }}>
                          Texte extrait
                        </h3>
                        <div style={{
                          backgroundColor: 'rgba(0, 0, 0, 0.3)',
                          borderRadius: '8px',
                          padding: '16px',
                          maxHeight: '300px',
                          overflow: 'auto',
                          fontSize: '14px',
                          lineHeight: '1.5'
                        }}>
                          {extractedText}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Status */}
                {shortcutStatus && (
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '12px',
                    marginTop: '16px'
                  }}>
                    <p style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>
                      Statut: {shortcutStatus}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainHUDPage; 