import { useState, useEffect } from 'react';

interface AccessibilityPreferences {
  prefersReducedMotion: boolean;
  prefersReducedData: boolean;
  prefersColorScheme: 'light' | 'dark' | 'no-preference';
  prefersContrast: 'no-preference' | 'high' | 'low';
  isHighContrast: boolean;
  isReducedMotion: boolean;
}

export function useAccessibility(): AccessibilityPreferences {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>({
    prefersReducedMotion: false,
    prefersReducedData: false,
    prefersColorScheme: 'no-preference',
    prefersContrast: 'no-preference',
    isHighContrast: false,
    isReducedMotion: false,
  });

  useEffect(() => {
    // Fonction pour détecter les préférences
    const detectPreferences = () => {
      // Prefers reduced motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      // Prefers reduced data
      const prefersReducedData = window.matchMedia('(prefers-reduced-data: reduce)').matches;
      
      // Prefers color scheme
      const prefersColorScheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      
      // Prefers contrast
      const prefersContrast = window.matchMedia('(prefers-contrast: high)').matches ? 'high' : 
                             window.matchMedia('(prefers-contrast: low)').matches ? 'low' : 'no-preference';
      
      // High contrast mode
      const isHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
      
      // Reduced motion (pour les animations CSS)
      const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      setPreferences({
        prefersReducedMotion,
        prefersReducedData,
        prefersColorScheme,
        prefersContrast,
        isHighContrast,
        isReducedMotion,
      });
    };

    // Détecter les préférences initiales
    detectPreferences();

    // Écouter les changements de préférences
    const mediaQueries = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-reduced-data: reduce)'),
      window.matchMedia('(prefers-color-scheme: dark)'),
      window.matchMedia('(prefers-contrast: high)'),
      window.matchMedia('(prefers-contrast: low)'),
    ];

    const handleChange = () => {
      detectPreferences();
    };

    // Ajouter les listeners
    mediaQueries.forEach(query => {
      query.addEventListener('change', handleChange);
    });

    // Cleanup
    return () => {
      mediaQueries.forEach(query => {
        query.removeEventListener('change', handleChange);
      });
    };
  }, []);

  return preferences;
}

// Hook pour les animations conditionnelles
export function useReducedMotion() {
  const { isReducedMotion } = useAccessibility();
  return isReducedMotion;
}

// Hook pour le contraste élevé
export function useHighContrast() {
  const { isHighContrast } = useAccessibility();
  return isHighContrast;
}

// Hook pour les préférences de couleur
export function useColorScheme() {
  const { prefersColorScheme } = useAccessibility();
  return prefersColorScheme;
}

// Fonction utilitaire pour les classes CSS conditionnelles
export function getAccessibilityClasses(preferences: AccessibilityPreferences) {
  const classes: string[] = [];

  if (preferences.isReducedMotion) {
    classes.push('motion-reduce');
  }

  if (preferences.isHighContrast) {
    classes.push('high-contrast');
  }

  return classes.join(' ');
}
