# 🚀 Système de Features Cargo - Numa

Ce document explique le système de features Cargo implémenté pour isoler les environnements de développement et les API privées macOS.

## 📋 Features Disponibles

### 🏭 **Production (default)**
```bash
cargo build
```
- **Objectif** : Build de production avec mode furtif
- **API privées** : ✅ Activées (si macOS)
- **Logs** : Niveau `info` uniquement
- **Tests** : ❌ Désactivés
- **Stealth mode** : ✅ Fonctionnel

### 🔒 **Production Sécurisée**
```bash
cargo build --no-default-features --features secure
```
- **Objectif** : Build minimal pour distribution sécurisée
- **API privées** : ❌ Désactivées
- **Logs** : Niveau `info` uniquement
- **Tests** : ❌ Désactivés
- **Sécurité** : Maximale - aucune API privée

### 🛠️ **Développement**
```bash
cargo build --features dev
```
- **Objectif** : Développement avec toutes les fonctionnalités
- **API privées** : ✅ Activées (si macOS)
- **Logs** : Niveau `info` avec plus de détails
- **Tests** : ✅ Activés
- **Stealth mode** : ✅ Fonctionnel

### 🕵️ **Stealth macOS**
```bash
cargo build --features stealth_macos
```
- **Objectif** : Activer uniquement les API privées macOS
- **API privées** : ✅ Activées
- **Logs** : Niveau `info`
- **Tests** : ❌ Désactivés
- **Stealth mode** : ✅ Fonctionnel

### 🐛 **Debug**
```bash
cargo build --features debug
```
- **Objectif** : Développement avec logs très verbeux
- **API privées** : ✅ Activées (si macOS)
- **Logs** : Niveau `debug` avec couleurs ANSI
- **Tests** : ✅ Activés
- **Stealth mode** : ✅ Fonctionnel

## 🔧 Configuration dans Cargo.toml

```toml
[features]
# Production par défaut : inclut le mode furtif pour macOS
default = ["stealth_macos"]

# Développement : active les chemins de test et logs verbeux
dev = ["tauri/test", "stealth_macos"]

# macOS : active l'usage d'API privées macOS
stealth_macos = ["tauri/macos-private-api", "objc", "core-graphics", "cocoa"]

# Debug : logs très verbeux et outils de debug
debug = ["dev", "tracing-subscriber/ansi"]

# Production sécurisée : sans API privées (pour distribution)
secure = []
```

## 🎯 Utilisation dans le Code

### Conditionnement des Modules

```rust
// Module macOS - seulement si feature stealth_macos activée
#[cfg(all(target_os = "macos", feature = "stealth_macos"))]
pub mod macos;

// Module stub pour les autres plateformes ou si stealth_macos désactivé
#[cfg(not(all(target_os = "macos", feature = "stealth_macos")))]
pub mod stub;
```

### Conditionnement des Fonctions

```rust
pub fn toggle_stealth(app: &AppHandle) -> AppResult<()> {
    #[cfg(all(target_os = "macos", feature = "stealth_macos"))]
    {
        info!("🕵️ Toggle stealth: active = {}", active);
        // Code spécifique macOS
    }

    #[cfg(not(all(target_os = "macos", feature = "stealth_macos")))]
    {
        warn!("🕵️ Stealth mode requested but stealth_macos feature not enabled");
        return Ok(());
    }
}
```

### Conditionnement des Dépendances

```toml
# API privées macOS - seulement si feature stealth_macos activée
[target.'cfg(all(target_os = "macos", feature = "stealth_macos"))'.dependencies]
objc = "0.2"
core-graphics = "0.23"
cocoa = "0.25"
```

## 🚀 Scripts de Build

### Production
```bash
# Build de production avec mode furtif
cargo build --release

# Build sécurisé sans API privées
cargo build --release --no-default-features --features secure
```

### Développement
```bash
# Build avec toutes les features de dev
cargo build --features dev

# Build avec debug
cargo build --features debug
```

### Tests
```bash
# Tests avec features de dev
cargo test --features dev

# Tests avec debug
cargo test --features debug
```

## 🔒 Sécurité

### Production
- **API privées** : Activées si macOS
- **Dépendances** : Complètes
- **Logs** : Niveau info uniquement
- **Stealth mode** : Fonctionnel

### Production Sécurisée
- **API privées** : Jamais compilées
- **Dépendances** : Minimales
- **Logs** : Niveau info uniquement
- **Surface d'attaque** : Minimale

### Développement
- **API privées** : Activées si macOS
- **Dépendances** : Complètes
- **Logs** : Verbose
- **Tests** : Activés

## 📊 Avantages

### 🛡️ **Sécurité**
- Isolation des API privées
- Build de production sans code sensible
- Réduction de la surface d'attaque

### 🔧 **Développement**
- Features modulaires
- Logs adaptés à l'environnement
- Tests conditionnels

### 🚀 **Performance**
- Build de production optimisé
- Dépendances minimales en prod
- Code mort éliminé

### 🧪 **Tests**
- Tests isolés par feature
- Environnements de test contrôlés
- Validation des builds

## 🎯 Workflows Recommandés

### Développement Quotidien
```bash
# Build avec toutes les features
cargo build --features dev

# Tests
cargo test --features dev

# Run avec debug
cargo run --features debug
```

### Préparation Production
```bash
# Build de production
cargo build --release

# Tests de production
cargo test --release

# Validation
cargo clippy --release
```

### Debug
```bash
# Build avec logs très verbeux
cargo build --features debug

# Run avec debug
cargo run --features debug
```

## 🔍 Vérification

### Vérifier les Features Actives
```bash
# Lister les features disponibles
cargo features

# Vérifier les dépendances
cargo tree --features dev
```

### Vérifier le Code Compilé
```bash
# Voir le code généré
cargo build --features dev --verbose

# Analyser les binaires
cargo build --release && file target/release/tauri-app
```

## 🚨 Points d'Attention

1. **API privées** : Toujours conditionnées par `stealth_macos`
2. **Logs** : Niveau adapté selon les features
3. **Tests** : Activés seulement en dev/debug
4. **Production** : Build minimal par défaut
5. **Cross-compilation** : Features respectent la plateforme

## 📝 Migration

### Ancien Code
```rust
// Code toujours compilé
use objc::{msg_send, sel, sel_impl};
```

### Nouveau Code
```rust
// Code conditionnel
#[cfg(all(target_os = "macos", feature = "stealth_macos"))]
use objc::{msg_send, sel, sel_impl};
```

Ce système garantit que le code de production est sécurisé et minimal, tout en permettant un développement complet avec toutes les fonctionnalités.
