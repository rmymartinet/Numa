import React, { useState, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import Tesseract from 'tesseract.js';
import { usePreferences } from '../utils/storage';
import { useLogger, logError, logPerformance } from '../utils/logger';
import { useTheme } from '../hooks/useTheme';
import { useKeyboardNavigation, APP_SHORTCUTS } from '../hooks/useKeyboardNavigation';
import HUDBar from '../components/HUDBar';
import DropdownPanel from '../components/DropdownPanel';

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
  const handleTogglePanel = async () => {
    console.log('Toggle panel clicked, current state:', isPanelExpanded);
    const newState = !isPanelExpanded;
    setIsPanelExpanded(newState);
    
    try {
      if (newState) {
        await invoke('panel_show', { passthrough: false });
      } else {
        await invoke('panel_hide');
      }
    } catch (error) {
      console.error('Erreur toggle panel:', error);
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

  // Navigation par clavier (sans APP_SHORTCUTS pour éviter les conflits)
  const shortcuts = [
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
  ];
  
  useKeyboardNavigation(shortcuts);



  // Debug: Surveiller les changements d'état du panel
  useEffect(() => {
    console.log('Panel expanded state changed to:', isPanelExpanded);
    // Debug visuel temporaire
    if (isPanelExpanded) {
      document.title = 'NUMA - Panel OPEN';
    } else {
      document.title = 'NUMA - Panel CLOSED';
    }
  }, [isPanelExpanded]);

  return (
    <div 
      className="hud-container" 
      data-hud-content
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        overflow: 'hidden',
        pointerEvents: 'none', // Zone principale traversable
        border: 'none',
        outline: 'none',
        position: 'fixed',
        top: 0,
        left: 0
      }}
    >
      {/* HUD Bar - toujours visible */}
      <div style={{ pointerEvents: 'auto' }} data-hud-bar>
        <HUDBar 
          isListening={isListening}
          inputText={inputText}
          isPanelExpanded={isPanelExpanded}
          onCapture={handleCapture}
          onInputChange={setInputText}
          onTogglePanel={handleTogglePanel}
          onClose={handleClose}
        />
      </div>
      

    </div>
  );
};

export default MainHUDPage; 