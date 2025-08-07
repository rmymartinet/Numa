import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
// import { WebviewWindow } from "@tauri-apps/api/webview-window";  // API non disponible
import Tesseract from "tesseract.js";
import { OPENAI_API_KEY, OPENAI_CONFIG } from "./config";
import FloatingBubble from "./components/FloatingBubble";
import Sidebar from "./components/Sidebar";
import LoadingSpinner from "./components/LoadingSpinner";
import { usePreferences } from "./utils/storage";
import { useLogger, logError, logPerformance } from "./utils/logger";
import { useTheme } from "./hooks/useTheme";
import { useKeyboardNavigation, APP_SHORTCUTS } from "./hooks/useKeyboardNavigation";
import { fetchWithRetry } from "./utils/api";
import { LazyActivityContent, LazyPersonalizeContent, LazySettingsContent } from "./components/LazyComponents";
import Onboarding from "./components/Onboarding";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

// Types
type TabType = 'activity' | 'prompts' | 'settings';
type SettingsTabType = 'settings' | 'app' | 'profile' | 'security' | 'billing';

// Constants
export const ACTIVITIES_DATA = [
  {
    title: "No Conversation Detected in Transcript",
    duration: "2m",
    greenCount: 0,
    redCount: 0,
    description: "Conversation Participants: rémy martinet - Them Transcript Conte...",
    time: "Today at 12:30pm"
  },
  {
    title: "You Request JavaScript Two Sum Solution",
    duration: "7m",
    greenCount: 4,
    redCount: 0,
    description: "Introduction and Context - Conversation primarily involves rémy mart...",
    time: "Today at 12:23pm"
  },
  {
    title: "You and Them Discuss Clouly for Technical Intervie...",
    duration: "8m",
    greenCount: 2,
    redCount: 0,
    description: "Présentation et Utilisation d'Outils Techniques - Them explique la...",
    time: "Today at 12:13pm"
  },
  {
    title: "You Meet Cluely: AI Meeting Assistant Introduction",
    duration: "0m",
    greenCount: 0,
    redCount: 0,
    description: "Introduction and Welcome - Them welcomed the participant to Cluely....",
    time: "Today at 12:12pm"
  },
  {
    title: "You Explore Cluely AI Meeting Features",
    duration: "0m",
    greenCount: 0,
    redCount: 0,
    description: "Introduction to Cluely - Cluely is introduced as a tool that uses A...",
    time: "Today at 12:08pm"
  }
];

/**
 * Main App component for Numa - AI-powered screen capture and analysis
 * Features: Screen capture, OCR, GPT integration, and activity tracking
 */
function App() {
  // States with proper typing
  const [shortcutStatus, setShortcutStatus] = useState<string>("");
  const [screenshotPath, setScreenshotPath] = useState<string>("");
  const [extractedText, setExtractedText] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [gptResponse, setGptResponse] = useState<string>("");
  const [isAskingGPT, setIsAskingGPT] = useState<boolean>(false);
  const [showFloatingBubble, setShowFloatingBubble] = useState<boolean>(false);
  const [preferences, updatePreferences] = usePreferences();
  const [activeTab, setActiveTab] = useState<TabType>(preferences.activeTab);
  // const [activeSettingsTab] = useState<SettingsTabType>(preferences.activeSettingsTab);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(true);
  const logger = useLogger('App');
  const { toggleTheme, isDark } = useTheme();




  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    updatePreferences({ activeTab: tab });
  };

  const handleCapture = async () => {
    const startTime = performance.now();
    try {
      logger.info('Début de la capture d\'écran');
      setIsProcessing(true);
      const imagePath = await invoke<string>("capture_screen"); 
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
    }
  };

  const handleShowOverlay = async () => {
    try {
      await invoke("show_overlay");
      console.log("Overlay affiché");
    } catch (error) {
      console.error("Erreur lors de l'affichage de l'overlay:", error);
    }
  };

  const handleHideOverlay = async () => {
    try {
      await invoke("hide_overlay");
      console.log("Overlay masqué");
    } catch (error) {
      console.error("Erreur lors du masquage de l'overlay:", error);
    }
  };

  const handleOpenOverlay = async () => {
    try {
      // Ouvrir la fenêtre overlay via Tauri
      await invoke("toggle_overlay", { show: true });
      console.log("Fenêtre overlay ouverte");
    } catch (error) {
      console.error("Erreur lors de l'ouverture de l'overlay:", error);
    }
  };

  const handleCloseOverlay = async () => {
    try {
      // Fermer la fenêtre overlay via Tauri
      await invoke("toggle_overlay", { show: false });
      console.log("Fenêtre overlay fermée");
    } catch (error) {
      console.error("Erreur lors de la fermeture de l'overlay:", error);
    }
  };



  async function runOCR(imagePath: string): Promise<string> {
    try {
      setExtractedText("Traitement en cours...");
      
      const base64Image = await invoke<string>("get_image_as_base64", { imagePath });
      console.log("Image convertie en base64");
      
      const result = await Tesseract.recognize(base64Image, 'eng', {
        logger: m => console.log(m)
      });
      
      const text = result.data.text;
      setExtractedText(text);
      console.log("Texte extrait:", text);
      return text;
    } catch (error) {
      console.error("Erreur lors de l'OCR:", error);
      const errorMessage = `Erreur lors de l'extraction du texte: ${error}`;
      setExtractedText(errorMessage);
      setShortcutStatus("Erreur lors de l'OCR");
      return "";
    }
  }

  /**
   * Cleans OCR extracted text by removing special characters and normalizing whitespace
   * @param text - Raw OCR text
   * @returns Cleaned text ready for GPT processing
   */

  
  function cleanExtractedText(text: string): string {
    return text
      // Remove special characters and symbols
      .replace(/[®©™&%$#@!*()_+\-=\[\]{}|\\:";'<>?,./~`]/g, ' ')
      // Remove control characters
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      // Remove empty lines
      .split('\n')
      .filter(line => line.trim().length > 0)
      .join('\n')
      .trim();
  }

  async function askGPT(text: string): Promise<string> {
    if (!text.trim()) {
      const errorMessage = "Aucun texte à analyser";
      setGptResponse(errorMessage);
      return errorMessage;
    }

    setIsAskingGPT(true);
    setGptResponse("Demande en cours...");
    
    try {
      const cleanedText = cleanExtractedText(text);
      
      if (!cleanedText.trim()) {
        throw new Error("Le texte nettoyé est vide");
      }
      
      const json = await fetchWithRetry<any>(`${OPENAI_CONFIG.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: OPENAI_CONFIG.model,
          messages: [
            { role: "system", content: "Tu es un expert en développement. Analyse ce texte extrait par OCR qui peut contenir des erreurs de reconnaissance. Identifie et explique le code ou les éléments techniques que tu peux reconnaître." },
            { role: "user", content: `Voici le texte extrait par OCR (peut contenir des erreurs) :\n\n${cleanedText}` }
          ],
          max_tokens: OPENAI_CONFIG.maxTokens,
          temperature: OPENAI_CONFIG.temperature
        }),
      });
      
      const response = json.choices?.[0]?.message?.content ?? "Aucune réponse reçue";
      
      setGptResponse(response);
      setShowFloatingBubble(true);
      logger.info("Réponse GPT reçue", { responseLength: response.length });
      return response;
    } catch (error) {
      logError(error as Error, 'askGPT');
      const errorMessage = `Erreur lors de la demande GPT: ${error}`;
      setGptResponse(errorMessage);
      return errorMessage;
    } finally {
      setIsAskingGPT(false);
    }
  }

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

  return (
    <ErrorBoundary>
      <div className={`h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex transition-colors duration-200`}>
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
      
      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {/* Header avec bouton thème */}
        <div className="flex justify-between items-center mb-6 p-6 pb-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Numa - AI Assistant
          </h1>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            aria-label="Changer de thème"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
        <div className="w-full h-full flex flex-col py-4 pl-4">
          {/* Header */}
          <div className="mb-3 flex-shrink-0">
            <h1 className="text-lg font-bold text-gray-900 mb-1">Good afternoon, rémy</h1>
          </div>
          
          {/* Content based on active tab */}
          {activeTab === 'activity' && <LazyActivityContent />}
          
          {activeTab === 'settings' && <LazySettingsContent />}
          
          {activeTab === 'prompts' && <LazyPersonalizeContent />}
          
          {/* Original content for other tabs */}
          {activeTab !== 'activity' && activeTab !== 'prompts' && (
            <div className="flex-1 flex flex-col space-y-3 overflow-hidden">
              {/* Capture Section */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 flex-shrink-0">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  📸 Capture d'écran
                </h2>
                
                <div className="space-y-4">
                  <p className="text-gray-600">Cliquez sur le bouton pour capturer l'écran et extraire le texte</p>
                  
                  <button 
                    onClick={handleCapture} 
                    disabled={isProcessing}
                    className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
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
                  
                  {/* Boutons de test overlay */}
                  <div className="flex space-x-2">
                                          <button 
                        onClick={handleOpenOverlay}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
                      >
                        🪟 Open Overlay
                      </button>
                      
                      <button 
                        onClick={handleCloseOverlay}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
                      >
                        ❌ Close Overlay
                      </button>
                    
                    <button 
                      onClick={handleShowOverlay}
                      className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
                    >
                      👁️ Show Overlay
                    </button>
                    
                    <button 
                      onClick={handleHideOverlay}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
                    >
                      🙈 Hide Overlay
                    </button>
                  </div>
                  
                  {screenshotPath && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Chemin de l'image :</p>
                      <p className="text-xs text-gray-700 break-all font-mono">{screenshotPath}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* OCR Results Section */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 flex-1 flex flex-col overflow-hidden">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  🔍 Résultats OCR
                </h2>
                
                {extractedText ? (
                  <div className="flex-1 flex flex-col space-y-3 overflow-hidden">
                    {/* Texte brut */}
                    <div className="flex-1 flex flex-col">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Texte extrait (brut)</h3>
                      <div className="bg-gray-50 rounded-lg p-3 flex-1 border border-gray-200 overflow-y-auto">
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap">{extractedText}</pre>
                      </div>
                    </div>
                    
                    {/* Texte nettoyé */}
                    <div className="flex-1 flex flex-col">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Texte nettoyé</h3>
                      <div className="bg-blue-50 rounded-lg p-3 flex-1 border border-blue-200 overflow-y-auto">
                        <pre className="text-xs text-blue-800 whitespace-pre-wrap">{cleanExtractedText(extractedText)}</pre>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex space-x-3 flex-shrink-0">
                      <button 
                        onClick={() => askGPT(extractedText)} 
                        disabled={isAskingGPT}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                      >
                        {isAskingGPT ? (
                          <>
                            <LoadingSpinner size="sm" color="white" variant="pulse" />
                            <span>Demande...</span>
                          </>
                        ) : (
                          <>
                            <span>🤖</span>
                            <span>Demander à GPT</span>
                          </>
                        )}
                      </button>
                      
                      <button 
                        onClick={() => {
                          setGptResponse("Ceci est un test de la bulle flottante ! 🎉\n\nLa bulle apparaît en haut à droite de l'écran avec un design moderne et semi-transparent.");
                          setShowFloatingBubble(true);
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
                      >
                        🧪 Test
                      </button>
                      
                      <button 
                        onClick={handleShowOverlay}
                        className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
                      >
                        👁️ Show Overlay
                      </button>
                      
                      <button 
                        onClick={handleHideOverlay}
                        className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
                      >
                        🙈 Hide Overlay
                      </button>
                      
                      <button 
                        onClick={handleOpenOverlay}
                        className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
                      >
                        🪟 Open Overlay
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <div className="text-3xl mb-2">📄</div>
                      <p className="text-sm">Aucun texte extrait</p>
                      <p className="text-xs">Capturez d'abord un écran pour voir les résultats</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Status */}
          {shortcutStatus && (
            <div className="bg-white rounded-lg border border-gray-200 p-3 mt-4 flex-shrink-0">
              <p className="text-gray-600 text-sm">Statut: {shortcutStatus}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Bulle flottante */}
      <FloatingBubble
        text={gptResponse}
        isVisible={showFloatingBubble}
        onClose={() => setShowFloatingBubble(false)}
      />

      {/* Onboarding */}
      <Onboarding
        isVisible={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
      />
      </div>
    </ErrorBoundary>
  );
}

export default App;
