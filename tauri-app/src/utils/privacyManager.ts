// Gestionnaire de confidentialité avec respect de Do Not Track
export interface PrivacyConsent {
  errorReporting: boolean;
  logging: boolean;
  metrics: boolean;
  analytics: boolean;
  marketing: boolean;
}

export interface PrivacySettings {
  doNotTrack: boolean;
  consent: PrivacyConsent;
  lastUpdated: string;
  version: string;
}

export class PrivacyManager {
  private static instance: PrivacyManager;
  private settings: PrivacySettings;
  private readonly STORAGE_KEY = 'numa_privacy_settings';
  private readonly VERSION = '1.0.0';

  private constructor() {
    this.settings = this.loadSettings();
    this.checkDoNotTrack();
  }

  static getInstance(): PrivacyManager {
    if (!PrivacyManager.instance) {
      PrivacyManager.instance = new PrivacyManager();
    }
    return PrivacyManager.instance;
  }

  // Vérifier et respecter Do Not Track
  private checkDoNotTrack(): void {
    const doNotTrack = this.isDoNotTrackEnabled();
    
    if (doNotTrack && this.settings.doNotTrack !== doNotTrack) {
      console.log('Do Not Track détecté - désactivation de tous les consentements');
      this.settings.doNotTrack = true;
      this.settings.consent = {
        errorReporting: false,
        logging: false,
        metrics: false,
        analytics: false,
        marketing: false,
      };
      this.saveSettings();
    }
  }

  // Vérifier si Do Not Track est activé
  private isDoNotTrackEnabled(): boolean {
    // Vérifier navigator.doNotTrack
    if (navigator.doNotTrack === '1') {
      return true;
    }

    // Vérifier les en-têtes HTTP (pour les requêtes futures)
    if (navigator.doNotTrack === 'yes') {
      return true;
    }

    // Vérifier les préférences utilisateur dans le navigateur
    if (navigator.doNotTrack === '1' || navigator.doNotTrack === 'yes') {
      return true;
    }

    // Vérifier les cookies de préférence (si disponibles)
    const dntCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('DNT='));
    
    if (dntCookie && dntCookie.split('=')[1] === '1') {
      return true;
    }

    return false;
  }

  // Charger les paramètres de confidentialité
  private loadSettings(): PrivacySettings {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Vérifier la version et migrer si nécessaire
        if (parsed.version === this.VERSION) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Erreur lors du chargement des paramètres de confidentialité:', error);
    }

    // Paramètres par défaut
    return {
      doNotTrack: false,
      consent: {
        errorReporting: false,
        logging: false,
        metrics: false,
        analytics: false,
        marketing: false,
      },
      lastUpdated: new Date().toISOString(),
      version: this.VERSION,
    };
  }

  // Sauvegarder les paramètres de confidentialité
  private saveSettings(): void {
    try {
      this.settings.lastUpdated = new Date().toISOString();
      this.settings.version = this.VERSION;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres de confidentialité:', error);
    }
  }

  // Obtenir le consentement actuel
  getConsent(): PrivacyConsent {
    return { ...this.settings.consent };
  }

  // Mettre à jour le consentement
  updateConsent(consent: Partial<PrivacyConsent>): void {
    // Vérifier Do Not Track avant de mettre à jour
    if (this.isDoNotTrackEnabled()) {
      console.warn('Do Not Track est activé - impossible de modifier le consentement');
      return;
    }

    this.settings.consent = {
      ...this.settings.consent,
      ...consent,
    };

    this.saveSettings();
  }

  // Vérifier si un type de consentement est donné
  hasConsent(type: keyof PrivacyConsent): boolean {
    // Si Do Not Track est activé, aucun consentement
    if (this.settings.doNotTrack) {
      return false;
    }

    return this.settings.consent[type] || false;
  }

  // Vérifier si Do Not Track est activé
  isDoNotTrackActive(): boolean {
    return this.settings.doNotTrack;
  }

  // Réinitialiser tous les consentements
  resetConsent(): void {
    this.settings.consent = {
      errorReporting: false,
      logging: false,
      metrics: false,
      analytics: false,
      marketing: false,
    };
    this.saveSettings();
  }

  // Obtenir les paramètres complets
  getSettings(): PrivacySettings {
    return { ...this.settings };
  }

  // Exporter les paramètres (pour debug/audit)
  exportSettings(): string {
    return JSON.stringify(this.settings, null, 2);
  }

  // Importer les paramètres (pour migration)
  importSettings(settings: PrivacySettings): void {
    if (settings.version === this.VERSION) {
      this.settings = settings;
      this.saveSettings();
    } else {
      console.warn('Version des paramètres incompatible');
    }
  }

  // Nettoyer toutes les données de confidentialité
  clearAllData(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      // Nettoyer aussi les anciennes clés de consentement
      localStorage.removeItem('numa_error_reporting_consent');
      localStorage.removeItem('numa_logging_consent');
      localStorage.removeItem('numa_metrics_consent');
      localStorage.removeItem('numa_analytics_consent');
      localStorage.removeItem('numa_marketing_consent');
    } catch (error) {
      console.error('Erreur lors du nettoyage des données de confidentialité:', error);
    }
  }

  // Écouter les changements de Do Not Track
  startDoNotTrackListener(): void {
    // Vérifier périodiquement les changements de Do Not Track
    setInterval(() => {
      const currentDoNotTrack = this.isDoNotTrackEnabled();
      if (currentDoNotTrack !== this.settings.doNotTrack) {
        console.log('Changement de Do Not Track détecté');
        this.checkDoNotTrack();
      }
    }, 30000); // Vérifier toutes les 30 secondes
  }
}

// Instance globale
export const privacyManager = PrivacyManager.getInstance();

// Hook React pour la gestion de la confidentialité
export function usePrivacyManager() {
  const getConsent = () => {
    return privacyManager.getConsent();
  };

  const updateConsent = (consent: Partial<PrivacyConsent>) => {
    privacyManager.updateConsent(consent);
  };

  const hasConsent = (type: keyof PrivacyConsent) => {
    return privacyManager.hasConsent(type);
  };

  const isDoNotTrackActive = () => {
    return privacyManager.isDoNotTrackActive();
  };

  const resetConsent = () => {
    privacyManager.resetConsent();
  };

  const clearAllData = () => {
    privacyManager.clearAllData();
  };

  return {
    getConsent,
    updateConsent,
    hasConsent,
    isDoNotTrackActive,
    resetConsent,
    clearAllData,
  };
}

// Fonction utilitaire pour vérifier le consentement rapidement
export function checkConsent(type: keyof PrivacyConsent): boolean {
  return privacyManager.hasConsent(type);
}

// Fonction utilitaire pour vérifier Do Not Track rapidement
export function isDoNotTrackEnabled(): boolean {
  return privacyManager.isDoNotTrackActive();
}
