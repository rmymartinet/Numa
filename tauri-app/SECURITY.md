# Politique de Sécurité - Numa

## 🛡️ Mesures de Sécurité Implémentées

### 1. **Allowlist Tauri**
- ✅ Permissions restreintes via `capabilities/main.json`
- ✅ Seules les fonctionnalités nécessaires sont activées
- ✅ API privées macOS verrouillées par défaut

### 2. **Content Security Policy (CSP)**
- ✅ CSP stricte dans `index.html`
- ✅ Restriction des sources de contenu
- ✅ Protection contre XSS et injection

### 3. **Vérification des Dépendances**
- ✅ `cargo audit` pour vulnérabilités Rust
- ✅ `cargo deny` pour licences et doublons
- ✅ `npm audit` pour vulnérabilités JavaScript
- ✅ Workflow GitHub Actions automatisé

### 4. **Signature et Notarisation**
- ✅ Configuration pour code signing macOS
- ✅ Configuration pour notarisation Apple
- ✅ Configuration pour signature Windows
- ✅ Hardened Runtime activé

### 5. **Mise à Jour Sécurisée**
- ✅ Configuration updater Tauri
- ✅ Vérification cryptographique des mises à jour
- ✅ Endpoints sécurisés

## 🔍 Vérifications de Sécurité

### Automatiques (CI/CD)
```bash
# Rust
cargo audit
cargo deny check

# JavaScript
npm audit --audit-level=moderate

# Tauri
cargo tauri build --release
```

### Manuel
```bash
# Vérifier les permissions
cargo tauri info

# Analyser les dépendances
cargo tree
npm ls
```

## 🚨 Signalement de Vulnérabilités

Si vous découvrez une vulnérabilité de sécurité :

1. **Ne pas créer d'issue publique**
2. **Envoyer un email à** : security@numa.app
3. **Inclure** : description détaillée, étapes de reproduction
4. **Réponse** : sous 48h

## 📋 Checklist de Sécurité

### Avant chaque Release
- [ ] `cargo audit` passe
- [ ] `cargo deny check` passe  
- [ ] `npm audit` passe
- [ ] CSP testée
- [ ] Permissions minimales vérifiées
- [ ] Code signing configuré
- [ ] Tests de sécurité passés

### Configuration Production
- [ ] Hardened Runtime activé
- [ ] Notarisation configurée
- [ ] Updater sécurisé
- [ ] Logs de sécurité activés
- [ ] Monitoring en place

## 🔐 Bonnes Pratiques

### Développement
- Toujours utiliser les permissions minimales
- Valider les entrées utilisateur
- Utiliser des secrets sécurisés
- Tester les vulnérabilités connues

### Déploiement
- Signer tous les binaires
- Notariser sur macOS
- Vérifier les checksums
- Monitorer les mises à jour

## 📞 Contact Sécurité

- **Email** : security@numa.app
- **PGP** : [Clé publique](https://numa.app/security.asc)
- **Réponse** : 24-48h
