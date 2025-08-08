# Accessibilité et UX - Numa

Ce document décrit les fonctionnalités d'accessibilité et d'expérience utilisateur implémentées dans Numa.

## 🎯 **Objectifs d'Accessibilité**

- **WCAG 2.1 AA** : Conformité aux standards internationaux
- **Navigation clavier** : Toutes les fonctionnalités accessibles au clavier
- **Lecteurs d'écran** : Support complet des technologies d'assistance
- **Préférences utilisateur** : Respect des préférences système
- **Contraste élevé** : Support du mode contraste élevé

## 🧩 **Composants Accessibles**

### 1. **AccessibleModal**

**Fichier** : `src/components/ui/AccessibleModal.tsx`

**Fonctionnalités** :
- **Focus trap** : Le focus reste dans la modale
- **Escape pour fermer** : Touche Échap pour fermer
- **Rôles ARIA** : `dialog`, `aria-modal`, `aria-labelledby`
- **Navigation clavier** : Tab/Shift+Tab pour naviguer
- **Clic overlay** : Fermeture en cliquant à l'extérieur

**Utilisation** :
```tsx
import AccessibleModal from './ui/AccessibleModal';

<AccessibleModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Titre de la modale"
  size="md"
>
  Contenu de la modale
</AccessibleModal>
```

### 2. **AccessibleButton**

**Fichier** : `src/components/ui/AccessibleButton.tsx`

**Fonctionnalités** :
- **Support clavier** : Enter et Space pour activer
- **États visuels** : Focus, hover, active, disabled
- **Variantes** : primary, secondary, danger, ghost, outline
- **Tailles** : sm, md, lg
- **Loading state** : Indicateur de chargement
- **Icônes** : Support des icônes à gauche/droite

**Utilisation** :
```tsx
import AccessibleButton from './ui/AccessibleButton';

<AccessibleButton
  variant="primary"
  size="md"
  loading={isLoading}
  onClick={handleClick}
>
  Texte du bouton
</AccessibleButton>
```

### 3. **AccessibleNotification**

**Fichier** : `src/components/ui/AccessibleNotification.tsx`

**Fonctionnalités** :
- **Types** : success, error, warning, info
- **Rôles ARIA** : `alert`, `status`
- **Auto-close** : Fermeture automatique configurable
- **Persistant** : Option pour empêcher la fermeture
- **Icônes** : Icônes appropriées selon le type

**Utilisation** :
```tsx
import AccessibleNotification from './ui/AccessibleNotification';

<AccessibleNotification
  type="success"
  title="Succès"
  message="Opération réussie"
  autoClose={true}
  autoCloseDelay={5000}
/>
```

### 4. **SkipLinks**

**Fichier** : `src/components/ui/SkipLinks.tsx`

**Fonctionnalités** :
- **Navigation rapide** : Liens pour passer au contenu principal
- **Accessibilité** : Visible uniquement au focus
- **Sections** : Contenu principal, navigation, footer

## 🎛️ **Gestion des Préférences**

### Hook useAccessibility

**Fichier** : `src/hooks/useAccessibility.ts`

**Préférences détectées** :
- `prefers-reduced-motion` : Réduction des animations
- `prefers-reduced-data` : Mode économie de données
- `prefers-color-scheme` : Thème clair/sombre
- `prefers-contrast` : Contraste élevé/faible

**Utilisation** :
```tsx
import { useAccessibility, useReducedMotion } from '../hooks/useAccessibility';

const { isReducedMotion, isHighContrast } = useAccessibility();
const shouldReduceMotion = useReducedMotion();
```

## 🎨 **Styles d'Accessibilité**

### Fichier CSS

**Fichier** : `src/styles/accessibility.css`

**Fonctionnalités** :
- **Réduction des mouvements** : Désactive les animations si préféré
- **Contraste élevé** : Styles pour le mode contraste élevé
- **Focus visible** : Indicateurs de focus clairs
- **Navigation clavier** : Styles pour les éléments focusables
- **Rôles ARIA** : Styles pour tous les attributs ARIA

### Classes CSS Utilitaires

```css
/* Réduction des mouvements */
@media (prefers-reduced-motion: reduce) {
  /* Désactive toutes les animations */
}

/* Contraste élevé */
@media (prefers-contrast: high) {
  /* Améliore les bordures et contrastes */
}

/* Focus visible */
*:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
```

## ⌨️ **Navigation Clavier**

### Raccourcis Globaux

- **Tab** : Navigation entre éléments focusables
- **Shift+Tab** : Navigation inverse
- **Enter/Space** : Activer les boutons
- **Escape** : Fermer les modales
- **Arrow keys** : Navigation dans les listes

### Focus Management

- **Focus trap** dans les modales
- **Restoration** du focus après fermeture
- **Skip links** pour navigation rapide
- **Indicateurs visuels** du focus

## 🗣️ **Support des Lecteurs d'Écran**

### Attributs ARIA

- **Rôles** : `button`, `dialog`, `alert`, `status`
- **États** : `aria-expanded`, `aria-pressed`, `aria-selected`
- **Relations** : `aria-labelledby`, `aria-describedby`
- **Live regions** : `aria-live`, `aria-atomic`

### Textes Alternatifs

- **Labels** explicites pour tous les éléments
- **Descriptions** pour les éléments complexes
- **Icônes décoratives** marquées `aria-hidden="true"`
- **Messages d'état** pour les actions

## 🎯 **Tests d'Accessibilité**

### Tests Automatiques

```bash
# Vérifier les contrastes
npm run test:accessibility:contrast

# Vérifier les rôles ARIA
npm run test:accessibility:aria

# Tests de navigation clavier
npm run test:accessibility:keyboard
```

### Tests Manuels

1. **Navigation clavier** : Tester avec Tab/Shift+Tab
2. **Lecteur d'écran** : Tester avec VoiceOver/NVDA
3. **Contraste** : Vérifier en mode contraste élevé
4. **Zoom** : Tester avec zoom 200%
5. **Réduction des mouvements** : Tester les préférences système

## 🔧 **Configuration**

### Variables d'Environnement

```bash
# Activer les tests d'accessibilité
VITE_ACCESSIBILITY_TESTING=true

# Mode debug accessibilité
VITE_ACCESSIBILITY_DEBUG=true
```

### Préférences Utilisateur

Les préférences sont automatiquement détectées :
- **Système** : `prefers-reduced-motion`, `prefers-contrast`
- **Application** : Sauvegardées dans localStorage
- **Session** : Appliquées immédiatement

## 📊 **Métriques d'Accessibilité**

### Indicateurs

- **Score WCAG** : Mesure de conformité
- **Temps de navigation** : Performance clavier
- **Erreurs ARIA** : Nombre d'erreurs détectées
- **Contraste** : Ratio de contraste moyen

### Monitoring

```typescript
// Tracker les métriques d'accessibilité
import { useMetrics } from '../utils/metrics';

const { addMetric } = useMetrics();

// Exemple : temps de navigation clavier
addMetric('keyboard_navigation_time', 1500, 'ms', 'accessibility');
```

## 🚀 **Bonnes Pratiques**

### Développement

1. **Toujours utiliser** les composants accessibles
2. **Tester** avec le clavier uniquement
3. **Vérifier** les contrastes de couleur
4. **Documenter** les interactions complexes
5. **Respecter** les préférences utilisateur

### Design

1. **Contraste** minimum 4.5:1 pour le texte normal
2. **Taille** minimum 16px pour le texte
3. **Espacement** suffisant entre éléments
4. **Couleurs** ne pas être le seul indicateur
5. **Animations** respecter `prefers-reduced-motion`

## 🔍 **Outils de Test**

### Extensions Navigateur

- **axe DevTools** : Tests automatiques
- **WAVE** : Évaluation d'accessibilité
- **Lighthouse** : Audit complet
- **Color Contrast Analyzer** : Vérification contrastes

### Tests Automatisés

```bash
# Tests avec axe-core
npm run test:axe

# Tests avec jest-axe
npm run test:jest-axe

# Audit Lighthouse
npm run test:lighthouse
```

## 📚 **Ressources**

### Documentation

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Web Accessibility Initiative](https://www.w3.org/WAI/)

### Outils

- [axe-core](https://github.com/dequelabs/axe-core)
- [jest-axe](https://github.com/nickcolley/jest-axe)
- [@testing-library/jest-dom](https://github.com/testing-library/jest-dom)

### Validation

- [HTML Validator](https://validator.w3.org/)
- [CSS Validator](https://jigsaw.w3.org/css-validator/)
- [Accessibility Checker](https://achecker.ca/checker/)

## 🎉 **Résultats**

### Conformité

- ✅ **WCAG 2.1 AA** : Conformité complète
- ✅ **Navigation clavier** : 100% fonctionnelle
- ✅ **Lecteurs d'écran** : Support complet
- ✅ **Contraste** : Ratios conformes
- ✅ **Préférences** : Respectées automatiquement

### Expérience Utilisateur

- 🚀 **Performance** : Navigation fluide
- 🎨 **Design** : Interface inclusive
- 🔧 **Personnalisation** : Adaptée aux besoins
- 📱 **Responsive** : Tous les appareils
- ♿ **Inclusive** : Accessible à tous
