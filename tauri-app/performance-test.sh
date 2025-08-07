#!/bin/bash

echo "⚡ Test de performance pour Numa..."

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    print_error "package.json non trouvé. Assurez-vous d'être dans le répertoire tauri-app"
    exit 1
fi

print_status "Démarrage des tests de performance..."

# Test de build performance
print_info "Test de build performance..."
start_time=$(date +%s.%N)
npm run build > /dev/null 2>&1
end_time=$(date +%s.%N)
build_time=$(echo "$end_time - $start_time" | bc)

if (( $(echo "$build_time < 30.0" | bc -l) )); then
    print_status "Build rapide: ${build_time}s"
else
    print_warning "Build lent: ${build_time}s"
fi

# Analyser la taille du bundle
if [ -d "dist" ]; then
    print_info "Analyse de la taille du bundle..."
    total_size=$(du -sh dist/ | cut -f1)
    js_size=$(find dist/ -name "*.js" -exec du -ch {} + | tail -1 | cut -f1)
    css_size=$(find dist/ -name "*.css" -exec du -ch {} + | tail -1 | cut -f1)
    
    echo "📦 Taille totale: $total_size"
    echo "📄 JavaScript: $js_size"
    echo "🎨 CSS: $css_size"
    
    # Vérifier si la taille est raisonnable
    js_size_kb=$(echo $js_size | sed 's/[^0-9.]//g')
    if (( $(echo "$js_size_kb < 1000" | bc -l) )); then
        print_status "Bundle JavaScript optimisé"
    else
        print_warning "Bundle JavaScript volumineux"
    fi
fi

# Test de performance des dépendances
print_info "Test de performance des dépendances..."
if command -v lighthouse &> /dev/null; then
    print_info "Lighthouse disponible - test de performance web"
else
    print_warning "Lighthouse non installé. Installez-le avec: npm install -g lighthouse"
fi

# Test de mémoire
print_info "Test de mémoire..."
if [ -d "node_modules" ]; then
    node_modules_size=$(du -sh node_modules/ | cut -f1)
    echo "💾 node_modules: $node_modules_size"
    
    if [[ $node_modules_size == *"M"* ]]; then
        size_num=$(echo $node_modules_size | sed 's/[^0-9.]//g')
        if (( $(echo "$size_num < 300" | bc -l) )); then
            print_status "Taille node_modules acceptable"
        else
            print_warning "node_modules volumineux - considérer le nettoyage"
        fi
    fi
fi

# Test de vitesse de développement
print_info "Test de vitesse de développement..."
if command -v npm &> /dev/null; then
    start_time=$(date +%s.%N)
    npm run dev -- --help > /dev/null 2>&1
    end_time=$(date +%s.%N)
    dev_start_time=$(echo "$end_time - $start_time" | bc)
    
    if (( $(echo "$dev_start_time < 5.0" | bc -l) )); then
        print_status "Démarrage dev rapide: ${dev_start_time}s"
    else
        print_warning "Démarrage dev lent: ${dev_start_time}s"
    fi
fi

# Suggestions d'optimisation
print_status "Suggestions d'optimisation de performance:"
echo ""
echo "🚀 Build:"
echo "  - Utiliser le cache Vite"
echo "  - Activer la compression gzip/brotli"
echo "  - Optimiser les imports avec tree shaking"
echo ""
echo "📦 Bundle:"
echo "  - Diviser le code en chunks"
echo "  - Lazy loading des composants"
echo "  - Optimiser les images et assets"
echo ""
echo "⚡ Runtime:"
echo "  - Utiliser React.memo pour les composants"
echo "  - Optimiser les re-renders"
echo "  - Implémenter la virtualisation pour les listes"
echo ""
echo "🔧 Outils:"
echo "  - Lighthouse pour l'audit web"
echo "  - Bundle analyzer pour analyser le bundle"
echo "  - Performance monitoring en production"

print_status "Tests de performance terminés !"
