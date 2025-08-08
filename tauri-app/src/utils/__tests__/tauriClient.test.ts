import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TauriClient, getStealthStatus, toggleStealth } from '../tauriClient';
import { COMMAND_NAMES } from '../commands';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';

describe('TauriClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('invoke', () => {
    it('should invoke command with validated args and result', async () => {
      const mockResult = { active: true };
      (invoke as any).mockResolvedValue(mockResult);

      const result = await TauriClient.invoke(COMMAND_NAMES.GET_STEALTH_STATUS);

      expect(invoke).toHaveBeenCalledWith(COMMAND_NAMES.GET_STEALTH_STATUS, {});
      expect(result).toEqual(mockResult);
    });

    it('should handle validation errors gracefully', async () => {
      const invalidResult = { invalid: 'data' };
      (invoke as any).mockResolvedValue(invalidResult);

      await expect(
        TauriClient.invoke(COMMAND_NAMES.GET_STEALTH_STATUS)
      ).rejects.toThrow();
    });

    it('should handle invoke errors', async () => {
      const error = new Error('Tauri error');
      (invoke as any).mockRejectedValue(error);

      await expect(
        TauriClient.invoke(COMMAND_NAMES.GET_STEALTH_STATUS)
      ).rejects.toThrow('Tauri error');
    });
  });

  describe('invokeVoid', () => {
    it('should invoke command without args', async () => {
      (invoke as any).mockResolvedValue(undefined);

      await TauriClient.invokeVoid(COMMAND_NAMES.TOGGLE_STEALTH);

      expect(invoke).toHaveBeenCalledWith(COMMAND_NAMES.TOGGLE_STEALTH, {});
    });
  });

  describe('invokeWithArgs', () => {
    it('should invoke command with args', async () => {
      const args = { width: 800, height: 600 };
      const mockResult = { success: true };
      (invoke as any).mockResolvedValue(mockResult);

      const result = await TauriClient.invokeWithArgs(
        COMMAND_NAMES.RESIZE_WINDOW,
        args
      );

      expect(invoke).toHaveBeenCalledWith(COMMAND_NAMES.RESIZE_WINDOW, args);
      expect(result).toEqual(mockResult);
    });
  });
});

describe('Specialized Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getStealthStatus', () => {
    it('should return stealth status', async () => {
      const mockResult = { active: true };
      (invoke as any).mockResolvedValue(mockResult);

      const result = await getStealthStatus();

      expect(invoke).toHaveBeenCalledWith(COMMAND_NAMES.GET_STEALTH_STATUS, {});
      expect(result).toEqual(mockResult);
    });
  });

  describe('toggleStealth', () => {
    it('should toggle stealth mode', async () => {
      const mockResult = { success: true };
      (invoke as any).mockResolvedValue(mockResult);

      const result = await toggleStealth();

      expect(invoke).toHaveBeenCalledWith(COMMAND_NAMES.TOGGLE_STEALTH, {});
      expect(result).toEqual(mockResult);
    });
  });
});
