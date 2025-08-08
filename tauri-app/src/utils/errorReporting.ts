// Système de reporting d'erreurs avec Sentry
import * as Sentry from '@sentry/react';
import { Replay } from '@sentry/replay';
import { logger } from './logger';
import { checkConsent, isDoNotTrackEnabled } from './privacyManager';

// Configuration Sentry
const SENTRY_DSN = process.env.VITE_SENTRY_DSN || '';
const SENTRY_ENVIRONMENT = process.env.NODE_ENV || 'development';

// Types pour la configuration
export interface ErrorReportingConfig {
  enabled: boolean;
  dsn: string;
  environment: string;
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
  userConsent: boolean;
}

// Configuration par défaut
const DEFAULT_CONFIG: ErrorReportingConfig = {
  enabled: false,
  dsn: SENTRY_DSN,
  environment: SENTRY_ENVIRONMENT,
  tracesSampleRate: 0.1, // 10% des transactions
  replaysSessionSampleRate: 0.1, // 10% des sessions
  replaysOnErrorSampleRate: 1.0, // 100% des sessions avec erreurs
  userConsent: false,
};

class ErrorReporter {
  private config: ErrorReportingConfig;
  private isInitialized = false;

  constructor(config: Partial<ErrorReportingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadUserConsent();
  }

  // Initialiser Sentry
  initialize(): void {
    if (!this.config.enabled || !this.config.dsn) {
      logger.info('Error reporting désactivé', {
        enabled: this.config.enabled,
        hasDsn: !!this.config.dsn,
      });
      return;
    }

    // Vérifier Do Not Track et consentement
    if (isDoNotTrackEnabled() || !checkConsent('errorReporting')) {
      logger.info('Error reporting désactivé - Do Not Track actif ou pas de consentement');
      return;
    }

    try {
      Sentry.init({
        dsn: this.config.dsn,
        environment: this.config.environment,
        tracesSampleRate: this.config.tracesSampleRate,
        replaysSessionSampleRate: this.config.replaysSessionSampleRate,
        replaysOnErrorSampleRate: this.config.replaysOnErrorSampleRate,
        integrations: [
          new Replay({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],
        beforeSend(event) {
          // Filtrer les erreurs sensibles
          if (event.exception) {
            const exception = event.exception.values?.[0];
            if (exception?.value?.includes('password') || 
                exception?.value?.includes('token') ||
                exception?.value?.includes('secret')) {
              return null; // Ne pas envoyer
            }
          }
          return event;
        },
      });

      this.isInitialized = true;
      logger.info('Error reporting initialisé avec succès', {
        environment: this.config.environment,
        tracesSampleRate: this.config.tracesSampleRate,
      });
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation de Sentry', { error });
    }
  }

  // Capturer une erreur
  captureError(error: Error, context?: Record<string, any>): void {
    if (!this.isInitialized) {
      logger.error('Tentative de capture d\'erreur sans Sentry initialisé', {
        error: error.message,
        context,
      });
      return;
    }

    try {
      Sentry.captureException(error, {
        extra: context,
        tags: {
          source: 'frontend',
          component: context?.component || 'unknown',
        },
      });

      logger.info('Erreur envoyée à Sentry', {
        error: error.message,
        context,
      });
    } catch (sentryError) {
      logger.error('Erreur lors de l\'envoi à Sentry', { sentryError });
    }
  }

  // Capturer un message
  captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>): void {
    if (!this.isInitialized) {
      logger.info('Message non envoyé (Sentry non initialisé)', { message, level, context });
      return;
    }

    try {
      Sentry.captureMessage(message, {
        level,
        extra: context,
        tags: {
          source: 'frontend',
        },
      });
    } catch (sentryError) {
      logger.error('Erreur lors de l\'envoi du message à Sentry', { sentryError });
    }
  }

  // Définir l'utilisateur
  setUser(user: { id?: string; email?: string; username?: string }): void {
    if (!this.isInitialized) return;

    try {
      Sentry.setUser(user);
      logger.info('Utilisateur défini dans Sentry', { user });
    } catch (error) {
      logger.error('Erreur lors de la définition de l\'utilisateur', { error });
    }
  }

  // Ajouter du contexte
  setContext(name: string, context: Record<string, any>): void {
    if (!this.isInitialized) return;

    try {
      Sentry.setContext(name, context);
    } catch (error) {
      logger.error('Erreur lors de l\'ajout du contexte', { error });
    }
  }

  // Ajouter des tags
  setTag(key: string, value: string): void {
    if (!this.isInitialized) return;

    try {
      Sentry.setTag(key, value);
    } catch (error) {
      logger.error('Erreur lors de l\'ajout du tag', { error });
    }
  }

  // Gérer le consentement utilisateur
  setUserConsent(consent: boolean): void {
    this.config.userConsent = consent;
    this.saveUserConsent();

    if (consent && !this.isInitialized) {
      this.initialize();
    } else if (!consent && this.isInitialized) {
      this.disable();
    }

    logger.info('Consentement utilisateur mis à jour', { consent });
  }

  // Désactiver Sentry
  disable(): void {
    if (this.isInitialized) {
      Sentry.close();
      this.isInitialized = false;
      logger.info('Error reporting désactivé');
    }
  }

  disableReplay(): void {
    try {
      // Désactiver le replay de session
      if (Sentry.getReplay()) {
        Sentry.getReplay()?.stop();
      }
      console.log('Sentry Replay désactivé');
    } catch (error) {
      console.warn('Erreur lors de la désactivation du replay Sentry:', error);
    }
  }

  // Obtenir le statut
  getStatus(): { enabled: boolean; initialized: boolean; userConsent: boolean } {
    return {
      enabled: this.config.enabled,
      initialized: this.isInitialized,
      userConsent: this.config.userConsent,
    };
  }

  // Sauvegarder le consentement
  private saveUserConsent(): void {
    try {
      localStorage.setItem('numa_error_reporting_consent', JSON.stringify(this.config.userConsent));
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde du consentement', { error });
    }
  }

  // Charger le consentement
  private loadUserConsent(): void {
    try {
      const stored = localStorage.getItem('numa_error_reporting_consent');
      if (stored !== null) {
        this.config.userConsent = JSON.parse(stored);
      }
    } catch (error) {
      logger.error('Erreur lors du chargement du consentement', { error });
    }
  }

  // Mettre à jour la configuration
  updateConfig(newConfig: Partial<ErrorReportingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.config.userConsent && !this.isInitialized) {
      this.initialize();
    }
  }
}

// Instance globale
export const errorReporter = new ErrorReporter();

// Hook React pour le reporting d'erreurs
export function useErrorReporting() {
  const captureError = (error: Error, context?: Record<string, any>) => {
    errorReporter.captureError(error, context);
  };

  const captureMessage = (message: string, level?: Sentry.SeverityLevel, context?: Record<string, any>) => {
    errorReporter.captureMessage(message, level, context);
  };

  const setUser = (user: { id?: string; email?: string; username?: string }) => {
    errorReporter.setUser(user);
  };

  const setUserConsent = (consent: boolean) => {
    errorReporter.setUserConsent(consent);
  };

  const getStatus = () => {
    return errorReporter.getStatus();
  };

  return {
    captureError,
    captureMessage,
    setUser,
    setUserConsent,
    getStatus,
  };
}

// Fonction utilitaire pour capturer les erreurs non gérées
export function setupGlobalErrorHandling(): void {
  window.addEventListener('error', (event) => {
    errorReporter.captureError(event.error || new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      type: 'unhandled_error',
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    errorReporter.captureError(new Error(event.reason), {
      type: 'unhandled_promise_rejection',
    });
  });
}
