import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';

// Hook pour gérer l'observabilité en fonction du mode furtif
export function useStealthObservability() {
  const [stealthActive, setStealthActive] = useState(false);

  useEffect(() => {
    let isSubscribed = true;

    // Fonction pour ajuster l'observabilité selon le mode furtif
    const adjustObservability = async (isStealthActive: boolean) => {
      if (!isSubscribed) return;

      try {
        if (isStealthActive) {
          // Mode furtif actif - désactiver l'observabilité avancée
          await disableObservabilityForStealth();
        } else {
          // Mode furtif inactif - réactiver l'observabilité selon le consentement
          await enableObservabilityWithConsent();
        }
      } catch (error) {
        console.warn('Erreur lors de l\'ajustement de l\'observabilité:', error);
      }
    };

    // Écouter les changements de mode furtif
    const setupStealthListener = async () => {
      try {
        await listen('stealth-activated', () => {
          setStealthActive(true);
          adjustObservability(true);
        });

        await listen('stealth-deactivated', () => {
          setStealthActive(false);
          adjustObservability(false);
        });
      } catch (error) {
        console.warn('Impossible de configurer les listeners de mode furtif:', error);
      }
    };

    // Vérifier le statut initial
    const checkInitialStatus = async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const initialStatus: boolean = await invoke('get_stealth_status');
        setStealthActive(initialStatus);
        adjustObservability(initialStatus);
      } catch (error) {
        console.warn('Impossible de vérifier le statut initial du mode furtif:', error);
      }
    };

    setupStealthListener();
    checkInitialStatus();

    return () => {
      isSubscribed = false;
    };
  }, []);

  return { stealthActive };
}

// Fonction pour désactiver l'observabilité en mode furtif
async function disableObservabilityForStealth() {
  try {
    console.log('Mode furtif actif - désactivation de l\'observabilité avancée');

    // Désactiver Sentry Replay
    try {
      const { errorReporter } = await import('../utils/errorReporting');
      errorReporter.disableReplay();
      console.log('Sentry Replay désactivé pour le mode furtif');
    } catch (error) {
      // Sentry pas encore initialisé, c'est normal
    }

    // Désactiver les métriques
    try {
      const { metricsTracker } = await import('../utils/metrics');
      metricsTracker.setSamplingRate(0);
      console.log('Métriques désactivées pour le mode furtif');
    } catch (error) {
      // Métriques pas encore initialisées, c'est normal
    }

    // Désactiver l'envoi réseau des logs
    try {
      const { logger } = await import('../utils/logger');
      logger.setNetworkOff(true);
      console.log('Envoi réseau des logs désactivé pour le mode furtif');
    } catch (error) {
      console.warn('Impossible de désactiver l\'envoi réseau des logs');
    }

  } catch (error) {
    console.warn('Erreur lors de la désactivation de l\'observabilité pour le mode furtif', { error });
  }
}

// Fonction pour réactiver l'observabilité selon le consentement
async function enableObservabilityWithConsent() {
  try {
    console.log('Mode furtif inactif - réactivation de l\'observabilité selon le consentement');

    const errorConsent = localStorage.getItem('numa_error_reporting_consent') === 'true';
    const metricsConsent = localStorage.getItem('numa_metrics_consent') === 'true';
    const loggingConsent = localStorage.getItem('numa_logging_consent') === 'true';

    // Réactiver Sentry si consentement donné
    if (errorConsent) {
      try {
        const { errorReporter } = await import('../utils/errorReporting');
        errorReporter.initialize();
        console.log('Sentry réactivé avec consentement utilisateur');
      } catch (error) {
        console.warn('Erreur lors de la réactivation de Sentry', { error });
      }
    }

    // Réactiver les métriques si consentement donné
    if (metricsConsent) {
      try {
        const { metricsTracker } = await import('../utils/metrics');
        metricsTracker.setSamplingRate(0.1);
        console.log('Métriques réactivées avec consentement utilisateur');
      } catch (error) {
        console.warn('Erreur lors de la réactivation des métriques', { error });
      }
    }

    // Réactiver l'envoi réseau des logs si consentement donné
    if (loggingConsent) {
      try {
        const { logger } = await import('../utils/logger');
        logger.setNetworkOff(false);
        console.log('Envoi réseau des logs réactivé avec consentement utilisateur');
      } catch (error) {
        console.warn('Erreur lors de la réactivation de l\'envoi réseau des logs', { error });
      }
    }

  } catch (error) {
    console.warn('Erreur lors de la réactivation de l\'observabilité', { error });
  }
}
