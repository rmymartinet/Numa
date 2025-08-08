import { useEffect } from 'react';

// Hook pour initialiser l'observabilité de manière différée
export function useDelayedObservability() {
  useEffect(() => {
    // Attendre que l'application soit complètement chargée
    const timer = setTimeout(async () => {
      try {
        // Importer dynamiquement pour éviter les conflits d'initialisation
        const { logger } = await import('../utils/logger');
        
        logger.info('Observabilité initialisée de manière différée', {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        });
        
        // Optionnel : initialiser Sentry plus tard
        // const { errorReporter } = await import('../utils/errorReporting');
        // errorReporter.initialize();
        
      } catch (error) {
        console.warn('Erreur lors de l\'initialisation différée de l\'observabilité:', error);
      }
    }, 2000); // Attendre 2 secondes

    return () => clearTimeout(timer);
  }, []);
}
