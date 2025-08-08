// Contrat centralisé des commandes Tauri
// Définit les noms, arguments et types de retour pour éviter la dérive de string literals

import { z } from 'zod';

// ============================================================================
// SCHEMAS DE VALIDATION
// ============================================================================

// Arguments pour les commandes
export const ImagePathSchema = z.object({
  imagePath: z.string().min(1, "Le chemin de l'image ne peut pas être vide"),
});

export const WindowSizeSchema = z.object({
  width: z.number().positive("La largeur doit être positive"),
  height: z.number().positive("La hauteur doit être positive"),
});

export const ResizeWindowArgsSchema = z.object({
  width: z.number().positive("La largeur doit être positive"),
  height: z.number().positive("La hauteur doit être positive"),
});

// Types de retour
export const DataUrlSchema = z.string().startsWith("data:", "Doit être une URL data valide");
export const FilePathSchema = z.string().min(1, "Le chemin de fichier ne peut pas être vide");
export const StealthStatusSchema = z.boolean();
export const VoidSchema = z.void();

// ============================================================================
// DÉFINITION DES COMMANDES
// ============================================================================

export interface TauriCommands {
  // Capture d'écran
  capture_screen: {
    args: z.ZodVoid;
    return: FilePathSchema;
  };
  
  capture_and_analyze: {
    args: z.ZodVoid;
    return: z.string();
  };
  
  get_image_as_base64: {
    args: ImagePathSchema;
    return: DataUrlSchema;
  };
  
  // Fenêtres
  panel_show: {
    args: z.ZodVoid;
    return: VoidSchema;
  };
  
  panel_hide: {
    args: z.ZodVoid;
    return: VoidSchema;
  };
  
  start_window_dragging: {
    args: z.ZodVoid;
    return: VoidSchema;
  };
  
  resize_window: {
    args: ResizeWindowArgsSchema;
    return: VoidSchema;
  };
  
  close_all_windows: {
    args: z.ZodVoid;
    return: VoidSchema;
  };
  
  // Mode furtif
  toggle_stealth_cmd: {
    args: z.ZodVoid;
    return: VoidSchema;
  };
  
  get_stealth_status: {
    args: z.ZodVoid;
    return: StealthStatusSchema;
  };
  
  test_stealth_manual: {
    args: z.ZodVoid;
    return: VoidSchema;
  };
}

// ============================================================================
// TYPES TYPESCRIPT
// ============================================================================

export type CommandName = keyof TauriCommands;
export type CommandArgs<T extends CommandName> = z.infer<TauriCommands[T]['args']>;
export type CommandReturn<T extends CommandName> = z.infer<TauriCommands[T]['return']>;

// ============================================================================
// FONCTIONS DE VALIDATION
// ============================================================================

export function validateArgs<T extends CommandName>(
  command: T,
  args: unknown
): CommandArgs<T> {
  const schema = TauriCommands[command].args;
  return schema.parse(args);
}

export function validateReturn<T extends CommandName>(
  command: T,
  result: unknown
): CommandReturn<T> {
  const schema = TauriCommands[command].return;
  return schema.parse(result);
}

// ============================================================================
// CONSTANTES DES NOMS DE COMMANDES
// ============================================================================

export const COMMAND_NAMES = {
  CAPTURE_SCREEN: 'capture_screen',
  CAPTURE_AND_ANALYZE: 'capture_and_analyze',
  GET_IMAGE_AS_BASE64: 'get_image_as_base64',
  PANEL_SHOW: 'panel_show',
  PANEL_HIDE: 'panel_hide',
  START_WINDOW_DRAGGING: 'start_window_dragging',
  RESIZE_WINDOW: 'resize_window',
  CLOSE_ALL_WINDOWS: 'close_all_windows',
  TOGGLE_STEALTH_CMD: 'toggle_stealth_cmd',
  GET_STEALTH_STATUS: 'get_stealth_status',
  TEST_STEALTH_MANUAL: 'test_stealth_manual',
} as const;

export type CommandNameLiteral = typeof COMMAND_NAMES[keyof typeof COMMAND_NAMES];
