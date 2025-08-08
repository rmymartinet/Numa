import { invoke } from '@tauri-apps/api/core';

// Interface pour les données sensibles
export interface SensitiveData {
  tokens?: {
    accessToken?: string;
    refreshToken?: string;
    sessionToken?: string;
  };
  ids?: {
    userId?: string;
    deviceId?: string;
    sessionId?: string;
  };
  keys?: {
    encryptionKey?: string;
    apiKey?: string;
  };
}

// Service de stockage sécurisé utilisant Tauri Keychain
export class SecureStorage {
  private static instance: SecureStorage;
  private isAvailable: boolean = false;

  private constructor() {
    this.checkAvailability();
  }

  static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage();
    }
    return SecureStorage.instance;
  }

  // Vérifier si le Keychain est disponible
  private async checkAvailability(): Promise<void> {
    try {
      // Test simple pour vérifier l'accès au Keychain
      await this.set('test', 'test-value');
      await this.delete('test');
      this.isAvailable = true;
    } catch (error) {
      console.warn('Tauri Keychain non disponible, fallback sur localStorage:', error);
      this.isAvailable = false;
    }
  }

  // Stocker une valeur de manière sécurisée
  async set(key: string, value: string): Promise<void> {
    if (this.isAvailable) {
      try {
        await invoke('secure_store', { key, value });
      } catch (error) {
        console.error('Erreur lors du stockage sécurisé:', error);
        throw error;
      }
    } else {
      // Fallback sur localStorage avec préfixe
      localStorage.setItem(`secure_${key}`, value);
    }
  }

  // Récupérer une valeur de manière sécurisée
  async get(key: string): Promise<string | null> {
    if (this.isAvailable) {
      try {
        return await invoke('secure_load', { key });
      } catch (error) {
        console.error('Erreur lors de la récupération sécurisée:', error);
        return null;
      }
    } else {
      // Fallback sur localStorage
      return localStorage.getItem(`secure_${key}`);
    }
  }

  // Supprimer une valeur de manière sécurisée
  async delete(key: string): Promise<void> {
    if (this.isAvailable) {
      try {
        await invoke('secure_delete', { key });
      } catch (error) {
        console.error('Erreur lors de la suppression sécurisée:', error);
        throw error;
      }
    } else {
      // Fallback sur localStorage
      localStorage.removeItem(`secure_${key}`);
    }
  }

  // Stocker des tokens de manière sécurisée
  async storeTokens(tokens: SensitiveData['tokens']): Promise<void> {
    if (!tokens) return;

    const promises: Promise<void>[] = [];

    if (tokens.accessToken) {
      promises.push(this.set('access_token', tokens.accessToken));
    }
    if (tokens.refreshToken) {
      promises.push(this.set('refresh_token', tokens.refreshToken));
    }
    if (tokens.sessionToken) {
      promises.push(this.set('session_token', tokens.sessionToken));
    }

    await Promise.all(promises);
  }

  // Récupérer les tokens de manière sécurisée
  async getTokens(): Promise<SensitiveData['tokens']> {
    const [accessToken, refreshToken, sessionToken] = await Promise.all([
      this.get('access_token'),
      this.get('refresh_token'),
      this.get('session_token'),
    ]);

    return {
      accessToken: accessToken || undefined,
      refreshToken: refreshToken || undefined,
      sessionToken: sessionToken || undefined,
    };
  }

  // Stocker des IDs de manière sécurisée
  async storeIds(ids: SensitiveData['ids']): Promise<void> {
    if (!ids) return;

    const promises: Promise<void>[] = [];

    if (ids.userId) {
      promises.push(this.set('user_id', ids.userId));
    }
    if (ids.deviceId) {
      promises.push(this.set('device_id', ids.deviceId));
    }
    if (ids.sessionId) {
      promises.push(this.set('session_id', ids.sessionId));
    }

    await Promise.all(promises);
  }

  // Récupérer les IDs de manière sécurisée
  async getIds(): Promise<SensitiveData['ids']> {
    const [userId, deviceId, sessionId] = await Promise.all([
      this.get('user_id'),
      this.get('device_id'),
      this.get('session_id'),
    ]);

    return {
      userId: userId || undefined,
      deviceId: deviceId || undefined,
      sessionId: sessionId || undefined,
    };
  }

  // Stocker des clés de manière sécurisée
  async storeKeys(keys: SensitiveData['keys']): Promise<void> {
    if (!keys) return;

    const promises: Promise<void>[] = [];

    if (keys.encryptionKey) {
      promises.push(this.set('encryption_key', keys.encryptionKey));
    }
    if (keys.apiKey) {
      promises.push(this.set('api_key', keys.apiKey));
    }

    await Promise.all(promises);
  }

  // Récupérer les clés de manière sécurisée
  async getKeys(): Promise<SensitiveData['keys']> {
    const [encryptionKey, apiKey] = await Promise.all([
      this.get('encryption_key'),
      this.get('api_key'),
    ]);

    return {
      encryptionKey: encryptionKey || undefined,
      apiKey: apiKey || undefined,
    };
  }

  // Nettoyer toutes les données sensibles
  async clearAll(): Promise<void> {
    const keys = [
      'access_token', 'refresh_token', 'session_token',
      'user_id', 'device_id', 'session_id',
      'encryption_key', 'api_key',
    ];

    const promises = keys.map(key => this.delete(key));
    await Promise.all(promises);
  }

  // Vérifier si des données sensibles existent
  async hasSensitiveData(): Promise<boolean> {
    const tokens = await this.getTokens();
    const ids = await this.getIds();
    const keys = await this.getKeys();

    return !!(tokens?.accessToken || tokens?.refreshToken || tokens?.sessionToken ||
              ids?.userId || ids?.deviceId || ids?.sessionId ||
              keys?.encryptionKey || keys?.apiKey);
  }
}

// Instance globale
export const secureStorage = SecureStorage.getInstance();

// Hook React pour le stockage sécurisé
export function useSecureStorage() {
  const storeTokens = async (tokens: SensitiveData['tokens']) => {
    await secureStorage.storeTokens(tokens);
  };

  const getTokens = async () => {
    return await secureStorage.getTokens();
  };

  const storeIds = async (ids: SensitiveData['ids']) => {
    await secureStorage.storeIds(ids);
  };

  const getIds = async () => {
    return await secureStorage.getIds();
  };

  const storeKeys = async (keys: SensitiveData['keys']) => {
    await secureStorage.storeKeys(keys);
  };

  const getKeys = async () => {
    return await secureStorage.getKeys();
  };

  const clearAll = async () => {
    await secureStorage.clearAll();
  };

  const hasSensitiveData = async () => {
    return await secureStorage.hasSensitiveData();
  };

  return {
    storeTokens,
    getTokens,
    storeIds,
    getIds,
    storeKeys,
    getKeys,
    clearAll,
    hasSensitiveData,
  };
}
