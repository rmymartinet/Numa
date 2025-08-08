// Système de monitoring des métriques pour Numa

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  category: 'performance' | 'user' | 'error' | 'business';
  metadata?: Record<string, any>;
}

interface UserMetric {
  sessionId: string;
  userId?: string;
  pageViews: number;
  timeOnSite: number;
  interactions: number;
  errors: number;
  startTime: number;
}

interface BusinessMetric {
  featureUsage: Record<string, number>;
  conversionEvents: Record<string, number>;
  userSatisfaction: number;
  retentionRate: number;
}

class MetricsTracker {
  private metrics: PerformanceMetric[] = [];
  private userMetrics: UserMetric;
  private businessMetrics: BusinessMetric;
  private sessionId: string;
  private isEnabled: boolean;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isEnabled = process.env.NODE_ENV === 'production';

    this.userMetrics = {
      sessionId: this.sessionId,
      pageViews: 0,
      timeOnSite: 0,
      interactions: 0,
      errors: 0,
      startTime: Date.now(),
    };

    this.businessMetrics = {
      featureUsage: {},
      conversionEvents: {},
      userSatisfaction: 0,
      retentionRate: 0,
    };

    this.initializeTracking();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeTracking(): void {
    if (!this.isEnabled) return;

    // Tracking automatique des métriques de performance
    this.trackPageLoad();
    this.trackUserInteractions();
    this.trackErrors();
    this.trackMemoryUsage();
    this.trackNetworkRequests();
  }

  // Métriques de performance
  trackPageLoad(): void {
    if (!this.isEnabled) return;

    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;

      this.addMetric(
        'page_load_time',
        navigation.loadEventEnd - navigation.loadEventStart,
        'ms',
        'performance'
      );
      this.addMetric(
        'dom_content_loaded',
        navigation.domContentLoadedEventEnd -
          navigation.domContentLoadedEventStart,
        'ms',
        'performance'
      );
      this.addMetric('first_paint', this.getFirstPaint(), 'ms', 'performance');
      this.addMetric(
        'first_contentful_paint',
        this.getFirstContentfulPaint(),
        'ms',
        'performance'
      );
      this.addMetric(
        'largest_contentful_paint',
        this.getLargestContentfulPaint(),
        'ms',
        'performance'
      );
    });
  }

  trackUserInteractions(): void {
    if (!this.isEnabled) return;

    let interactionCount = 0;
    const trackInteraction = () => {
      interactionCount++;
      this.userMetrics.interactions = interactionCount;
      this.addMetric('user_interaction', interactionCount, 'count', 'user');
    };

    // Track clicks, scrolls, keypresses
    document.addEventListener('click', trackInteraction);
    document.addEventListener('scroll', this.debounce(trackInteraction, 1000));
    document.addEventListener('keypress', trackInteraction);
  }

  trackErrors(): void {
    if (!this.isEnabled) return;

    window.addEventListener('error', event => {
      this.userMetrics.errors++;
      this.addMetric('javascript_error', 1, 'count', 'error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    window.addEventListener('unhandledrejection', event => {
      this.userMetrics.errors++;
      this.addMetric('unhandled_promise_rejection', 1, 'count', 'error', {
        reason: event.reason,
      });
    });
  }

  trackMemoryUsage(): void {
    if (!this.isEnabled || !('memory' in performance)) return;

    setInterval(() => {
      const memory = (performance as any).memory;
      this.addMetric(
        'memory_used',
        memory.usedJSHeapSize,
        'bytes',
        'performance'
      );
      this.addMetric(
        'memory_total',
        memory.totalJSHeapSize,
        'bytes',
        'performance'
      );
      this.addMetric(
        'memory_limit',
        memory.jsHeapSizeLimit,
        'bytes',
        'performance'
      );
    }, 30000); // Toutes les 30 secondes
  }

  trackNetworkRequests(): void {
    if (!this.isEnabled) return;

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - startTime;

        this.addMetric(
          'network_request_duration',
          duration,
          'ms',
          'performance',
          {
            url:
              typeof args[0] === 'string' ? args[0] : (args[0] as Request).url,
            method: args[1]?.method || 'GET',
            status: response.status,
          }
        );

        return response;
      } catch (error) {
        const duration = performance.now() - startTime;
        this.addMetric('network_request_error', duration, 'ms', 'error', {
          url: typeof args[0] === 'string' ? args[0] : (args[0] as Request).url,
          error: (error as Error).message,
        });
        throw error;
      }
    };
  }

  // Métriques business
  trackFeatureUsage(featureName: string): void {
    if (!this.isEnabled) return;

    this.businessMetrics.featureUsage[featureName] =
      (this.businessMetrics.featureUsage[featureName] || 0) + 1;
    this.addMetric('feature_usage', 1, 'count', 'business', {
      feature: featureName,
    });
  }

  trackConversionEvent(eventName: string, value: number = 1): void {
    if (!this.isEnabled) return;

    this.businessMetrics.conversionEvents[eventName] =
      (this.businessMetrics.conversionEvents[eventName] || 0) + value;
    this.addMetric('conversion_event', value, 'count', 'business', {
      event: eventName,
    });
  }

  trackUserSatisfaction(score: number): void {
    if (!this.isEnabled) return;

    this.businessMetrics.userSatisfaction = score;
    this.addMetric('user_satisfaction', score, 'score', 'business');
  }

  // Métriques personnalisées
  addMetric(
    name: string,
    value: number,
    unit: string,
    category: PerformanceMetric['category'],
    metadata?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      category,
      metadata,
    };

    this.metrics.push(metric);
    this.flushMetrics();
  }

  // Utilitaires
  private getFirstPaint(): number {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : 0;
  }

  private getFirstContentfulPaint(): number {
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(
      entry => entry.name === 'first-contentful-paint'
    );
    return fcp ? fcp.startTime : 0;
  }

  private getLargestContentfulPaint(): number {
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    const lcp = lcpEntries[lcpEntries.length - 1];
    return lcp ? lcp.startTime : 0;
  }

  private debounce(
    func: (...args: any[]) => void,
    wait: number
  ): (event: Event) => void {
    let timeout: NodeJS.Timeout;
    return function executedFunction(event: Event) {
      const later = () => {
        clearTimeout(timeout);
        func(event);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Envoi des métriques
  private flushMetrics(): void {
    if (this.metrics.length >= 10 || this.shouldFlush()) {
      this.sendMetrics();
    }
  }

  private shouldFlush(): boolean {
    const lastMetric = this.metrics[this.metrics.length - 1];
    return lastMetric && Date.now() - lastMetric.timestamp > 60000; // 1 minute
  }

  private async sendMetrics(): Promise<void> {
    if (this.metrics.length === 0) return;

    const payload = {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      metrics: this.metrics,
      userMetrics: this.userMetrics,
      businessMetrics: this.businessMetrics,
    };

    try {
      await fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Vérifier les alertes avec les nouvelles métriques
      this.checkAlerts(payload);

      this.metrics = []; // Clear sent metrics
    } catch (error) {
      console.error('Failed to send metrics:', error);
    }
  }

  private checkAlerts(metrics: any): void {
    // Importer dynamiquement pour éviter les dépendances circulaires
    import('./alerts')
      .then(({ alertManager }) => {
        alertManager.checkAlerts(metrics);
      })
      .catch(() => {
        // Ignorer si le module n'est pas disponible
      });
  }

  // API publique
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getUserMetrics(): UserMetric {
    return { ...this.userMetrics };
  }

  getBusinessMetrics(): BusinessMetric {
    return { ...this.businessMetrics };
  }

  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }
}

// Instance globale
export const metricsTracker = new MetricsTracker();

// Hook React pour le tracking
export function useMetrics() {
  const trackFeatureUsage = (featureName: string) => {
    metricsTracker.trackFeatureUsage(featureName);
  };

  const trackConversionEvent = (eventName: string, value?: number) => {
    metricsTracker.trackConversionEvent(eventName, value);
  };

  const trackUserSatisfaction = (score: number) => {
    metricsTracker.trackUserSatisfaction(score);
  };

  const addMetric = (
    name: string,
    value: number,
    unit: string,
    category: PerformanceMetric['category'],
    metadata?: Record<string, any>
  ) => {
    metricsTracker.addMetric(name, value, unit, category, metadata);
  };

  return {
    trackFeatureUsage,
    trackConversionEvent,
    trackUserSatisfaction,
    addMetric,
    getMetrics: metricsTracker.getMetrics.bind(metricsTracker),
    getUserMetrics: metricsTracker.getUserMetrics.bind(metricsTracker),
    getBusinessMetrics: metricsTracker.getBusinessMetrics.bind(metricsTracker),
  };
}
