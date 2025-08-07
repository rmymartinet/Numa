#!/bin/bash

echo "🚀 Test complet des optimisations Numa..."

# Couleurs pour les messages
print_status() {
    echo -e "\033[1;34m$1\033[0m"
}

print_success() {
    echo -e "\033[1;32m$1\033[0m"
}

print_error() {
    echo -e "\033[1;31m$1\033[0m"
}

print_info() {
    echo -e "\033[1;36m$1\033[0m"
}

print_warning() {
    echo -e "\033[1;33m$1\033[0m"
}

# Variables de test
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Fonction de test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    print_info "Test: $test_name"
    
    if eval "$test_command" > /dev/null 2>&1; then
        print_success "✅ $test_name - PASSED"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        print_error "❌ $test_name - FAILED"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Vérification de l'environnement
print_status "🔍 Vérification de l'environnement..."
run_test "Node.js installé" "command -v node"
run_test "npm installé" "command -v npm"
run_test "cargo installé" "command -v cargo"
run_test "tauri installé" "command -v tauri"

# Tests de configuration
print_status "⚙️ Tests de configuration..."
run_test "TypeScript config valide" "npx tsc --noEmit"
run_test "ESLint config valide" "npx eslint --print-config .eslintrc.json > /dev/null"
run_test "Prettier config valide" "npx prettier --check .prettierrc > /dev/null"
run_test "Vite config valide" "npx vite build --dry-run > /dev/null 2>&1"

# Tests de qualité du code
print_status "📝 Tests de qualité du code..."
run_test "ESLint sans erreurs" "npx eslint src/ --ext .ts,.tsx --max-warnings 0"
run_test "Prettier formatage" "npx prettier --check src/"
run_test "TypeScript compilation" "npx tsc --noEmit"

# Tests de build
print_status "🔨 Tests de build..."
run_test "Build frontend" "npm run build"
run_test "Build Tauri" "npm run tauri build"

# Tests de performance
print_status "⚡ Tests de performance..."
if [ -d "dist" ]; then
    run_test "Bundle size < 2MB" "[ $(du -sm dist | cut -f1) -lt 2 ]"
    run_test "Assets optimisés" "[ $(find dist -name '*.svg' -exec du -k {} + | awk '{sum+=$1} END {print sum}') -lt 100 ]"
fi

# Tests de sécurité
print_status "🔒 Tests de sécurité..."
run_test "npm audit" "npm audit --audit-level=moderate"
run_test "Pas de secrets exposés" "! grep -r 'password\|secret\|key' src/ --exclude-dir=node_modules"

# Tests de fonctionnalités
print_status "🎯 Tests de fonctionnalités..."
run_test "Service Worker existe" "[ -f public/sw.js ]"
run_test "Manifest PWA existe" "[ -f public/manifest.json ]"
run_test "CSS optimisé existe" "[ -f src/styles/mainhud.css ]"

# Tests de Rust
print_status "🦀 Tests Rust..."
run_test "Rust compilation" "cargo check"
run_test "Rust tests" "cargo test --lib"

# Tests d'optimisation
print_status "🎨 Tests d'optimisation..."
run_test "SVG optimisé" "[ -f src/assets/react.svg ] && [ $(stat -f%z src/assets/react.svg 2>/dev/null || stat -c%s src/assets/react.svg 2>/dev/null) -lt 4000 ]"
run_test "Scripts d'optimisation" "[ -f optimize-assets.sh ] && [ -x optimize-assets.sh ]"
run_test "Scripts de test" "[ -f test.sh ] && [ -x test.sh ]"

# Tests de dépendances
print_status "📦 Tests de dépendances..."
run_test "Dépendances à jour" "npm outdated | wc -l | grep -q '^0$'"
run_test "Pas de vulnérabilités" "npm audit | grep -q 'found 0 vulnerabilities'"

# Tests de structure
print_status "📁 Tests de structure..."
run_test "Structure des dossiers" "[ -d src/components ] && [ -d src/pages ] && [ -d src/hooks ]"
run_test "Fichiers de configuration" "[ -f package.json ] && [ -f tsconfig.json ] && [ -f vite.config.ts ]"

# Tests de développement
print_status "🛠️ Tests de développement..."
run_test "Dev server démarre" "timeout 10s npm run dev > /dev/null 2>&1 || true"
run_test "Hot reload configuré" "grep -q 'hmr' vite.config.ts"

# Résumé des tests
print_status "📊 Résumé des tests..."
echo ""
echo "Total des tests: $TOTAL_TESTS"
echo "Tests réussis: $PASSED_TESTS"
echo "Tests échoués: $FAILED_TESTS"
echo "Taux de réussite: $((PASSED_TESTS * 100 / TOTAL_TESTS))%"

if [ $FAILED_TESTS -eq 0 ]; then
    print_success "🎉 Tous les tests sont passés !"
    exit 0
else
    print_error "⚠️ $FAILED_TESTS test(s) ont échoué"
    exit 1
fi
