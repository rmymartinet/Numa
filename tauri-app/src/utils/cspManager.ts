// Gestionnaire de Content Security Policy (CSP)
export interface CSPDirective {
  [key: string]: string[];
}

export interface CSPConfig {
  directives: CSPDirective;
  reportOnly?: boolean;
  reportUri?: string;
}

export class CSPManager {
  private static instance: CSPManager;
  private config: CSPConfig;

  private constructor() {
    this.config = this.getDefaultConfig();
  }

  static getInstance(): CSPManager {
    if (!CSPManager.instance) {
      CSPManager.instance = new CSPManager();
    }
    return CSPManager.instance;
  }

  // Configuration CSP par défaut (compatible Tauri)
  private getDefaultConfig(): CSPConfig {
    return {
      directives: {
        'default-src': ["'self'"],
        'img-src': ["'self'", "data:", "blob:"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'script-src': ["'self'", "'unsafe-inline'"],
        'connect-src': [
          "'self'",
          "https://*.sentry.io",
          "https://api.github.com",
          "https://api.openai.com",
          "https://api.anthropic.com"
        ],
        'font-src': ["'self'", "data:"],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'upgrade-insecure-requests': [],
        'worker-src': ["'self'"],
        'child-src': ["'self'"],
        'media-src': ["'self'", "data:", "blob:"],
        'manifest-src': ["'self'"],
        'prefetch-src': ["'self'"],
        'navigate-to': ["'self'"]
      },
      reportOnly: false,
      reportUri: undefined
    };
  }

  // Générer la chaîne CSP
  generateCSP(): string {
    const { directives } = this.config;
    const parts: string[] = [];

    for (const [directive, sources] of Object.entries(directives)) {
      if (sources.length > 0) {
        parts.push(`${directive} ${sources.join(' ')}`);
      }
    }

    if (this.config.reportUri) {
      parts.push(`report-uri ${this.config.reportUri}`);
    }

    return parts.join('; ');
  }

  // Mettre à jour une directive CSP
  updateDirective(directive: string, sources: string[]): void {
    this.config.directives[directive] = sources;
    this.applyCSP();
  }

  // Ajouter une source à une directive
  addSource(directive: string, source: string): void {
    if (!this.config.directives[directive]) {
      this.config.directives[directive] = [];
    }
    
    if (!this.config.directives[directive].includes(source)) {
      this.config.directives[directive].push(source);
      this.applyCSP();
    }
  }

  // Supprimer une source d'une directive
  removeSource(directive: string, source: string): void {
    if (this.config.directives[directive]) {
      this.config.directives[directive] = this.config.directives[directive]
        .filter(s => s !== source);
      this.applyCSP();
    }
  }

  // Appliquer la CSP au document
  private applyCSP(): void {
    const cspString = this.generateCSP();
    const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    
    if (meta) {
      meta.setAttribute('content', cspString);
    } else {
      const newMeta = document.createElement('meta');
      newMeta.setAttribute('http-equiv', 'Content-Security-Policy');
      newMeta.setAttribute('content', cspString);
      document.head.appendChild(newMeta);
    }
  }

  // Activer le mode report-only
  enableReportOnly(reportUri?: string): void {
    this.config.reportOnly = true;
    if (reportUri) {
      this.config.reportUri = reportUri;
    }
    this.applyCSP();
  }

  // Désactiver le mode report-only
  disableReportOnly(): void {
    this.config.reportOnly = false;
    this.config.reportUri = undefined;
    this.applyCSP();
  }

  // Obtenir la configuration actuelle
  getConfig(): CSPConfig {
    return { ...this.config };
  }

  // Réinitialiser à la configuration par défaut
  reset(): void {
    this.config = this.getDefaultConfig();
    this.applyCSP();
  }

  // Vérifier si une URL est autorisée par la CSP
  isAllowed(directive: string, url: string): boolean {
    const sources = this.config.directives[directive];
    if (!sources) return false;

    return sources.some(source => {
      if (source === "'self'") {
        return url.startsWith(window.location.origin);
      }
      if (source === "data:") {
        return url.startsWith("data:");
      }
      if (source === "blob:") {
        return url.startsWith("blob:");
      }
      if (source.includes("*")) {
        const pattern = source.replace("*", ".*");
        return new RegExp(pattern).test(url);
      }
      return url.startsWith(source);
    });
  }

  // Valider une configuration CSP
  validateConfig(config: CSPConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const requiredDirectives = ['default-src'];

    // Vérifier les directives requises
    for (const directive of requiredDirectives) {
      if (!config.directives[directive]) {
        errors.push(`Directive requise manquante: ${directive}`);
      }
    }

    // Vérifier les sources dangereuses
    const dangerousSources = ["'unsafe-eval'", "'unsafe-inline'"];
    for (const [directive, sources] of Object.entries(config.directives)) {
      for (const source of sources) {
        if (dangerousSources.includes(source)) {
          errors.push(`Source dangereuse détectée dans ${directive}: ${source}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Logger les violations CSP
  setupViolationReporting(): void {
    document.addEventListener('securitypolicyviolation', (event) => {
      console.warn('Violation CSP détectée:', {
        directive: event.violatedDirective,
        blockedURI: event.blockedURI,
        sourceFile: event.sourceFile,
        lineNumber: event.lineNumber,
        columnNumber: event.columnNumber
      });

      // Envoyer à Sentry si disponible
      if ((window as any).Sentry) {
        (window as any).Sentry.captureMessage('CSP Violation', {
          level: 'warning',
          extra: {
            directive: event.violatedDirective,
            blockedURI: event.blockedURI,
            sourceFile: event.sourceFile,
            lineNumber: event.lineNumber,
            columnNumber: event.columnNumber
          }
        });
      }
    });
  }
}

// Instance globale
export const cspManager = CSPManager.getInstance();

// Hook React pour la gestion CSP
export function useCSPManager() {
  const updateDirective = (directive: string, sources: string[]) => {
    cspManager.updateDirective(directive, sources);
  };

  const addSource = (directive: string, source: string) => {
    cspManager.addSource(directive, source);
  };

  const removeSource = (directive: string, source: string) => {
    cspManager.removeSource(directive, source);
  };

  const enableReportOnly = (reportUri?: string) => {
    cspManager.enableReportOnly(reportUri);
  };

  const disableReportOnly = () => {
    cspManager.disableReportOnly();
  };

  const reset = () => {
    cspManager.reset();
  };

  const isAllowed = (directive: string, url: string) => {
    return cspManager.isAllowed(directive, url);
  };

  const getConfig = () => {
    return cspManager.getConfig();
  };

  return {
    updateDirective,
    addSource,
    removeSource,
    enableReportOnly,
    disableReportOnly,
    reset,
    isAllowed,
    getConfig,
  };
}

// Initialiser la gestion des violations CSP (temporairement désactivé)
// cspManager.setupViolationReporting();
