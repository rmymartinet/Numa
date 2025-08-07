import React, { useCallback, useEffect } from 'react';  

import { useEffect } from "react";

// Error Tracker pour Numa

interface ErrorEvent {
  id: string;
  timestamp: number;
  message: string;
  stack?: string;
  type: 'error' | 'warning' | 'info';
  context: {
    url: string;
    userAgent: string;
    viewport: { width: number; height: number };
    memory?: { used: number; total: number };
    performance?: { loadTime: number; domContentLoaded: number };
  };
  metadata?: Record<string, any>;
}

interface ErrorTrackerConfig {
  maxErrors: number;
  sendToServer: boolean;
  consoleOutput: boolean;
  includeContext: boolean;
  batchSize: number;
  flushInterval: number;
}

class ErrorTracker {
  private errors: ErrorEvent[] = [];
  private config: ErrorTrackerConfig;
  private flushTimer?: NodeJS.Timeout;

  constructor(config: Partial<ErrorTrackerConfig> = {}) {
    this.config = {
      maxErrors: 100,
      sendToServer: false,
      consoleOutput: true,
      includeContext: true,
      batchSize: 10,
      flushInterval: 30000, // 30 secondes
      ...config,
    };

    this.setupGlobalHandlers();
    this.startFlushTimer();
  }

  private setupGlobalHandlers(): void {
    // Intercepter les erreurs JavaScript
    window.addEventListener('error', (event) => {
      this.trackError(event.error || new Error(event.message), {
        type: 'error',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    // Intercepter les promesses rejetées
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(new Error(event.reason), {
        type: 'error',
        metadata: {
          reason: event.reason,
        },
      });
    });

    // Intercepter les erreurs de console
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    console.error = (...args) => {
      this.trackError(new Error(args.join(' ')), { type: 'error' });
      originalConsoleError.apply(console, args);
    };

    console.warn = (...args) => {
      this.trackError(new Error(args.join(' ')), { type: 'warning' });
      originalConsoleWarn.apply(console, args);
    };
  }

  private getContext(): ErrorEvent['context'] {
    const context: ErrorEvent['context'] = {
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };

    if (this.config.includeContext) {
      // Informations sur la mémoire
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        context.memory = {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
        };
      }

      // Informations sur les performances
      if (performance.timing) {
        context.performance = {
          loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
          domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
        };
      }
    }

    return context;
  }

  trackError(error: Error, options: { type: ErrorEvent['type']; metadata?: Record<string, any> } = { type: 'error' }): void {
    const errorEvent: ErrorEvent = {
      id: this.generateId(),
      timestamp: Date.now(),
      message: error.message,
      stack: error.stack,
      type: options.type,
      context: this.getContext(),
      metadata: options.metadata,
    };

    this.errors.push(errorEvent);

    // Limiter le nombre d'erreurs stockées
    if (this.errors.length > this.config.maxErrors) {
      this.errors = this.errors.slice(-this.config.maxErrors);
    }

    // Affichage console
    if (this.config.consoleOutput) {
      console.group(`🚨 Error Tracker - ${options.type.toUpperCase()}`);
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
      console.error('Context:', errorEvent.context);
      if (options.metadata) {
        console.error('Metadata:', options.metadata);
      }
      console.groupEnd();
    }

    // Envoi immédiat si critique
    if (options.type === 'error' && this.config.sendToServer) {
      this.sendToServer([errorEvent]);
    }
  }

  trackWarning(message: string, metadata?: Record<string, any>): void {
    this.trackError(new Error(message), { type: 'warning', metadata });
  }

  trackInfo(message: string, metadata?: Record<string, any>): void {
    this.trackError(new Error(message), { type: 'info', metadata });
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async sendToServer(errors: ErrorEvent[]): Promise<void> {
    try {
      // Ici, vous pouvez implémenter l'envoi vers votre service de tracking
      // Par exemple, Sentry, LogRocket, ou votre propre API
      const response = await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ errors }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to send errors to server:', error);
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  flush(): void {
    if (this.errors.length === 0 || !this.config.sendToServer) {
      return;
    }

    const errorsToSend = this.errors.splice(0, this.config.batchSize);
    this.sendToServer(errorsToSend);
  }

  getErrors(): ErrorEvent[] {
    return [...this.errors];
  }

  clearErrors(): void {
    this.errors = [];
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

// Instance globale
export const errorTracker = new ErrorTracker({
  sendToServer: process.env.NODE_ENV === 'production',
  consoleOutput: process.env.NODE_ENV === 'development',
});

// Hook React pour le tracking d'erreurs
export function useErrorTracking() {
  const trackError = useCallback((error: Error, metadata?: Record<string, any>) => {
    errorTracker.trackError(error, { type: 'error', metadata });
  }, []);

  const trackWarning = useCallback((message: string, metadata?: Record<string, any>) => {
    errorTracker.trackWarning(message, metadata);
  }, []);

  const trackInfo = useCallback((message: string, metadata?: Record<string, any>) => {
    errorTracker.trackInfo(message, metadata);
  }, []);

  return {
    trackError,
    trackWarning,
    trackInfo,
  };
}

// Wrapper pour les composants React
export function withErrorTracking<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function ErrorTrackedComponent(props: P) {
    const { trackError } = useErrorTracking();

    useEffect(() => {
      const handleError = (error: ErrorEvent) => {
        trackError(new Error(error.message), {
          component: Component.name,
          props: Object.keys(props),
        });
      };

      window.addEventListener('error', handleError as any);
      return () => window.removeEventListener('error', handleError as any);
    }, [trackError, props]);

    return React.createElement(Component, props);
  };
}
