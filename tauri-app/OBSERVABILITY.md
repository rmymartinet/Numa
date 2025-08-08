# Observabilité et Gestion d'Erreurs

Ce document décrit le système d'observabilité complet de Numa, incluant la gestion d'erreurs, le logging et les métriques.

## 🚀 Améliorations Récentes

### Initialisation Robuste

L'initialisation de l'observabilité a été améliorée pour être plus robuste et éviter les conflits avec le rendu des fenêtres Tauri :

- **Basée sur les événements** : Écoute `app-ready` puis `tauri://ready` avec fallbacks
- **requestIdleCallback** : N'interfère pas avec le thread principal
- **Import conditionnel** : Sentry et métriques chargés seulement si consentement donné
- **Gestion d'erreurs** : Fallbacks multiples garantissent l'initialisation

### 🔒 Règles de Stealth & Observabilité

**Sécurité renforcée** : L'observabilité s'adapte automatiquement au mode furtif :

- **Mode furtif actif** : Désactivation complète de l'observabilité avancée
  - Sentry Replay désactivé
  - Métriques désactivées (sampling rate = 0)
  - Envoi réseau des logs désactivé
- **Mode furtif inactif** : Réactivation selon le consentement utilisateur
- **Écoute en temps réel** : Réagit automatiquement aux changements de mode

Voir `OBSERVABILITY_IMPROVEMENTS.md` pour plus de détails.

## Architecture

### 🔒 Règles de Sécurité Stealth

**Principe** : Quand le mode furtif est actif, l'observabilité est réduite au strict minimum pour éviter toute fuite d'informations.

#### Guard Global Automatique

```typescript
// Dans useStealthObservability.ts
if (stealthActive) {
  disableReplay();           // Désactiver Sentry Replay
  metricsTracker.setSamplingRate(0);  // Pas de métriques
  logger.setNetworkOff(true);         // Pas d'envoi réseau
}
```

#### Comportements par Mode

| Mode | Sentry Replay | Métriques | Logs Réseau | Capture Écran | PII |
|------|---------------|-----------|-------------|---------------|-----|
| **Normal** | ✅ Consentement | ✅ Consentement | ✅ Consentement | ✅ Consentement | ✅ Consentement |
| **Stealth** | ❌ Désactivé | ❌ Désactivé | ❌ Désactivé | ❌ Désactivé | ❌ Désactivé |

#### Événements Écoutés

- `stealth-activated` : Désactive immédiatement l'observabilité
- `stealth-deactivated` : Réactive selon le consentement utilisateur

### 1. Error Reporting (Sentry)

**Fichier** : `src/utils/errorReporting.ts`

**Fonctionnalités** :
- Capture automatique des erreurs JavaScript non gérées
- Capture des erreurs React via ErrorBoundary
- Filtrage des données sensibles (mots de passe, tokens)
- Consentement utilisateur configurable
- Replay de session pour le débogage
- Sampling configurable (10% par défaut)

**Configuration** :
```typescript
// Variables d'environnement
VITE_SENTRY_DSN=your_sentry_dsn
NODE_ENV=production
```

**Utilisation** :
```typescript
import { useErrorReporting } from '../utils/errorReporting';

const { captureError, setUserConsent } = useErrorReporting();

// Capturer une erreur
captureError(new Error('Erreur personnalisée'), {
  component: 'MonComposant',
  userId: '123'
});

// Gérer le consentement
setUserConsent(true);
```

### 2. Logging Avancé

**Fichier** : `src/utils/logger.ts`

**Fonctionnalités** :
- Niveaux de log : debug, info, warn, error
- Horodatage ISO automatique
- Stockage local avec limite configurable
- Envoi batch en production (avec consentement)
- Contexte et métadonnées
- Session ID pour le suivi

**Configuration** :
```typescript
const logger = new Logger({
  level: 'info',
  maxEntries: 1000,
  enableBatchSending: true,
  batchSize: 50,
  batchInterval: 30000, // 30 secondes
  userConsent: false
});
```

**Utilisation** :
```typescript
import { useLogger } from '../utils/logger';

const { debug, info, warn, error } = useLogger('MonComposant');

info('Action utilisateur', { action: 'click', button: 'submit' });
error('Erreur de validation', { field: 'email', value: 'invalid' });
```

### 3. Métriques et Analytics

**Fichier** : `src/utils/metrics.ts`

**Fonctionnalités** :
- Métriques de performance automatiques
- Tracking des interactions utilisateur
- Métriques business (usage des fonctionnalités)
- Sampling rate configurable
- Consentement utilisateur
- Envoi batch optimisé

**Métriques automatiques** :
- Temps de chargement de page
- First Paint / First Contentful Paint
- Largest Contentful Paint
- Utilisation mémoire
- Requêtes réseau
- Erreurs JavaScript

**Utilisation** :
```typescript
import { useMetrics } from '../utils/metrics';

const { trackFeatureUsage, addMetric } = useMetrics();

// Tracking d'usage
trackFeatureUsage('stealth_mode');

// Métrique personnalisée
addMetric('custom_action', 150, 'ms', 'performance', {
  action: 'ocr_processing'
});
```

## Gestion du Consentement

### Composant PrivacyConsent

**Fichier** : `src/components/PrivacyConsent.tsx`

**Fonctionnalités** :
- Interface utilisateur pour gérer les préférences
- Sauvegarde automatique dans localStorage
- Intégration avec tous les systèmes d'observabilité
- Design responsive et accessible

**Intégration** :
- Ajouté dans les paramètres (onglet "Privacy & Analytics")
- Modal avec options granulaires
- Explications claires pour chaque type de collecte

## Configuration

### Variables d'Environnement

```bash
# Sentry
VITE_SENTRY_DSN=your_sentry_dsn

# Application
VITE_APP_VERSION=1.0.0
NODE_ENV=production
```

### Initialisation

**Fichier** : `src/main.tsx`

```typescript
// Initialiser l'observabilité
logger.info('Application démarrée', { 
  version: process.env.VITE_APP_VERSION || 'dev',
  environment: process.env.NODE_ENV 
});

// Initialiser le reporting d'erreurs
errorReporter.initialize();
setupGlobalErrorHandling();

// Initialiser les métriques
metricsTracker.setSamplingRate(0.1); // 10% des sessions
```

## Sécurité et Confidentialité

### Filtrage des Données Sensibles

**Sentry** :
- Filtrage automatique des mots de passe, tokens, secrets
- Masquage du texte dans les replays
- Blocage des médias dans les replays

**Logs** :
- Pas de collecte de données personnelles
- Session ID anonyme
- Métadonnées limitées

**Métriques** :
- Aucune donnée personnelle
- Agrégation des données
- Sampling pour réduire le volume

### Consentement Utilisateur

- **Opt-in** par défaut (tout désactivé)
- Contrôle granulaire (erreurs, logs, métriques)
- Sauvegarde persistante des préférences
- Possibilité de modification à tout moment

## Monitoring et Alertes

### Endpoints API

**Logs** : `POST /api/logs`
```json
{
  "logs": [...],
  "timestamp": 1234567890,
  "sessionId": "session-123"
}
```

**Métriques** : `POST /api/metrics`
```json
{
  "sessionId": "session-123",
  "timestamp": 1234567890,
  "metrics": [...],
  "userMetrics": {...},
  "businessMetrics": {...}
}
```

### Alertes Automatiques

Le système vérifie automatiquement :
- Taux d'erreur élevé
- Performance dégradée
- Utilisation mémoire excessive
- Temps de réponse réseau lent

## Développement et Debug

### Mode Développement

En mode développement :
- Logs détaillés dans la console
- Pas d'envoi batch
- Sampling à 100%
- Replays Sentry désactivés

### Debugging

```typescript
// Vérifier le statut
const status = errorReporter.getStatus();
console.log('Error reporting status:', status);

// Exporter les logs
const logs = logger.exportLogs();
console.log('Application logs:', logs);

// Obtenir les métriques
const metrics = metricsTracker.getMetrics();
console.log('Current metrics:', metrics);
```

## Tests

### Tests Unitaires

```bash
# Tests du logger
npm run test -- logger.test.ts

# Tests du reporting d'erreurs
npm run test -- errorReporting.test.ts

# Tests des métriques
npm run test -- metrics.test.ts
```

### Tests d'Intégration

```bash
# Test complet de l'observabilité
npm run test:integration
```

## Maintenance

### Nettoyage des Données

- Logs locaux : limite automatique (1000 entrées)
- Métriques : envoi automatique toutes les 30 secondes
- Sentry : rétention configurable côté serveur

### Monitoring

- Vérifier les quotas Sentry
- Surveiller les performances d'envoi
- Analyser les métriques de consentement

## Troubleshooting

### Problèmes Courants

1. **Sentry ne s'initialise pas**
   - Vérifier `VITE_SENTRY_DSN`
   - Vérifier le consentement utilisateur

2. **Logs non envoyés**
   - Vérifier le consentement logging
   - Vérifier la connectivité réseau
   - Vérifier les quotas

3. **Métriques manquantes**
   - Vérifier le sampling rate
   - Vérifier le consentement metrics
   - Vérifier les erreurs réseau

### Logs de Debug

```typescript
// Activer les logs de debug
logger.updateConfig({ level: 'debug' });

// Vérifier les erreurs d'initialisation
console.log('Error reporter status:', errorReporter.getStatus());
console.log('Logger config:', logger.getStats());
console.log('Metrics enabled:', metricsTracker.getUserMetrics());
```
