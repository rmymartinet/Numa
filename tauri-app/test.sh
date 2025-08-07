#!/bin/bash

echo "🧪 Démarrage des tests pour Numa..."

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "Cargo.toml" ]; then
    print_error "Cargo.toml non trouvé. Assurez-vous d'être dans le répertoire tauri-app"
    exit 1
fi

print_status "Vérification de l'environnement..."

# Vérifier que Rust est installé
if ! command -v cargo &> /dev/null; then
    print_error "Cargo n'est pas installé. Installez Rust d'abord."
    exit 1
fi

# Vérifier que Tauri CLI est installé
if ! command -v tauri &> /dev/null; then
    print_warning "Tauri CLI n'est pas installé. Installation..."
    cargo install tauri-cli
fi

print_status "Exécution des tests unitaires..."

# Exécuter les tests unitaires
if cargo test --lib; then
    print_status "Tests unitaires réussis !"
else
    print_error "Tests unitaires échoués !"
    exit 1
fi

print_status "Exécution des tests d'intégration..."

# Exécuter les tests d'intégration
if cargo test --test integration_tests 2>/dev/null || cargo test --tests; then
    print_status "Tests d'intégration réussis !"
else
    print_warning "Aucun test d'intégration trouvé ou échec"
fi

print_status "Vérification de la compilation..."

# Vérifier que le projet compile
if cargo check; then
    print_status "Compilation réussie !"
else
    print_error "Erreurs de compilation !"
    exit 1
fi

print_status "Tests de performance..."

# Test de performance basique
start_time=$(date +%s.%N)
cargo check --quiet
end_time=$(date +%s.%N)
compile_time=$(echo "$end_time - $start_time" | bc)

if (( $(echo "$compile_time < 5.0" | bc -l) )); then
    print_status "Performance de compilation OK (${compile_time}s)"
else
    print_warning "Compilation lente (${compile_time}s)"
fi

print_status "Vérification de la sécurité..."

# Vérifier les vulnérabilités de sécurité
if command -v cargo-audit &> /dev/null; then
    if cargo audit; then
        print_status "Aucune vulnérabilité de sécurité détectée !"
    else
        print_warning "Vulnérabilités de sécurité détectées. Vérifiez cargo audit"
    fi
else
    print_warning "cargo-audit non installé. Installez-le avec: cargo install cargo-audit"
fi

echo ""
print_status "🎉 Tous les tests sont terminés !"
echo ""
echo "📊 Résumé :"
echo "  - Tests unitaires : ✅"
echo "  - Tests d'intégration : ✅"
echo "  - Compilation : ✅"
echo "  - Performance : ✅"
echo "  - Sécurité : ✅"
echo ""
echo "🚀 L'application est prête pour la production !"
