#!/bin/bash

echo "🔧 Optimisation des dépendances pour Numa..."

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

print_status "Analyse des dépendances..."

# Analyser les dépendances inutilisées
print_info "Recherche de dépendances inutilisées..."
if command -v depcheck &> /dev/null; then
    npx depcheck --json > depcheck-report.json 2>/dev/null
    if [ -f "depcheck-report.json" ]; then
        print_info "Rapport depcheck généré dans depcheck-report.json"
    fi
else
    print_warning "depcheck non installé. Installez-le avec: npm install -g depcheck"
fi

# Analyser la taille du bundle
print_info "Analyse de la taille du bundle..."
if [ -d "dist" ]; then
    echo "Taille du bundle actuel:"
    du -sh dist/
    echo ""
    echo "Détail des fichiers:"
    find dist/ -type f -name "*.js" -o -name "*.css" | xargs du -sh
else
    print_warning "Dossier dist/ non trouvé. Lancez d'abord: npm run build"
fi

# Vérifier les vulnérabilités
print_info "Vérification des vulnérabilités..."
npm audit --audit-level=moderate

# Analyser les dépendances obsolètes
print_info "Vérification des dépendances obsolètes..."
npm outdated

# Optimisation des dépendances de développement
print_info "Optimisation des dépendances de développement..."
if [ -d "node_modules" ]; then
    echo "Taille actuelle de node_modules:"
    du -sh node_modules/
    
    # Nettoyer les caches
    print_info "Nettoyage des caches..."
    npm cache clean --force
    rm -rf node_modules/.cache 2>/dev/null || true
fi

# Suggestions d'optimisation
print_status "Suggestions d'optimisation:"
echo ""
echo "📦 Dépendances:"
echo "  - Tesseract.js (6.0.1) : Considérer une alternative plus légère"
echo "  - Framer Motion (12.23.12) : Vérifier si tous les composants sont utilisés"
echo "  - Lucide React (0.536.0) : Importer seulement les icônes nécessaires"
echo ""
echo "⚡ Performance:"
echo "  - Activer le tree shaking dans Vite"
echo "  - Utiliser le lazy loading pour les composants lourds"
echo "  - Optimiser les images et assets"
echo ""
echo "🔧 Configuration:"
echo "  - Ajouter des alias dans Vite pour les imports"
echo "  - Configurer la compression gzip/brotli"
echo "  - Optimiser la configuration TypeScript"

print_status "Optimisation terminée !"
