import { useState, useEffect, useCallback } from 'react';

interface PWAState {
  isInstalled: boolean;
  isInstallable: boolean;
  isOnline: boolean;
  isStandalone: boolean;
  deferredPrompt: any;
}

interface PWAInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWA() {
  const [pwaState, setPwaState] = useState<PWAState>({
    isInstalled: false,
    isInstallable: false,
    isOnline: navigator.onLine,
    isStandalone: window.matchMedia('(display-mode: standalone)').matches,
    deferredPrompt: null,
  });

  // Vérifier si l'app est installée
  const checkInstallation = useCallback(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInstalled = isStandalone || (window.navigator as any).standalone === true;
    
    setPwaState(prev => ({
      ...prev,
      isInstalled,
      isStandalone,
    }));
  }, []);

  // Gérer l'événement beforeinstallprompt
  const handleBeforeInstallPrompt = useCallback((event: Event) => {
    event.preventDefault();
    const promptEvent = event as PWAInstallPromptEvent;
    
    setPwaState(prev => ({
      ...prev,
      isInstallable: true,
      deferredPrompt: promptEvent,
    }));
  }, []);

  // Gérer l'événement appinstalled
  const handleAppInstalled = useCallback(() => {
    setPwaState(prev => ({
      ...prev,
      isInstalled: true,
      isInstallable: false,
      deferredPrompt: null,
    }));
  }, []);

  // Gérer les changements de connectivité
  const handleOnlineStatusChange = useCallback(() => {
    setPwaState(prev => ({
      ...prev,
      isOnline: navigator.onLine,
    }));
  }, []);

  // Installer l'app
  const installApp = useCallback(async () => {
    if (!pwaState.deferredPrompt) {
      console.warn('Aucune invite d\'installation disponible');
      return false;
    }

    try {
      pwaState.deferredPrompt.prompt();
      const { outcome } = await pwaState.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setPwaState(prev => ({
          ...prev,
          isInstallable: false,
          deferredPrompt: null,
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur lors de l\'installation:', error);
      return false;
    }
  }, [pwaState.deferredPrompt]);

  // Enregistrer le Service Worker
  const registerServiceWorker = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker enregistré:', registration);
        
        // Vérifier les mises à jour
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Nouvelle version disponible
                console.log('Nouvelle version disponible');
              }
            });
          }
        });
        
        return registration;
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement du Service Worker:', error);
        return null;
      }
    }
    return null;
  }, []);

  // Mettre à jour l'app
  const updateApp = useCallback(async () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, []);

  // Initialisation
  useEffect(() => {
    checkInstallation();
    registerServiceWorker();

    // Écouteurs d'événements
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    // Écouteur pour les mises à jour du Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, [checkInstallation, registerServiceWorker, handleBeforeInstallPrompt, handleAppInstalled, handleOnlineStatusChange]);

  return {
    ...pwaState,
    installApp,
    updateApp,
    registerServiceWorker,
  };
}
