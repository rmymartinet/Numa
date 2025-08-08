import React, { useState, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import Tesseract from 'tesseract.js';
import { usePreferences } from '../utils/storage';
import { useLogger, logError, logPerformance } from '../utils/logger';
import { useTheme } from '../hooks/useTheme';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { useMetrics } from '../utils/metrics';
import MetricsDashboard from '../components/MetricsDashboard';
import { useAlerts } from '../utils/alerts';
import AlertsPanel from '../components/AlertsPanel';
import HUDBar from '../components/HUDBar';

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
  const [_shortcutStatus, setShortcutStatus] = useState<string>(''); // Utilisé dans les event listeners
  const [_screenshotPath, setScreenshotPath] = useState<string>(''); // Utilisé dans handleCapture
  const [_extractedText, setExtractedText] = useState<string>(''); // Utilisé dans runOCR
  const [_isProcessing, setIsProcessing] = useState<boolean>(false); // Utilisé dans handleCapture
  const [preferences, updatePreferences] = usePreferences();
  const [_activeTab, setActiveTab] = useState<TabType>(preferences.activeTab); // Utilisé dans handleTabChange
  const logger = useLogger('MainHUDPage');
  const { toggleTheme } = useTheme();
  const {
    trackFeatureUsage: _trackFeatureUsage,
    trackConversionEvent: _trackConversionEvent,
  } = useMetrics();
  const { alerts } = useAlerts();
  const [showMetricsDashboard, setShowMetricsDashboard] = useState(false);
  const [showAlertsPanel, setShowAlertsPanel] = useState(false);

  // Gestion des onglets
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    updatePreferences({ activeTab: tab });
  };

  // Gestion de la capture d'écran complète
  const handleCapture = async () => {
    const startTime = performance.now();
    try {
      logger.info("Début de la capture d'écran");
      setIsProcessing(true);
      setIsListening(true);

      const imagePath = (await invoke('capture_screen')) as string;
      logger.info("Capture d'écran réussie", { imagePath });
      setScreenshotPath(imagePath);
      await runOCR(imagePath);
      logPerformance('Capture et OCR complète', performance.now() - startTime);
    } catch (error) {
      logError(error as Error, 'handleCapture');
      setScreenshotPath('Erreur lors de la capture');
      setShortcutStatus("Erreur lors de la capture d'écran");
    } finally {
      setIsProcessing(false);
      setIsListening(false);
    }
  };

  // Fonction OCR
  async function runOCR(imagePath: string): Promise<string> {
    try {
      setExtractedText('Traitement en cours...');

      const result = await Tesseract.recognize(imagePath, 'fra+eng', {
        logger: m => console.log(m),
      });

      const text = result.data.text;
      setExtractedText(text);
      return text;
    } catch (error) {
      console.error('Erreur OCR:', error);
      setExtractedText("Erreur lors de l'extraction du texte");
      return '';
    }
  }

  // Gestion de l'ouverture/fermeture du panneau
  const handleTogglePanel = async () => {
    console.log('Toggle panel clicked, current state:', isPanelExpanded);
    const newState = !isPanelExpanded;
    console.log('Nouvel état:', newState);
    setIsPanelExpanded(newState);

    try {
      if (newState) {
        console.log('Appel de panel_show');
        await invoke('panel_show');
        console.log('panel_show appelé avec succès');
      } else {
        console.log('Appel de panel_hide');
        await invoke('panel_hide');
        console.log('panel_hide appelé avec succès');
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
        const unlistenGlobalShortcut = await listen(
          'global-shortcut-triggered',
          event => {
            console.log('Raccourci global détecté:', event.payload);
            setShortcutStatus('Raccourci global activé !');
            // Déclencher automatiquement la capture
            handleCapture();
          }
        );

        const unlistenSuccess = await listen('screenshot-captured', event => {
          console.log("Capture d'écran réussie:", event.payload);
          setScreenshotPath(event.payload as string);
          setShortcutStatus("Capture d'écran réussie !");
        });

        const unlistenError = await listen('screenshot-error', event => {
          console.log("Erreur de capture d'écran:", event.payload);
          setShortcutStatus("Erreur lors de la capture d'écran");
        });

        // Écouter les événements de mode furtif
        const unlistenStealthActivated = await listen(
          'stealth-activated',
          () => {
            console.log('Mode furtif activé');
            setShortcutStatus('Mode furtif activé - invisible aux captures');
          }
        );

        const unlistenStealthDeactivated = await listen(
          'stealth-deactivated',
          () => {
            console.log('Mode furtif désactivé');
            setShortcutStatus('Mode furtif désactivé');
          }
        );

        return () => {
          unlistenGlobalShortcut();
          unlistenSuccess();
          unlistenError();
          unlistenStealthActivated();
          unlistenStealthDeactivated();
        };
      } catch (error) {
        console.error('Erreur lors de la configuration des événements:', error);
      }
    };

    setupEventListeners();
  }, []);

  // Navigation par clavier (sans APP_SHORTCUTS pour éviter les conflits)
  const shortcuts = [
    {
      key: '1',
      action: () => handleTabChange('activity'),
      description: "Aller à l'onglet Activity",
    },
    {
      key: '2',
      action: () => handleTabChange('prompts'),
      description: "Aller à l'onglet Personalize",
    },
    {
      key: '3',
      action: () => handleTabChange('settings'),
      description: "Aller à l'onglet Settings",
    },
    {
      key: 'c',
      ctrlKey: true,
      action: handleCapture,
      description: "Capturer l'écran",
    },
    {
      key: 't',
      ctrlKey: true,
      action: toggleTheme,
      description: 'Changer de thème',
    },
    {
      key: 'k',
      ctrlKey: true,
      metaKey: true, // Cmd+K sur Mac
      action: async () => {
        try {
          await invoke('toggle_stealth_cmd');
          console.log('Mode furtif activé/désactivé (Cmd+K)');
        } catch (error) {
          console.error('Erreur lors du toggle du mode furtif:', error);
        }
      },
      description: 'Mode furtif (invisible aux captures)',
    },
    {
      key: 's',
      ctrlKey: true, // Test avec Ctrl+S
      action: async () => {
        try {
          await invoke('toggle_stealth_cmd');
          console.log('Mode furtif activé/désactivé (Ctrl+S)');
        } catch (error) {
          console.error('Erreur lors du toggle du mode furtif:', error);
        }
      },
      description: 'Mode furtif test (Ctrl+S)',
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
        left: 0,
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

      {/* Bouton pour ouvrir le dashboard métriques */}
      <button
        onClick={() => setShowMetricsDashboard(true)}
        className="fixed bottom-4 right-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 shadow-lg z-40"
        title="Ouvrir le dashboard métriques"
        style={{ pointerEvents: 'auto' }}
      >
        📊
      </button>

      {/* Bouton pour ouvrir le centre d'alertes */}
      <button
        onClick={() => setShowAlertsPanel(true)}
        className={`fixed bottom-4 right-16 rounded-full p-3 shadow-lg z-40 ${
          alerts.length > 0
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-gray-500 hover:bg-gray-600 text-white'
        }`}
        title={`Centre d'alertes (${alerts.length} alerte${alerts.length > 1 ? 's' : ''})`}
        style={{ pointerEvents: 'auto' }}
      >
        {alerts.length > 0 ? `🚨${alerts.length}` : '🚨'}
      </button>

      {/* Dashboard métriques */}
      <MetricsDashboard
        isVisible={showMetricsDashboard}
        onClose={() => setShowMetricsDashboard(false)}
      />

      {/* Centre d'alertes */}
      <AlertsPanel
        isVisible={showAlertsPanel}
        onClose={() => setShowAlertsPanel(false)}
      />
    </div>
  );
};

export default MainHUDPage;
