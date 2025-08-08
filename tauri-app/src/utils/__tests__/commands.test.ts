import { describe, it, expect } from 'vitest';
import {
  COMMAND_NAMES,
  CommandArgs,
  CommandResults,
  validateCommandArgs,
  validateCommandResult,
  isValidCommand,
} from '../commands';

describe('Commands Module', () => {
  describe('COMMAND_NAMES', () => {
    it('should have all required command names', () => {
      expect(COMMAND_NAMES.GET_STEALTH_STATUS).toBe('get_stealth_status_cmd');
      expect(COMMAND_NAMES.TOGGLE_STEALTH).toBe('toggle_stealth_cmd');
      expect(COMMAND_NAMES.CAPTURE_SCREEN).toBe('capture_screen_cmd');
      expect(COMMAND_NAMES.GET_IMAGE_AS_BASE64).toBe('get_image_as_base64_cmd');
      expect(COMMAND_NAMES.PANEL_SHOW).toBe('panel_show_cmd');
      expect(COMMAND_NAMES.PANEL_HIDE).toBe('panel_hide_cmd');
      expect(COMMAND_NAMES.RESIZE_WINDOW).toBe('resize_window_cmd');
    });
  });

  describe('CommandArgs Validation', () => {
    it('should validate valid resize window args', () => {
      const validArgs = { width: 800, height: 600 };
      const result = validateCommandArgs(COMMAND_NAMES.RESIZE_WINDOW, validArgs);
      expect(result).toEqual(validArgs);
    });

    it('should reject invalid resize window args', () => {
      const invalidArgs = { width: 'invalid', height: -100 };
      expect(() =>
        validateCommandArgs(COMMAND_NAMES.RESIZE_WINDOW, invalidArgs)
      ).toThrow();
    });

    it('should validate empty args for commands without args', () => {
      const result = validateCommandArgs(COMMAND_NAMES.GET_STEALTH_STATUS, {});
      expect(result).toEqual({});
    });
  });

  describe('CommandResults Validation', () => {
    it('should validate valid stealth status result', () => {
      const validResult = { active: true };
      const result = validateCommandResult(
        COMMAND_NAMES.GET_STEALTH_STATUS,
        validResult
      );
      expect(result).toEqual(validResult);
    });

    it('should reject invalid stealth status result', () => {
      const invalidResult = { active: 'invalid' };
      expect(() =>
        validateCommandResult(COMMAND_NAMES.GET_STEALTH_STATUS, invalidResult)
      ).toThrow();
    });

    it('should validate valid toggle stealth result', () => {
      const validResult = { success: true };
      const result = validateCommandResult(
        COMMAND_NAMES.TOGGLE_STEALTH,
        validResult
      );
      expect(result).toEqual(validResult);
    });
  });

  describe('isValidCommand', () => {
    it('should return true for valid commands', () => {
      expect(isValidCommand('get_stealth_status_cmd')).toBe(true);
      expect(isValidCommand('toggle_stealth_cmd')).toBe(true);
      expect(isValidCommand('capture_screen_cmd')).toBe(true);
    });

    it('should return false for invalid commands', () => {
      expect(isValidCommand('invalid_command')).toBe(false);
      expect(isValidCommand('')).toBe(false);
      expect(isValidCommand('get_stealth_status')).toBe(false);
    });
  });

  describe('Zod Schemas', () => {
    describe('ResizeWindowArgs', () => {
      it('should accept valid dimensions', () => {
        const args = { width: 1920, height: 1080 };
        expect(() => CommandArgs[COMMAND_NAMES.RESIZE_WINDOW].parse(args)).not.toThrow();
      });

      it('should reject negative dimensions', () => {
        const args = { width: -100, height: 600 };
        expect(() => CommandArgs[COMMAND_NAMES.RESIZE_WINDOW].parse(args)).toThrow();
      });

      it('should reject non-numeric dimensions', () => {
        const args = { width: 'invalid', height: 600 };
        expect(() => CommandArgs[COMMAND_NAMES.RESIZE_WINDOW].parse(args)).toThrow();
      });
    });

    describe('GetStealthStatusResult', () => {
      it('should accept valid boolean status', () => {
        const result = true;
        expect(() => CommandResults[COMMAND_NAMES.GET_STEALTH_STATUS].parse(result)).not.toThrow();
      });

      it('should reject non-boolean status', () => {
        const result = 'true';
        expect(() => CommandResults[COMMAND_NAMES.GET_STEALTH_STATUS].parse(result)).toThrow();
      });
    });

    describe('ToggleStealthResult', () => {
      it('should accept void result', () => {
        const result = undefined;
        expect(() => CommandResults[COMMAND_NAMES.TOGGLE_STEALTH].parse(result)).not.toThrow();
      });
    });
  });
});
