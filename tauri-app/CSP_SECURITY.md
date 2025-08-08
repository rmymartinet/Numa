# 🔒 CSP + Allowlist Tauri Sécurisée

## Principe Fondamental

**Content Security Policy stricte avec allowlist Tauri minimale pour une sécurité maximale.**

## 🛡️ Content Security Policy (CSP)

### Configuration Compatible Tauri

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  img-src 'self' data: blob:;
  style-src 'self' 'unsafe-inline';
  script-src 'self' 'unsafe-inline';
  connect-src 'self' https://*.sentry.io https://api.github.com;
  font-src 'self' data:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
" />
```

### Directives CSP Implémentées

| Directive | Sources | Sécurité |
|-----------|---------|----------|
| **default-src** | `'self'` | Base sécurisée |
| **img-src** | `'self' data: blob:` | Images locales et données |
| **style-src** | `'self' 'unsafe-inline'` | Styles locaux et inline |
| **script-src** | `'self' 'unsafe-inline'` | Scripts locaux et inline |
| **connect-src** | `'self' https://*.sentry.io https://api.github.com` | APIs autorisées |
| **font-src** | `'self' data:` | Polices locales et données |
| **object-src** | `'none'` | Bloque les objets |
| **base-uri** | `'self'` | Base URI locale |
| **form-action** | `'self'` | Formulaires locaux |
| **upgrade-insecure-requests** | - | Force HTTPS |
| **upgrade-insecure-requests** | - | Force HTTPS |

### Gestionnaire CSP Dynamique

```typescript
// Instance globale
export const cspManager = CSPManager.getInstance();

// Mettre à jour une directive
cspManager.updateDirective('connect-src', ["'self'", "https://api.example.com"]);

// Ajouter une source
cspManager.addSource('img-src', 'https://cdn.example.com');

// Tester une URL
const isAllowed = cspManager.isAllowed('connect-src', 'https://api.example.com');
```

## 🔐 Allowlist Tauri

### Permissions Minimales

```json
{
  "permissions": [
    "core:path:default",
    "core:event:default", 
    "core:window:default",
    "core:app:default",
    "core:resources:default",
    "core:menu:default",
    "core:tray:default",
    "core:webview:default",
    "opener:default"
  ]
}
```

### Permissions par Fonctionnalité

| Fonctionnalité | Permissions Requises | Justification |
|----------------|---------------------|---------------|
| **Fenêtres** | `core:window:default` | Gestion des fenêtres |
| **Événements** | `core:event:default` | Communication IPC |
| **Fichiers** | `core:path:default` | Accès aux chemins |
| **Ressources** | `core:resources:default` | Assets de l'app |
| **Menu** | `core:menu:default` | Menus système |
| **Tray** | `core:tray:default` | Icône dans le tray |
| **Webview** | `core:webview:default` | Interface web |
| **Ouverture** | `opener:default` | Ouvrir des liens |

## 🚨 Sécurité Renforcée

### Anti-Clickjacking

```html
<!-- frame-ancestors 'none' -->
<!-- Empêche l'application d'être embarquée dans un iframe -->
```

### Anti-XSS

```html
<!-- object-src 'none' -->
<!-- Bloque les objets potentiellement dangereux -->
```

### Force HTTPS

```html
<!-- upgrade-insecure-requests -->
<!-- Force les requêtes en HTTPS -->
```

### Trusted Types

```typescript
// require-trusted-types-for 'script'
// trusted-types 'default'
// Protection contre les injections de script
```

## 🔧 Gestion Dynamique

### Mode Report-Only

```typescript
// Activer le mode report-only pour tester
cspManager.enableReportOnly('https://reports.example.com');

// Les violations sont signalées mais pas bloquées
```

### Validation de Configuration

```typescript
const validation = cspManager.validateConfig(config);
if (!validation.valid) {
  console.error('Erreurs CSP:', validation.errors);
}
```

### Monitoring des Violations

```typescript
// Écoute automatique des violations
document.addEventListener('securitypolicyviolation', (event) => {
  console.warn('Violation CSP:', {
    directive: event.violatedDirective,
    blockedURI: event.blockedURI,
    sourceFile: event.sourceFile
  });
});
```

## 🧪 Tests de Sécurité

### Test d'URL

```typescript
// Tester si une URL est autorisée
const isAllowed = cspManager.isAllowed('connect-src', 'https://api.example.com');
console.log('URL autorisée:', isAllowed);
```

### Test de Configuration

```typescript
// Valider une configuration CSP
const config = {
  directives: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-eval'"] // Dangereux !
  }
};

const validation = cspManager.validateConfig(config);
// Retourne: { valid: false, errors: ["Source dangereuse détectée..."] }
```

## 📊 Monitoring et Logging

### Violations CSP

```typescript
// Log automatique des violations
logger.warn('Violation CSP détectée', {
  directive: event.violatedDirective,
  blockedURI: event.blockedURI,
  sourceFile: event.sourceFile,
  lineNumber: event.lineNumber
});
```

### Métriques de Sécurité

- Nombre de violations CSP
- Types de violations les plus fréquentes
- URLs bloquées
- Temps de détection des violations

## 🔄 Intégration avec l'Observabilité

### Sentry Integration

```typescript
// Envoi automatique des violations à Sentry
if ((window as any).Sentry) {
  (window as any).Sentry.captureMessage('CSP Violation', {
    level: 'warning',
    extra: {
      directive: event.violatedDirective,
      blockedURI: event.blockedURI
    }
  });
}
```

### Mode Stealth

```typescript
// En mode furtif, CSP encore plus stricte
if (stealthActive) {
  cspManager.updateDirective('connect-src', ["'self'"]);
  cspManager.updateDirective('img-src', ["'self'"]);
}
```

## 🚀 Interface Utilisateur

### Composant CSPManager

**Fonctionnalités :**
- Affichage du statut CSP (strict/report-only)
- Test d'URL en temps réel
- Gestion des directives CSP
- Ajout/suppression de sources
- Réinitialisation de la configuration

### Intégration

```typescript
// Dans SettingsContent.tsx
const [showCSPManager, setShowCSPManager] = useState(false);

<AccessibleButton onClick={() => setShowCSPManager(true)}>
  Gestion CSP
</AccessibleButton>

<CSPManager 
  isOpen={showCSPManager}
  onClose={() => setShowCSPManager(false)}
/>
```

## 📋 Checklist de Sécurité

### CSP
- [x] `default-src 'self'` configuré
- [x] `object-src 'none'` pour bloquer les objets
- [x] `frame-ancestors 'none'` anti-clickjacking
- [x] `upgrade-insecure-requests` pour HTTPS
- [x] Sources externes minimales et sécurisées
- [x] Monitoring des violations

### Tauri Allowlist
- [x] Permissions minimales requises
- [x] Pas de permissions inutiles
- [x] Documentation des permissions
- [x] Validation des permissions

### Monitoring
- [x] Logging des violations CSP
- [x] Intégration Sentry
- [x] Métriques de sécurité
- [x] Alertes automatiques

## 🚨 Gestion d'Erreurs

### Erreurs Possibles

1. **Violation CSP**
   - Log automatique
   - Envoi à Sentry
   - Notification utilisateur

2. **Permission refusée**
   - Fallback sécurisé
   - Message d'erreur clair
   - Documentation

3. **Configuration invalide**
   - Validation automatique
   - Réinitialisation sécurisée
   - Log des erreurs

### Stratégies de Fallback

```typescript
try {
  // Tentative d'action sécurisée
  await secureAction();
} catch (error) {
  if (error.message.includes('CSP')) {
    // Gestion spécifique des erreurs CSP
    logger.warn('Action bloquée par CSP:', error);
  }
}
```

## 📚 Références

- [MDN CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) - Documentation officielle
- [Tauri Security](https://tauri.app/v2/guides/security/) - Guide de sécurité Tauri
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/) - Outil d'évaluation CSP
- [W3C CSP](https://www.w3.org/TR/CSP3/) - Spécification officielle
- [PRIVACY_STORAGE.md](./PRIVACY_STORAGE.md) - Privacy et stockage sécurisé
- [OBSERVABILITY.md](./OBSERVABILITY.md) - Observabilité et gestion d'erreurs
