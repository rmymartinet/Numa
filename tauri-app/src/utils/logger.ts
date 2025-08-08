import { checkConsent, isDoNotTrackEnabled } from './privacyManager';

// Types pour les niveaux de log
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Interface pour un log entry
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  context?: string;
}

// Configuration du logger
export interface LoggerConfig {
  level: LogLevel;
  maxEntries: number;
  enableConsole: boolean;
  enableStorage: boolean;
  enableBatchSending: boolean;
  batchSize: number;
  batchInterval: number;
  userConsent: boolean;
}

// Valeurs par défaut
const DEFAULT_CONFIG: LoggerConfig = {
  level: 'info',
  maxEntries: 1000,
  enableConsole: true,
  enableStorage: true,
  enableBatchSending: process.env.NODE_ENV === 'production',
  batchSize: 50,
  batchInterval: 30000, // 30 secondes
  userConsent: false,
};

// Mapping des niveaux de priorité
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private config: LoggerConfig;
  private logs: LogEntry[] = [];
  private storageKey = 'numa_logs';
  private batchTimer: NodeJS.Timeout | null = null;
  private pendingLogs: LogEntry[] = [];

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadLogs();
    this.loadUserConsent();
    this.initializeBatchSending();
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level];
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    data?: any,
    context?: string
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `${timestamp} ${level.toUpperCase()}${contextStr}: ${message}${dataStr}`;
  }

  private addLog(
    level: LogLevel,
    message: string,
    data?: any,
    context?: string
  ): void {
    if (!this.shouldLog(level)) return;

    // Vérifier Do Not Track et consentement pour l'envoi réseau
    const canSendNetwork = !isDoNotTrackEnabled() && checkConsent('logging');

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      context,
    };

    this.logs.push(entry);

    // Limiter le nombre d'entrées
    if (this.logs.length > this.config.maxEntries) {
      this.logs = this.logs.slice(-this.config.maxEntries);
    }

    // Console output
    if (this.config.enableConsole) {
      const formattedMessage = this.formatMessage(
        level,
        message,
        data,
        context
      );
      switch (level) {
        case 'debug':
          console.debug(formattedMessage);
          break;
        case 'info':
          console.info(formattedMessage);
          break;
        case 'warn':
          console.warn(formattedMessage);
          break;
        case 'error':
          console.error(formattedMessage);
          break;
      }
    }

    // Storage
    if (this.config.enableStorage) {
      this.saveLogs();
    }

    // Batch sending (production + consentement)
    if (this.config.enableBatchSending && canSendNetwork) {
      this.pendingLogs.push(entry);
      
      // Envoyer immédiatement si on atteint la taille du batch
      if (this.pendingLogs.length >= this.config.batchSize) {
        this.sendBatch();
      }
    }
  }

  private saveLogs(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.logs));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des logs:', error);
    }
  }

  private loadLogs(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.logs = JSON.parse(stored) as LogEntry[];
      }
    } catch (error) {
      console.error('Erreur lors du chargement des logs:', error);
    }
  }

  // Méthodes publiques
  debug(message: string, data?: any, context?: string): void {
    this.addLog('debug', message, data, context);
  }

  info(message: string, data?: any, context?: string): void {
    this.addLog('info', message, data, context);
  }

  warn(message: string, data?: any, context?: string): void {
    this.addLog('warn', message, data, context);
  }

  error(message: string, data?: any, context?: string): void {
    this.addLog('error', message, data, context);
  }

  // Méthodes utilitaires
  getLogs(level?: LogLevel, limit?: number): LogEntry[] {
    let filtered = this.logs;

    if (level) {
      filtered = filtered.filter(
        log => LOG_LEVELS[log.level] >= LOG_LEVELS[level]
      );
    }

    if (limit) {
      filtered = filtered.slice(-limit);
    }

    return filtered;
  }

  clearLogs(): void {
    this.logs = [];
    if (this.config.enableStorage) {
      localStorage.removeItem(this.storageKey);
    }
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  getStats(): { total: number; byLevel: Record<LogLevel, number> } {
    const byLevel: Record<LogLevel, number> = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
    };

    this.logs.forEach(log => {
      byLevel[log.level]++;
    });

    return {
      total: this.logs.length,
      byLevel,
    };
  }

  updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Gérer le consentement utilisateur
  setUserConsent(consent: boolean): void {
    this.config.userConsent = consent;
    this.saveUserConsent();
    this.initializeBatchSending();
  }

  // Désactiver/réactiver l'envoi réseau
  setNetworkOff(off: boolean): void {
    if (off) {
      this.config.enableBatchSending = false;
      this.stopBatchTimer();
      this.info('Envoi réseau des logs désactivé');
    } else {
      this.config.enableBatchSending = true;
      this.initializeBatchSending();
      this.info('Envoi réseau des logs réactivé');
    }
  }

  // Initialiser l'envoi batch
  private initializeBatchSending(): void {
    if (this.config.enableBatchSending && this.config.userConsent) {
      this.startBatchTimer();
    } else {
      this.stopBatchTimer();
    }
  }

  // Démarrer le timer batch
  private startBatchTimer(): void {
    if (this.batchTimer) return;

    this.batchTimer = setInterval(() => {
      this.sendBatch();
    }, this.config.batchInterval);
  }

  // Arrêter le timer batch
  private stopBatchTimer(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
  }

  // Envoyer les logs en batch
  private async sendBatch(): Promise<void> {
    if (this.pendingLogs.length === 0) return;

    const logsToSend = [...this.pendingLogs];
    this.pendingLogs = [];

    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logs: logsToSend,
          timestamp: Date.now(),
          sessionId: this.getSessionId(),
        }),
      });
    } catch (error) {
      // Remettre les logs dans la queue en cas d'échec
      this.pendingLogs.unshift(...logsToSend);
      console.error('Erreur lors de l\'envoi des logs:', error);
    }
  }

  // Obtenir l'ID de session
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('numa_session_id');
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('numa_session_id', sessionId);
    }
    return sessionId;
  }

  // Sauvegarder le consentement
  private saveUserConsent(): void {
    try {
      localStorage.setItem('numa_logging_consent', JSON.stringify(this.config.userConsent));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du consentement:', error);
    }
  }

  // Charger le consentement
  private loadUserConsent(): void {
    try {
      const stored = localStorage.getItem('numa_logging_consent');
      if (stored !== null) {
        this.config.userConsent = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du consentement:', error);
    }
  }
}

// Instance singleton
export const logger = new Logger();

// Hook React pour utiliser le logger
export const useLogger = (context?: string) => {
  return {
    debug: (message: string, data?: any) =>
      logger.debug(message, data, context),
    info: (message: string, data?: any) => logger.info(message, data, context),
    warn: (message: string, data?: any) => logger.warn(message, data, context),
    error: (message: string, data?: any) =>
      logger.error(message, data, context),
  };
};

// Fonction utilitaire pour logger les erreurs
export const logError = (error: Error, context?: string): void => {
  logger.error(
    error.message,
    {
      stack: error.stack,
      name: error.name,
    },
    context
  );
};

// Fonction utilitaire pour logger les performances
export const logPerformance = (
  operation: string,
  duration: number,
  context?: string
): void => {
  logger.info(
    `Performance: ${operation}`,
    { duration: `${duration}ms` },
    context
  );
};
