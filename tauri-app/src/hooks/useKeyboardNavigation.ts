import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardNavigation(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ignorer si on est dans un input ou textarea
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch =
          shortcut.ctrlKey === undefined || event.ctrlKey === shortcut.ctrlKey;
        const shiftMatch =
          shortcut.shiftKey === undefined ||
          event.shiftKey === shortcut.shiftKey;
        const altMatch =
          shortcut.altKey === undefined || event.altKey === shortcut.altKey;
        const metaMatch =
          shortcut.metaKey === undefined || event.metaKey === shortcut.metaKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    // Fonction utilitaire pour formater les raccourcis pour l'affichage
    formatShortcut: (shortcut: KeyboardShortcut): string => {
      const parts: string[] = [];

      if (shortcut.ctrlKey) parts.push('Ctrl');
      if (shortcut.shiftKey) parts.push('Shift');
      if (shortcut.altKey) parts.push('Alt');
      if (shortcut.metaKey) parts.push('Cmd');

      parts.push(shortcut.key.toUpperCase());

      return parts.join(' + ');
    },
  };
}

// Raccourcis prédéfinis pour l'application
export const APP_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: '1',
    action: () => {
      // Naviguer vers l'onglet Activity
      const event = new CustomEvent('navigate-tab', { detail: 'activity' });
      window.dispatchEvent(event);
    },
    description: "Aller à l'onglet Activity",
  },
  {
    key: '2',
    action: () => {
      // Naviguer vers l'onglet Personalize
      const event = new CustomEvent('navigate-tab', { detail: 'prompts' });
      window.dispatchEvent(event);
    },
    description: "Aller à l'onglet Personalize",
  },
  {
    key: '3',
    action: () => {
      // Naviguer vers l'onglet Settings
      const event = new CustomEvent('navigate-tab', { detail: 'settings' });
      window.dispatchEvent(event);
    },
    description: "Aller à l'onglet Settings",
  },
  {
    key: 'c',
    ctrlKey: true,
    action: () => {
      // Capture d'écran
      const event = new CustomEvent('capture-screen');
      window.dispatchEvent(event);
    },
    description: "Capturer l'écran",
  },
  {
    key: 'g',
    ctrlKey: true,
    shiftKey: true,
    action: () => {
      // Capture et analyse
      const event = new CustomEvent('capture-and-analyze');
      window.dispatchEvent(event);
    },
    description: 'Capturer et analyser',
  },
  {
    key: 't',
    ctrlKey: true,
    action: () => {
      // Toggle thème
      const event = new CustomEvent('toggle-theme');
      window.dispatchEvent(event);
    },
    description: 'Changer de thème',
  },
  {
    key: 'k',
    ctrlKey: true,
    metaKey: true, // Cmd+K sur Mac
    action: () => {
      // Toggle mode furtif
      const event = new CustomEvent('toggle-stealth');
      window.dispatchEvent(event);
    },
    description: 'Mode furtif (invisible aux captures)',
  },
  {
    key: 'Escape',
    action: () => {
      // Fermer la bulle flottante
      const event = new CustomEvent('close-floating-bubble');
      window.dispatchEvent(event);
    },
    description: 'Fermer la bulle',
  },
  {
    key: '?',
    action: () => {
      // Afficher l'aide
      const event = new CustomEvent('show-help');
      window.dispatchEvent(event);
    },
    description: "Afficher l'aide",
  },
];
