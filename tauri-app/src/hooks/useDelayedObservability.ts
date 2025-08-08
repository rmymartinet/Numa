import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';

// Hook pour initialiser l'observabilité de manière différée
export function useDelayedObservability() {
  useEffect(() => {
    let isInitialized = false;

    // Fonction d'initialisation de l'observabilité
    const initializeObservability = async () => {
      if (isInitialized) return;
      isInitialized = true;

      try {
        // Vérifier le consentement avant d'initialiser
        const errorConsent = localStorage.getItem('numa_error_reporting_consent') === 'true';
        const loggingConsent = localStorage.getItem('numa_logging_consent') === 'true';
        const metricsConsent = localStorage.getItem('numa_metrics_consent') === 'true';

        // Initialiser le logger de base (toujours utile)
        const { logger } = await import('../utils/logger');
        
        logger.info('Observabilité initialisée de manière différée', {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          consents: { errorConsent, loggingConsent, metricsConsent },
        });

        // Vérifier si le mode furtif est actif
        const stealthActive = await checkStealthStatus();
        
        if (stealthActive) {
          // Guard global : désactiver l'observabilité en mode furtif
          await disableObservabilityForStealth(logger);
          return;
        }

        // Initialiser Sentry seulement si le consentement est donné
        if (errorConsent) {
          try {
            const { errorReporter } = await import('../utils/errorReporting');
            errorReporter.initialize();
            logger.info('Sentry initialisé avec consentement utilisateur');
          } catch (error) {
            logger.warn('Erreur lors de l\'initialisation de Sentry', { error });
          }
        }

        // Initialiser les métriques seulement si le consentement est donné
        if (metricsConsent) {
          try {
            const { metricsTracker } = await import('../utils/metrics');
            metricsTracker.setSamplingRate(0.1);
            logger.info('Métriques initialisées avec consentement utilisateur');
          } catch (error) {
            logger.warn('Erreur lors de l\'initialisation des métriques', { error });
          }
        }

      } catch (error) {
        console.warn('Erreur lors de l\'initialisation différée de l\'observabilité:', error);
      }
    };

    // Fonction pour vérifier le statut du mode furtif
    const checkStealthStatus = async (): Promise<boolean> => {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke('get_stealth_status');
      } catch (error) {
        console.warn('Impossible de vérifier le statut du mode furtif:', error);
        return false;
      }
    };

    // Fonction pour désactiver l'observabilité en mode furtif
    const disableObservabilityForStealth = async (logger: any) => {
      try {
        logger.info('Mode furtif actif - désactivation de l\'observabilité avancée');

        // Désactiver Sentry Replay
        try {
          const { errorReporter } = await import('../utils/errorReporting');
          errorReporter.disableReplay();
          logger.info('Sentry Replay désactivé pour le mode furtif');
        } catch (error) {
          // Sentry pas encore initialisé, c'est normal
        }

        // Désactiver les métriques
        try {
          const { metricsTracker } = await import('../utils/metrics');
          metricsTracker.setSamplingRate(0);
          logger.info('Métriques désactivées pour le mode furtif');
        } catch (error) {
          // Métriques pas encore initialisées, c'est normal
        }

        // Désactiver l'envoi réseau des logs
        try {
          logger.setNetworkOff(true);
          logger.info('Envoi réseau des logs désactivé pour le mode furtif');
        } catch (error) {
          logger.warn('Impossible de désactiver l\'envoi réseau des logs');
        }

      } catch (error) {
        logger.warn('Erreur lors de la désactivation de l\'observabilité pour le mode furtif', { error });
      }
    };

    // Méthode 1: Attendre que l'application soit prête
    const setupTauriListener = async () => {
      try {
        // Écouter l'événement personnalisé de l'application
        await listen('app-ready', () => {
          // L'application est prête, initialiser l'observabilité
          requestIdleCallback(() => {
            initializeObservability();
          }, { timeout: 500 });
        });
      } catch (error) {
        // Fallback sur l'événement Tauri standard
        try {
          await listen('tauri://ready', () => {
            requestIdleCallback(() => {
              initializeObservability();
            }, { timeout: 1000 });
          });
        } catch (tauriError) {
          // Fallback final sur requestIdleCallback
          console.warn('Événements Tauri non disponibles, fallback sur requestIdleCallback');
          requestIdleCallback(() => {
            initializeObservability();
          }, { timeout: 2000 });
        }
      }
    };

    // Méthode 2: Utiliser requestIdleCallback avec fallback
    const setupIdleCallback = () => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          initializeObservability();
        }, { timeout: 3000 });
      } else {
        // Fallback pour les navigateurs qui ne supportent pas requestIdleCallback
        setTimeout(() => {
          initializeObservability();
        }, 1000);
      }
    };

    // Démarrer l'initialisation
    setupTauriListener().catch(() => {
      // Si Tauri n'est pas disponible, utiliser requestIdleCallback
      setupIdleCallback();
    });

    // Cleanup
    return () => {
      isInitialized = true; // Empêcher l'initialisation si le composant est démonté
    };
  }, []);
}
