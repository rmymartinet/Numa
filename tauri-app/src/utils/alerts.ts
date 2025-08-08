// Système d'alertes pour métriques critiques
import React from 'react';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  category: 'performance' | 'error' | 'business' | 'user';
  severity: 'low' | 'medium' | 'high' | 'critical';
  condition: (metrics: any) => boolean;
  threshold: number;
  unit: string;
  cooldown: number; // Temps en ms avant nouvelle alerte
  actions: AlertAction[];
  enabled: boolean;
}

export interface AlertAction {
  type: 'notification' | 'log' | 'api_call' | 'email' | 'slack';
  config: Record<string, any>;
}

export interface Alert {
  id: string;
  ruleId: string;
  timestamp: number;
  severity: AlertRule['severity'];
  message: string;
  value: number;
  threshold: number;
  unit: string;
  metadata?: Record<string, any>;
  acknowledged: boolean;
  resolved: boolean;
}

export interface AlertNotification {
  id: string;
  title: string;
  message: string;
  severity: AlertRule['severity'];
  timestamp: number;
  actions?: string[];
}

class AlertManager {
  private alerts: Alert[] = [];
  private rules: AlertRule[] = [];
  private notifications: AlertNotification[] = [];
  private lastAlertTimes: Map<string, number> = new Map();
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production';
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    // Règles de performance
    this.addRule({
      id: 'high-memory-usage',
      name: 'Utilisation mémoire élevée',
      description: "L'utilisation mémoire dépasse 80% de la limite",
      category: 'performance',
      severity: 'high',
      threshold: 80,
      unit: '%',
      cooldown: 60000, // 1 minute
      condition: _metrics => {
        const memory = (performance as any).memory;
        if (!memory) return false;
        const usagePercent =
          (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        return usagePercent > 80;
      },
      actions: [
        {
          type: 'notification',
          config: {
            title: 'Mémoire élevée',
            message: "L'utilisation mémoire est critique",
          },
        },
        { type: 'log', config: { level: 'warn' } },
      ],
      enabled: true,
    });

    this.addRule({
      id: 'slow-page-load',
      name: 'Chargement de page lent',
      description: 'Le temps de chargement dépasse 3 secondes',
      category: 'performance',
      severity: 'medium',
      threshold: 3000,
      unit: 'ms',
      cooldown: 30000, // 30 secondes
      condition: _metrics => {
        const navigation = performance.getEntriesByType(
          'navigation'
        )[0] as PerformanceNavigationTiming;
        return navigation.loadEventEnd - navigation.loadEventStart > 3000;
      },
      actions: [
        {
          type: 'notification',
          config: {
            title: 'Chargement lent',
            message: 'La page met trop de temps à charger',
          },
        },
      ],
      enabled: true,
    });

    this.addRule({
      id: 'high-error-rate',
      name: "Taux d'erreur élevé",
      description: 'Plus de 5 erreurs JavaScript en 1 minute',
      category: 'error',
      severity: 'critical',
      threshold: 5,
      unit: 'errors/min',
      cooldown: 120000, // 2 minutes
      condition: _metrics => {
        const recentErrors = this.alerts.filter(
          alert =>
            alert.ruleId === 'javascript-error' &&
            Date.now() - alert.timestamp < 60000
        );
        return recentErrors.length > 5;
      },
      actions: [
        {
          type: 'notification',
          config: {
            title: 'Erreurs critiques',
            message: "Trop d'erreurs JavaScript détectées",
          },
        },
        { type: 'api_call', config: { url: '/api/alerts', method: 'POST' } },
      ],
      enabled: true,
    });

    this.addRule({
      id: 'low-user-satisfaction',
      name: 'Satisfaction utilisateur faible',
      description: 'Score de satisfaction inférieur à 6/10',
      category: 'business',
      severity: 'high',
      threshold: 6,
      unit: '/10',
      cooldown: 300000, // 5 minutes
      condition: _metrics => {
        return false; // Placeholder - sera implémenté avec les vraies métriques
      },
      actions: [
        {
          type: 'notification',
          config: {
            title: 'Satisfaction faible',
            message: 'Les utilisateurs ne sont pas satisfaits',
          },
        },
        { type: 'slack', config: { channel: '#alerts' } },
      ],
      enabled: true,
    });

    this.addRule({
      id: 'feature-usage-drop',
      name: "Baisse d'utilisation des features",
      description: 'Utilisation des features en baisse de 50%',
      category: 'business',
      severity: 'medium',
      threshold: 50,
      unit: '%',
      cooldown: 600000, // 10 minutes
      condition: _metrics => {
        // Comparer avec les métriques précédentes
        return false; // Placeholder - sera implémenté avec les vraies métriques
      },
      actions: [
        {
          type: 'notification',
          config: {
            title: 'Usage en baisse',
            message: "L'utilisation des features a diminué",
          },
        },
      ],
      enabled: true,
    });

    this.addRule({
      id: 'network-timeout',
      name: 'Timeout réseau',
      description: 'Requêtes réseau prennent plus de 10 secondes',
      category: 'performance',
      severity: 'high',
      threshold: 10000,
      unit: 'ms',
      cooldown: 30000,
      condition: _metrics => {
        return false; // Placeholder - sera implémenté avec les vraies métriques
      },
      actions: [
        {
          type: 'notification',
          config: {
            title: 'Timeout réseau',
            message: 'Les requêtes réseau sont lentes',
          },
        },
        { type: 'log', config: { level: 'error' } },
      ],
      enabled: true,
    });

    this.addRule({
      id: 'memory-leak',
      name: 'Fuite mémoire détectée',
      description: 'Augmentation mémoire de plus de 100% en 5 minutes',
      category: 'performance',
      severity: 'critical',
      threshold: 100,
      unit: '%',
      cooldown: 300000, // 5 minutes
      condition: _metrics => {
        const memoryHistory = this.getMemoryHistory();
        if (memoryHistory.length < 2) return false;

        const recent = memoryHistory[memoryHistory.length - 1];
        const older = memoryHistory[0];
        const increase = ((recent - older) / older) * 100;

        return increase > 100;
      },
      actions: [
        {
          type: 'notification',
          config: { title: 'Fuite mémoire', message: 'Fuite mémoire détectée' },
        },
        {
          type: 'api_call',
          config: { url: '/api/alerts/memory-leak', method: 'POST' },
        },
      ],
      enabled: true,
    });
  }

  addRule(rule: AlertRule): void {
    this.rules.push(rule);
  }

  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
  }

  checkAlerts(metrics: any): void {
    if (!this.isEnabled) return;

    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      // Vérifier le cooldown
      const lastAlertTime = this.lastAlertTimes.get(rule.id) || 0;
      if (Date.now() - lastAlertTime < rule.cooldown) continue;

      // Vérifier la condition
      if (rule.condition(metrics)) {
        this.triggerAlert(rule, metrics);
      }
    }
  }

  private triggerAlert(rule: AlertRule, metrics: any): void {
    const alert: Alert = {
      id: `${rule.id}-${Date.now()}`,
      ruleId: rule.id,
      timestamp: Date.now(),
      severity: rule.severity,
      message: rule.description,
      value: this.calculateValue(rule, metrics),
      threshold: rule.threshold,
      unit: rule.unit,
      metadata: { metrics },
      acknowledged: false,
      resolved: false,
    };

    this.alerts.push(alert);
    this.lastAlertTimes.set(rule.id, Date.now());

    // Exécuter les actions
    this.executeActions(rule.actions, alert);
  }

  private calculateValue(rule: AlertRule, _metrics: any): number {
    switch (rule.id) {
      case 'high-memory-usage':
        const memory = (performance as any).memory;
        return memory
          ? (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
          : 0;

      case 'slow-page-load':
        const navigation = performance.getEntriesByType(
          'navigation'
        )[0] as PerformanceNavigationTiming;
        return navigation.loadEventEnd - navigation.loadEventStart;

      case 'high-error-rate':
        return this.alerts.filter(
          alert =>
            alert.ruleId === 'javascript-error' &&
            Date.now() - alert.timestamp < 60000
        ).length;

      default:
        return 0;
    }
  }

  private executeActions(actions: AlertAction[], alert: Alert): void {
    for (const action of actions) {
      switch (action.type) {
        case 'notification':
          this.showNotification(
            action.config.title,
            action.config.message,
            alert.severity
          );
          break;

        case 'log':
          const level = action.config.level || 'warn';
          if (level === 'warn') {
            console.warn(`[ALERT] ${alert.message}`, alert);
          } else if (level === 'error') {
            console.error(`[ALERT] ${alert.message}`, alert);
          } else {
            console.log(`[ALERT] ${alert.message}`, alert);
          }
          break;

        case 'api_call':
          this.sendApiAlert(action.config, alert);
          break;

        case 'email':
          this.sendEmailAlert(action.config, alert);
          break;

        case 'slack':
          this.sendSlackAlert(action.config, alert);
          break;
      }
    }
  }

  private showNotification(
    title: string,
    message: string,
    severity: AlertRule['severity']
  ): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/icon.png',
        tag: 'numa-alert',
      });
    }

    // Notification dans l'app
    const notification: AlertNotification = {
      id: `notification-${Date.now()}`,
      title,
      message,
      severity,
      timestamp: Date.now(),
      actions: ['Acknowledger', 'Ignorer'],
    };

    this.notifications.push(notification);
    this.emitNotificationEvent(notification);
  }

  private sendApiAlert(config: Record<string, any>, alert: Alert): void {
    fetch(config.url, {
      method: config.method || 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert),
    }).catch(error => {
      console.error('Failed to send API alert:', error);
    });
  }

  private sendEmailAlert(config: Record<string, any>, alert: Alert): void {
    // Implémentation pour envoi d'email
    console.log('Email alert:', config, alert);
  }

  private sendSlackAlert(config: Record<string, any>, alert: Alert): void {
    // Implémentation pour Slack
    console.log('Slack alert:', config, alert);
  }

  private emitNotificationEvent(notification: AlertNotification): void {
    window.dispatchEvent(
      new CustomEvent('numa-alert', { detail: notification })
    );
  }

  private getMemoryHistory(): number[] {
    // Logique pour récupérer l'historique mémoire
    return [];
  }

  // API publique
  getAlerts(): Alert[] {
    return [...this.alerts];
  }

  getNotifications(): AlertNotification[] {
    return [...this.notifications];
  }

  getRules(): AlertRule[] {
    return [...this.rules];
  }

  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
    }
  }

  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
  }

  clearNotifications(): void {
    this.notifications = [];
  }

  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }
}

// Instance globale
export const alertManager = new AlertManager();

// Hook React pour les alertes
export function useAlerts() {
  const [alerts, setAlerts] = React.useState(alertManager.getAlerts());
  const [notifications, setNotifications] = React.useState(
    alertManager.getNotifications()
  );

  React.useEffect(() => {
    const handleAlert = (event: CustomEvent) => {
      setNotifications(prev => [...prev, event.detail]);
    };

    window.addEventListener('numa-alert', handleAlert as EventListener);
    return () =>
      window.removeEventListener('numa-alert', handleAlert as EventListener);
  }, []);

  const acknowledgeAlert = (alertId: string) => {
    alertManager.acknowledgeAlert(alertId);
    setAlerts(alertManager.getAlerts());
  };

  const resolveAlert = (alertId: string) => {
    alertManager.resolveAlert(alertId);
    setAlerts(alertManager.getAlerts());
  };

  const clearNotifications = () => {
    alertManager.clearNotifications();
    setNotifications([]);
  };

  return {
    alerts,
    notifications,
    acknowledgeAlert,
    resolveAlert,
    clearNotifications,
    rules: alertManager.getRules(),
  };
}
