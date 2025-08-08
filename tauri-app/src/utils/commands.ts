// Contrat centralisé des commandes Tauri
// Définit les noms, arguments et types de retour pour éviter la dérive de string literals

import { z } from 'zod';

// ============================================================================
// CONTRAT CENTRALISÉ DES COMMANDES TAURI
// ============================================================================

// Noms des commandes (évite les string literals)
export const COMMAND_NAMES = {
  // Capture d'écran
  CAPTURE_SCREEN: 'capture_screen',
  CAPTURE_AND_ANALYZE: 'capture_and_analyze',
  GET_IMAGE_AS_BASE64: 'get_image_as_base64',

  // Fenêtres
  CLOSE_ALL_WINDOWS: 'close_all_windows',
  START_WINDOW_DRAGGING: 'start_window_dragging',
  RESIZE_WINDOW: 'resize_window',
  PANEL_SHOW: 'panel_show',
  PANEL_HIDE: 'panel_hide',

  // Mode furtif
  TOGGLE_STEALTH: 'toggle_stealth_cmd',
  GET_STEALTH_STATUS: 'get_stealth_status',
  TEST_STEALTH_MANUAL: 'test_stealth_manual',
} as const;

export type CommandNameLiteral =
  (typeof COMMAND_NAMES)[keyof typeof COMMAND_NAMES];

// ============================================================================
// SCHÉMAS DE VALIDATION ZOD
// ============================================================================

// Arguments des commandes
export const CommandArgs = {
  [COMMAND_NAMES.GET_IMAGE_AS_BASE64]: z.object({
    imagePath: z.string().min(1, "Le chemin de l'image est requis"),
  }),

  [COMMAND_NAMES.RESIZE_WINDOW]: z.object({
    width: z.number().positive('La largeur doit être positive'),
    height: z.number().positive('La hauteur doit être positive'),
  }),

  [COMMAND_NAMES.TOGGLE_STEALTH]: z.object({}),
  [COMMAND_NAMES.GET_STEALTH_STATUS]: z.object({}),
  [COMMAND_NAMES.TEST_STEALTH_MANUAL]: z.object({}),
  [COMMAND_NAMES.CAPTURE_SCREEN]: z.object({}),
  [COMMAND_NAMES.CAPTURE_AND_ANALYZE]: z.object({}),
  [COMMAND_NAMES.CLOSE_ALL_WINDOWS]: z.object({}),
  [COMMAND_NAMES.START_WINDOW_DRAGGING]: z.object({}),
  [COMMAND_NAMES.PANEL_SHOW]: z.object({}),
  [COMMAND_NAMES.PANEL_HIDE]: z.object({}),
};

// Résultats des commandes
export const CommandResults = {
  [COMMAND_NAMES.GET_IMAGE_AS_BASE64]: z
    .string()
    .startsWith('data:', 'Doit être une URL data'),
  [COMMAND_NAMES.GET_STEALTH_STATUS]: z.boolean(),
  [COMMAND_NAMES.CAPTURE_SCREEN]: z
    .string()
    .min(1, 'Le chemin de capture est requis'),
  [COMMAND_NAMES.CAPTURE_AND_ANALYZE]: z.string(),
  [COMMAND_NAMES.TOGGLE_STEALTH]: z.void(),
  [COMMAND_NAMES.TEST_STEALTH_MANUAL]: z.void(),
  [COMMAND_NAMES.CLOSE_ALL_WINDOWS]: z.void(),
  [COMMAND_NAMES.START_WINDOW_DRAGGING]: z.void(),
  [COMMAND_NAMES.RESIZE_WINDOW]: z.void(),
  [COMMAND_NAMES.PANEL_SHOW]: z.void(),
  [COMMAND_NAMES.PANEL_HIDE]: z.void(),
};

// ============================================================================
// TYPES TYPESCRIPT
// ============================================================================

export type CommandArgsType<T extends CommandNameLiteral> = z.infer<
  (typeof CommandArgs)[T]
>;
export type CommandResultType<T extends CommandNameLiteral> = z.infer<
  (typeof CommandResults)[T]
>;

// Type pour toutes les commandes
export type Commands = {
  [K in CommandNameLiteral]: {
    args: CommandArgsType<K>;
    result: CommandResultType<K>;
  };
};

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Valide les arguments d'une commande
 */
export function validateCommandArgs<T extends CommandNameLiteral>(
  command: T,
  args: unknown
): unknown {
  return CommandArgs[command].parse(args);
}

/**
 * Valide le résultat d'une commande
 */
export function validateCommandResult<T extends CommandNameLiteral>(
  command: T,
  result: unknown
): unknown {
  return CommandResults[command].parse(result);
}

/**
 * Type guard pour vérifier si une commande existe
 */
export function isValidCommand(command: string): command is CommandNameLiteral {
  return Object.values(COMMAND_NAMES).includes(command as CommandNameLiteral);
}
