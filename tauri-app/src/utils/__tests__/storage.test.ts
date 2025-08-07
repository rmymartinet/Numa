import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageManager, DEFAULT_PREFERENCES } from '../storage';

describe('StorageManager', () => {
  let storageManager: StorageManager;
  let mockLocalStorage: any;

  beforeEach(() => {
    mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };

    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    storageManager = new StorageManager();
  });

  describe('getPreferences', () => {
    it('should return default preferences when no stored data', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = await storageManager.getPreferences();

      expect(result).toEqual(DEFAULT_PREFERENCES);
    });

    it('should return merged preferences when stored data exists', async () => {
      const storedData = { activeTab: 'prompts' as const };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedData));

      const result = await storageManager.getPreferences();

      expect(result).toEqual({
        ...DEFAULT_PREFERENCES,
        activeTab: 'prompts',
      });
    });

    it('should handle JSON parse errors', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      const result = await storageManager.getPreferences();

      expect(result).toEqual(DEFAULT_PREFERENCES);
    });
  });

  describe('setPreferences', () => {
    it('should save preferences to localStorage', async () => {
      const updates = { activeTab: 'settings' as const };

      await storageManager.setPreferences(updates);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'numa_preferences',
        expect.any(String)
      );
    });
  });

  describe('getItem', () => {
    it('should return stored value', async () => {
      const storedValue = { test: 'data' };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedValue));

      const result = await storageManager.getItem('test', {});

      expect(result).toEqual(storedValue);
    });

    it('should return default value when no stored data', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = await storageManager.getItem('test', 'default');

      expect(result).toBe('default');
    });
  });

  describe('setItem', () => {
    it('should save item to localStorage', async () => {
      const value = { test: 'data' };

      await storageManager.setItem('test', value);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'numa_test',
        JSON.stringify(value)
      );
    });
  });

  describe('removeItem', () => {
    it('should remove item from localStorage', async () => {
      await storageManager.removeItem('test');

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('numa_test');
    });
  });

  describe('clear', () => {
    it('should clear all numa items from localStorage', async () => {
      Object.keys = vi.fn().mockReturnValue(['numa_test1', 'other_key', 'numa_test2']);

      await storageManager.clear();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('numa_test1');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('numa_test2');
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalledWith('other_key');
    });
  });
}); 