# 🔐 Privacy & Stockage Sécurisé

## Principe Fondamental

**Respect total de la confidentialité utilisateur avec stockage sécurisé des données sensibles.**

## 🛡️ Do Not Track (DNT)

### Détection Automatique

L'application détecte automatiquement si Do Not Track est activé :

```typescript
// Vérifications multiples
if (navigator.doNotTrack === '1') return true;
if (navigator.doNotTrack === 'yes') return true;
if (document.cookie.includes('DNT=1')) return true;
```

### Comportement avec DNT

**Quand Do Not Track est activé :**
- ❌ Tous les consentements sont automatiquement désactivés
- ❌ Impossible de modifier les consentements
- ❌ Aucune collecte de données
- ❌ Aucun envoi réseau

### Écoute Continue

```typescript
// Vérification périodique des changements
setInterval(() => {
  const currentDoNotTrack = this.isDoNotTrackEnabled();
  if (currentDoNotTrack !== this.settings.doNotTrack) {
    this.checkDoNotTrack();
  }
}, 30000); // Toutes les 30 secondes
```

## 🔒 Stockage Sécurisé

### Architecture

| Type de Données | Stockage | Sécurité |
|-----------------|----------|----------|
| **Consentements** | localStorage | Standard |
| **Tokens/Clés** | Tauri Keychain | Haute |
| **IDs Sensibles** | Tauri Keychain | Haute |
| **Logs** | localStorage | Standard |

### Tauri Keychain

**Avantages :**
- Chiffrement système
- Intégration native
- Gestion des permissions
- Fallback automatique

**Implémentation :**

```rust
// Commandes Tauri
#[tauri::command]
fn secure_store(key: String, value: String) -> Result<(), String> {
    use keyring::Entry;
    let entry = Entry::new("numa", &key)?;
    entry.set_password(&value)
}

#[tauri::command]
fn secure_load(key: String) -> Result<String, String> {
    use keyring::Entry;
    let entry = Entry::new("numa", &key)?;
    entry.get_password()
}
```

### Fallback Sécurisé

```typescript
// Si Keychain indisponible, fallback sur localStorage avec préfixe
if (this.isAvailable) {
  await invoke('secure_store', { key, value });
} else {
  localStorage.setItem(`secure_${key}`, value);
}
```

## 📋 Types de Données

### Données Sensibles (Keychain)

```typescript
interface SensitiveData {
  tokens?: {
    accessToken?: string;
    refreshToken?: string;
    sessionToken?: string;
  };
  ids?: {
    userId?: string;
    deviceId?: string;
    sessionId?: string;
  };
  keys?: {
    encryptionKey?: string;
    apiKey?: string;
  };
}
```

### Consentements (localStorage)

```typescript
interface PrivacyConsent {
  errorReporting: boolean;
  logging: boolean;
  metrics: boolean;
  analytics: boolean;
  marketing: boolean;
}
```

## 🎯 Gestionnaire de Confidentialité

### PrivacyManager

**Fonctionnalités :**
- Détection automatique DNT
- Gestion centralisée des consentements
- Versioning des paramètres
- Migration automatique
- Export/Import des paramètres

### API Principale

```typescript
// Vérifier le consentement
const hasConsent = privacyManager.hasConsent('errorReporting');

// Mettre à jour le consentement
privacyManager.updateConsent({ errorReporting: true });

// Vérifier DNT
const isDNT = privacyManager.isDoNotTrackActive();

// Réinitialiser
privacyManager.resetConsent();
```

## 🔧 Intégration dans les Services

### ErrorReporting

```typescript
initialize(): void {
  // Vérifier Do Not Track et consentement
  if (isDoNotTrackEnabled() || !checkConsent('errorReporting')) {
    logger.info('Sentry désactivé - Do Not Track actif ou pas de consentement');
    return;
  }
  // ... initialisation Sentry
}
```

### Logger

```typescript
private addLog(): void {
  // Vérifier Do Not Track et consentement pour l'envoi réseau
  const canSendNetwork = !isDoNotTrackEnabled() && checkConsent('logging');
  
  if (this.config.enableBatchSending && canSendNetwork) {
    this.pendingLogs.push(entry);
  }
}
```

### Metrics

```typescript
private shouldTrack(): boolean {
  // Vérifier Do Not Track et consentement
  if (isDoNotTrackEnabled() || !checkConsent('metrics')) {
    return false;
  }
  return this.isEnabled && this.userConsent && Math.random() <= this.samplingRate;
}
```

## 🧪 Tests

### Tests de Confidentialité

```typescript
describe('PrivacyManager', () => {
  it('should respect Do Not Track', () => {
    // Simuler DNT activé
    Object.defineProperty(navigator, 'doNotTrack', { value: '1' });
    
    const manager = new PrivacyManager();
    expect(manager.hasConsent('errorReporting')).toBe(false);
  });
});
```

### Tests de Stockage Sécurisé

```typescript
describe('SecureStorage', () => {
  it('should store tokens securely', async () => {
    const tokens = { accessToken: 'secret-token' };
    await secureStorage.storeTokens(tokens);
    
    const retrieved = await secureStorage.getTokens();
    expect(retrieved.accessToken).toBe('secret-token');
  });
});
```

## 🚀 Interface Utilisateur

### Composant PrivacyManager

**Fonctionnalités :**
- Affichage du statut DNT
- Gestion des consentements
- Visualisation des données sensibles
- Actions de nettoyage
- Interface accessible

### Intégration

```typescript
// Dans SettingsContent.tsx
const [showPrivacyManager, setShowPrivacyManager] = useState(false);

<AccessibleButton onClick={() => setShowPrivacyManager(true)}>
  Gestion de la Confidentialité
</AccessibleButton>

<PrivacyManager 
  isOpen={showPrivacyManager}
  onClose={() => setShowPrivacyManager(false)}
/>
```

## 📊 Monitoring

### Métriques de Conformité

- Temps de détection DNT
- Taux de respect des consentements
- Utilisation du stockage sécurisé
- Erreurs de stockage

### Logs de Sécurité

```typescript
logger.info('Do Not Track détecté - désactivation de tous les consentements');
logger.info('Token stocké de manière sécurisée dans le Keychain');
logger.warn('Keychain indisponible, fallback sur localStorage');
```

## 🔄 Migration

### Versioning des Paramètres

```typescript
interface PrivacySettings {
  doNotTrack: boolean;
  consent: PrivacyConsent;
  lastUpdated: string;
  version: string; // Pour la migration
}
```

### Migration Automatique

```typescript
private loadSettings(): PrivacySettings {
  const parsed = JSON.parse(stored);
  if (parsed.version === this.VERSION) {
    return parsed;
  }
  // Migration automatique si version différente
  return this.migrateSettings(parsed);
}
```

## 🚨 Gestion d'Erreurs

### Erreurs Possibles

1. **Keychain indisponible**
   - Fallback sur localStorage
   - Log d'avertissement

2. **DNT non détecté**
   - Vérification périodique
   - Mise à jour automatique

3. **Erreur de stockage**
   - Retry automatique
   - Fallback sécurisé

### Stratégies de Fallback

```typescript
try {
  await secureStorage.set('key', 'value');
} catch (error) {
  console.warn('Erreur de stockage sécurisé, fallback:', error);
  localStorage.setItem('secure_key', 'value');
}
```

## 📚 Références

- [OBSERVABILITY.md](./OBSERVABILITY.md) - Observabilité et gestion d'erreurs
- [STEALTH_OBSERVABILITY_RULES.md](./STEALTH_OBSERVABILITY_RULES.md) - Règles de stealth
- [ACCESSIBILITY.md](./ACCESSIBILITY.md) - Accessibilité et UX
- [W3C Do Not Track](https://www.w3.org/TR/tracking-dnt/) - Spécification officielle
- [Tauri Keychain](https://tauri.app/v2/api/js/keyring/) - Documentation Tauri
