# 🔒 Règles de Stealth & Observabilité

## Principe Fondamental

**Quand le mode furtif est actif, l'observabilité est réduite au strict minimum pour éviter toute fuite d'informations sensibles.**

## 🛡️ Guard Global Automatique

### Code Implémenté

```typescript
// Dans useStealthObservability.ts
if (stealthActive) {
  disableReplay();                    // Désactiver Sentry Replay
  metricsTracker.setSamplingRate(0);  // Pas de métriques
  logger.setNetworkOff(true);         // Pas d'envoi réseau
}
```

### Comportements par Mode

| Fonctionnalité | Mode Normal | Mode Stealth |
|----------------|-------------|--------------|
| **Sentry Replay** | ✅ Consentement | ❌ Désactivé |
| **Métriques** | ✅ Consentement | ❌ Désactivé |
| **Logs Réseau** | ✅ Consentement | ❌ Désactivé |
| **Capture Écran** | ✅ Consentement | ❌ Désactivé |
| **PII (Données Personnelles)** | ✅ Consentement | ❌ Désactivé |

## 🔄 Événements Écoutés

### Événements Tauri

- **`stealth-activated`** : Désactive immédiatement l'observabilité avancée
- **`stealth-deactivated`** : Réactive selon le consentement utilisateur

### Événements Rust

```rust
// Dans lib.rs
if let Err(e) = app_handle.emit("stealth-activated", ()) {
    error!("Failed to emit stealth-activated event: {}", e);
}
```

## 🎯 Implémentation Technique

### 1. Hook Principal

**Fichier** : `src/hooks/useStealthObservability.ts`

```typescript
export function useStealthObservability() {
  const [stealthActive, setStealthActive] = useState(false);

  useEffect(() => {
    // Écouter les changements de mode furtif
    await listen('stealth-activated', () => {
      setStealthActive(true);
      adjustObservability(true);
    });

    await listen('stealth-deactivated', () => {
      setStealthActive(false);
      adjustObservability(false);
    });
  }, []);

  return { stealthActive };
}
```

### 2. Fonction de Désactivation

```typescript
async function disableObservabilityForStealth() {
  // Désactiver Sentry Replay
  errorReporter.disableReplay();
  
  // Désactiver les métriques
  metricsTracker.setSamplingRate(0);
  
  // Désactiver l'envoi réseau des logs
  logger.setNetworkOff(true);
}
```

### 3. Fonction de Réactivation

```typescript
async function enableObservabilityWithConsent() {
  const errorConsent = localStorage.getItem('numa_error_reporting_consent') === 'true';
  const metricsConsent = localStorage.getItem('numa_metrics_consent') === 'true';
  const loggingConsent = localStorage.getItem('numa_logging_consent') === 'true';

  if (errorConsent) errorReporter.initialize();
  if (metricsConsent) metricsTracker.setSamplingRate(0.1);
  if (loggingConsent) logger.setNetworkOff(false);
}
```

## 🔧 Méthodes Ajoutées

### ErrorReporter

```typescript
disableReplay(): void {
  try {
    if (Sentry.getReplay()) {
      Sentry.getReplay()?.stop();
    }
    console.log('Sentry Replay désactivé');
  } catch (error) {
    console.warn('Erreur lors de la désactivation du replay Sentry:', error);
  }
}
```

### Logger

```typescript
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
```

## 🚀 Intégration dans l'Application

### AppWithRouter.tsx

```typescript
const AppWithRouter: React.FC = () => {
  // Initialiser l'observabilité de manière différée
  useDelayedObservability();
  
  // Gérer l'observabilité en fonction du mode furtif
  useStealthObservability();

  return (
    <Router>
      {/* ... */}
    </Router>
  );
};
```

## 🧪 Tests

### Tests Implémentés

- ✅ Initialisation sans erreur
- ✅ Hook React valide
- ✅ Configuration des événements

### Fichier de Test

**Fichier** : `src/hooks/__tests__/useStealthObservability.test.ts`

```typescript
describe('useStealthObservability', () => {
  it('should initialize without throwing errors', () => {
    expect(() => {
      renderHook(() => useStealthObservability());
    }).not.toThrow();
  });

  it('should be a valid React hook', () => {
    const { result } = renderHook(() => useStealthObservability());
    expect(result.current).toHaveProperty('stealthActive');
  });
});
```

## 📋 Checklist de Sécurité

### Mode Normal
- [ ] Sentry Replay activé selon consentement
- [ ] Métriques activées selon consentement
- [ ] Logs réseau activés selon consentement
- [ ] Capture d'écran activée selon consentement
- [ ] PII collectées selon consentement

### Mode Stealth
- [ ] Sentry Replay désactivé
- [ ] Métriques désactivées (sampling rate = 0)
- [ ] Logs réseau désactivés
- [ ] Capture d'écran désactivée
- [ ] PII non collectées

### Transitions
- [ ] Désactivation immédiate lors de l'activation du mode furtif
- [ ] Réactivation selon consentement lors de la désactivation du mode furtif
- [ ] Gestion des erreurs lors des transitions

## 🔍 Monitoring

### Logs de Sécurité

```typescript
logger.info('Mode furtif actif - désactivation de l\'observabilité avancée');
logger.info('Sentry Replay désactivé pour le mode furtif');
logger.info('Métriques désactivées pour le mode furtif');
logger.info('Envoi réseau des logs désactivé pour le mode furtif');
```

### Métriques de Conformité

- Temps de désactivation après activation du mode furtif
- Temps de réactivation après désactivation du mode furtif
- Nombre de transitions mode furtif
- Erreurs lors des transitions

## 🚨 Gestion d'Erreurs

### Erreurs Possibles

1. **Impossible de vérifier le statut du mode furtif**
   - Fallback : considérer comme mode normal
   - Log : `console.warn('Impossible de vérifier le statut du mode furtif:', error)`

2. **Impossible de configurer les listeners**
   - Fallback : pas de réaction automatique
   - Log : `console.warn('Impossible de configurer les listeners de mode furtif:', error)`

3. **Erreur lors de la désactivation/réactivation**
   - Fallback : continuer avec l'état actuel
   - Log : `logger.warn('Erreur lors de l\'ajustement de l\'observabilité:', error)`

## 📚 Références

- [OBSERVABILITY.md](./OBSERVABILITY.md) - Documentation générale de l'observabilité
- [OBSERVABILITY_IMPROVEMENTS.md](./OBSERVABILITY_IMPROVEMENTS.md) - Améliorations récentes
- [ACCESSIBILITY.md](./ACCESSIBILITY.md) - Accessibilité et UX
