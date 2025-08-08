import { invoke } from '@tauri-apps/api/core';
import { 
  COMMAND_NAMES, 
  CommandNameLiteral, 
  validateCommandArgs, 
  validateCommandResult
} from './commands';

// ============================================================================
// CLIENT D'INVOCATION TYPIÉ
// ============================================================================

/**
 * Client d'invocation typé pour les commandes Tauri
 * Valide automatiquement les arguments et résultats avec Zod
 */
export class TauriClient {
  /**
   * Invoke une commande avec validation automatique
   */
  static async invoke<T extends CommandNameLiteral>(
    command: T,
    args?: Record<string, any>
  ): Promise<any> {
    try {
      // Valider les arguments si fournis
      const validatedArgs = args ? validateCommandArgs(command, args) : {};
      
      // Appeler la commande Tauri
      const result = await invoke(command, validatedArgs as any);
      
      // Valider le résultat
      const validatedResult = validateCommandResult(command, result);
      
      return validatedResult;
    } catch (error) {
      console.error(`Erreur lors de l'invocation de ${command}:`, error);
      throw error;
    }
  }

  /**
   * Invoke une commande sans arguments
   */
  static async invokeVoid<T extends CommandNameLiteral>(
    command: T
  ): Promise<void> {
    return this.invoke(command);
  }

  /**
   * Invoke une commande avec arguments
   */
  static async invokeWithArgs<T extends CommandNameLiteral>(
    command: T,
    args: Record<string, any>
  ): Promise<any> {
    return this.invoke(command, args);
  }
}

// ============================================================================
// FONCTIONS SPÉCIALISÉES POUR CHAQUE COMMANDE
// ============================================================================

// Capture d'écran
export const captureScreen = () => 
  TauriClient.invoke(COMMAND_NAMES.CAPTURE_SCREEN);

export const captureAndAnalyze = () => 
  TauriClient.invoke(COMMAND_NAMES.CAPTURE_AND_ANALYZE);

export const getImageAsBase64 = (imagePath: string) => 
  TauriClient.invokeWithArgs(COMMAND_NAMES.GET_IMAGE_AS_BASE64, { imagePath });

// Fenêtres
export const closeAllWindows = () => 
  TauriClient.invokeVoid(COMMAND_NAMES.CLOSE_ALL_WINDOWS);

export const startWindowDragging = () => 
  TauriClient.invokeVoid(COMMAND_NAMES.START_WINDOW_DRAGGING);

export const resizeWindow = (width: number, height: number) => 
  TauriClient.invokeWithArgs(COMMAND_NAMES.RESIZE_WINDOW, { width, height });

export const panelShow = () => 
  TauriClient.invokeVoid(COMMAND_NAMES.PANEL_SHOW);

export const panelHide = () => 
  TauriClient.invokeVoid(COMMAND_NAMES.PANEL_HIDE);

// Mode furtif
export const toggleStealth = () => 
  TauriClient.invokeVoid(COMMAND_NAMES.TOGGLE_STEALTH);

export const getStealthStatus = () => 
  TauriClient.invoke(COMMAND_NAMES.GET_STEALTH_STATUS);

export const testStealthManual = () => 
  TauriClient.invokeVoid(COMMAND_NAMES.TEST_STEALTH_MANUAL);

// ============================================================================
// EXPORT PAR DÉFAUT
// ============================================================================

export default TauriClient;
