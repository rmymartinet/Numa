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
}

// Valeurs par défaut
const DEFAULT_CONFIG: LoggerConfig = {
  level: 'info',
  maxEntries: 1000,
  enableConsole: true,
  enableStorage: true,
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

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadLogs();
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level];
  }

  private formatMessage(level: LogLevel, message: string, data?: any, context?: string): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `${timestamp} ${level.toUpperCase()}${contextStr}: ${message}${dataStr}`;
  }

  private addLog(level: LogLevel, message: string, data?: any, context?: string): void {
    if (!this.shouldLog(level)) return;

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
      const formattedMessage = this.formatMessage(level, message, data, context);
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
      filtered = filtered.filter(log => LOG_LEVELS[log.level] >= LOG_LEVELS[level]);
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
}

// Instance singleton
export const logger = new Logger();

// Hook React pour utiliser le logger
export const useLogger = (context?: string) => {
  return {
    debug: (message: string, data?: any) => logger.debug(message, data, context),
    info: (message: string, data?: any) => logger.info(message, data, context),
    warn: (message: string, data?: any) => logger.warn(message, data, context),
    error: (message: string, data?: any) => logger.error(message, data, context),
  };
};

// Fonction utilitaire pour logger les erreurs
export const logError = (error: Error, context?: string): void => {
  logger.error(error.message, {
    stack: error.stack,
    name: error.name,
  }, context);
};

// Fonction utilitaire pour logger les performances
export const logPerformance = (operation: string, duration: number, context?: string): void => {
  logger.info(`Performance: ${operation}`, { duration: `${duration}ms` }, context);
}; 