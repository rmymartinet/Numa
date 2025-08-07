#!/bin/bash

echo "🎨 Optimisation des assets pour Numa..."

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

# Vérification de l'environnement
print_status "Vérification de l'environnement..."
if ! command -v node &> /dev/null; then
    print_error "Node.js n'est pas installé"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm n'est pas installé"
    exit 1
fi

# Optimisation des SVG
print_status "Optimisation des SVG..."
if command -v npx &> /dev/null; then
    if [ -f "svgo.config.js" ]; then
        find src/assets -name "*.svg" -exec npx svgo {} --config svgo.config.js \;
        print_success "SVG optimisés avec succès"
    else
        print_info "Configuration SVGO non trouvée, utilisation des paramètres par défaut"
        find src/assets -name "*.svg" -exec npx svgo {} \;
    fi
else
    print_error "npx n'est pas disponible"
fi

# Optimisation des images
print_status "Optimisation des images..."
if command -v convert &> /dev/null; then
    find src/assets -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" | while read -r file; do
        print_info "Optimisation de $file"
        convert "$file" -strip -quality 85 "$file"
    done
    print_success "Images optimisées avec succès"
else
    print_info "ImageMagick non installé, passage de l'optimisation d'images"
fi

# Compression des fichiers CSS
print_status "Compression des fichiers CSS..."
if [ -d "src/styles" ]; then
    find src/styles -name "*.css" | while read -r file; do
        print_info "Compression de $file"
        # Suppression des commentaires et espaces inutiles
        sed 's/\/\*.*?\*\///g' "$file" | tr -s ' ' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' > "${file}.tmp"
        mv "${file}.tmp" "$file"
    done
    print_success "CSS compressés avec succès"
fi

# Analyse de la taille des assets
print_status "Analyse de la taille des assets..."
if [ -d "src/assets" ]; then
    echo "Taille des assets:"
    du -sh src/assets/*
    echo ""
    echo "Top 5 des plus gros fichiers:"
    find src/assets -type f -exec du -h {} + | sort -hr | head -5
fi

# Nettoyage des fichiers temporaires
print_status "Nettoyage..."
find . -name "*.tmp" -delete 2>/dev/null || true
find . -name "*.bak" -delete 2>/dev/null || true

print_success "🎉 Optimisation des assets terminée !"
