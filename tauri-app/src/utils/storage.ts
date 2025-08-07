import React from 'react';

// Types pour les préférences utilisateur
export interface UserPreferences {
  activeTab: 'activity' | 'prompts' | 'settings';
  activeSettingsTab: 'settings' | 'app' | 'profile' | 'security' | 'billing';
  selectedPromptStyle: 'school' | 'meetings' | 'sales' | 'recruiting' | 'custom';
  defaultModel: 'gpt-4o' | 'gpt-4' | 'gpt-3.5-turbo';
  theme: 'light' | 'dark' | 'auto';
  autoSave: boolean;
  notifications: boolean;
}

// Valeurs par défaut
export const DEFAULT_PREFERENCES: UserPreferences = {
  activeTab: 'activity',
  activeSettingsTab: 'settings',
  selectedPromptStyle: 'meetings',
  defaultModel: 'gpt-4o',
  theme: 'light',
  autoSave: true,
  notifications: true,
};

// Classe pour gérer le stockage avec localStorage
class StorageManager {
  private prefix = 'numa_';

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async getPreferences(): Promise<UserPreferences> {
    try {
      const stored = localStorage.getItem(this.getKey('preferences'));
      if (stored) {
        const preferences = JSON.parse(stored) as Partial<UserPreferences>;
        return { ...DEFAULT_PREFERENCES, ...preferences };
      }
      return DEFAULT_PREFERENCES;
    } catch (error) {
      console.error('Erreur lors du chargement des préférences:', error);
      return DEFAULT_PREFERENCES;
    }
  }

  async setPreferences(preferences: Partial<UserPreferences>): Promise<void> {
    try {
      const current = await this.getPreferences();
      const updated = { ...current, ...preferences };
      localStorage.setItem(this.getKey('preferences'), JSON.stringify(updated));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des préférences:', error);
    }
  }

  async getItem<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const stored = localStorage.getItem(this.getKey(key));
      if (stored) {
        return JSON.parse(stored) as T;
      }
      return defaultValue;
    } catch (error) {
      console.error(`Erreur lors du chargement de ${key}:`, error);
      return defaultValue;
    }
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      localStorage.setItem(this.getKey(key), JSON.stringify(value));
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde de ${key}:`, error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.error(`Erreur lors de la suppression de ${key}:`, error);
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Erreur lors du nettoyage du stockage:', error);
    }
  }
}

// Instance singleton
export const storageManager = new StorageManager();

// Export de la classe pour les tests
export { StorageManager };

// Hooks utilitaires pour React
export const useLocalStorage = <T>(key: string, defaultValue: T) => {
  const [value, setValue] = React.useState<T>(defaultValue);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadValue = async () => {
      try {
        const stored = await storageManager.getItem(key, defaultValue);
        setValue(stored);
      } catch (error) {
        console.error(`Erreur lors du chargement de ${key}:`, error);
        setValue(defaultValue);
      } finally {
        setIsLoading(false);
      }
    };

    loadValue();
  }, [key, defaultValue]);

  const updateValue = React.useCallback(async (newValue: T) => {
    try {
      await storageManager.setItem(key, newValue);
      setValue(newValue);
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde de ${key}:`, error);
    }
  }, [key]);

  return [value, updateValue, isLoading] as const;
};

export const usePreferences = () => {
  const [preferences, setPreferences] = React.useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadPreferences = async () => {
      try {
        const stored = await storageManager.getPreferences();
        setPreferences(stored);
      } catch (error) {
        console.error('Erreur lors du chargement des préférences:', error);
        setPreferences(DEFAULT_PREFERENCES);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, []);

  const updatePreferences = React.useCallback(async (updates: Partial<UserPreferences>) => {
    try {
      await storageManager.setPreferences(updates);
      setPreferences(prev => ({ ...prev, ...updates }));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des préférences:', error);
    }
  }, []);

  return [preferences, updatePreferences, isLoading] as const;
}; 