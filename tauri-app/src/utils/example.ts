// Exemple d'utilisation du client d'invocation typé
import TauriClient, { 
  getStealthStatus, 
  toggleStealth, 
  getImageAsBase64,
  resizeWindow 
} from './tauriClient';
import { COMMAND_NAMES } from './commands';

// ============================================================================
// EXEMPLES D'UTILISATION
// ============================================================================

/**
 * Exemple 1: Utilisation directe du client
 */
export async function exampleDirectClient() {
  try {
    // Invoke avec validation automatique
    const stealthStatus = await TauriClient.invoke(COMMAND_NAMES.GET_STEALTH_STATUS);
    console.log('Status furtif:', stealthStatus); // Type: boolean
    
    // Invoke avec arguments
    const imageData = await TauriClient.invokeWithArgs(
      COMMAND_NAMES.GET_IMAGE_AS_BASE64, 
      { imagePath: "/path/to/image.png" }
    );
    console.log('Image data:', imageData); // Type: string (data:image/...)
    
  } catch (error) {
    console.error('Erreur:', error);
  }
}

/**
 * Exemple 2: Utilisation des fonctions spécialisées
 */
export async function exampleSpecializedFunctions() {
  try {
    // Fonctions avec validation automatique
    const isStealthActive = await getStealthStatus();
    console.log('Mode furtif actif:', isStealthActive);
    
    await toggleStealth();
    console.log('Mode furtif basculé');
    
    const imageData = await getImageAsBase64("/path/to/image.png");
    console.log('Image chargée:', imageData.startsWith('data:image/'));
    
    await resizeWindow(800, 600);
    console.log('Fenêtre redimensionnée');
    
  } catch (error) {
    console.error('Erreur:', error);
  }
}

/**
 * Exemple 3: Gestion d'erreurs avec validation
 */
export async function exampleErrorHandling() {
  try {
    // Ceci va échouer car imagePath est vide
    await getImageAsBase64("");
  } catch (error) {
    if (error instanceof Error) {
      console.log('Erreur de validation:', error.message);
      // Affiche: "Le chemin de l'image est requis"
    }
  }
  
  try {
    // Ceci va échouer car width est négatif
    await resizeWindow(-100, 100);
  } catch (error) {
    if (error instanceof Error) {
      console.log('Erreur de validation:', error.message);
      // Affiche: "La largeur doit être positive"
    }
  }
}

/**
 * Exemple 4: Utilisation dans un composant React
 */
export function useStealthExample() {
  const handleToggleStealth = async () => {
    try {
      await toggleStealth();
      const newStatus = await getStealthStatus();
      console.log(`Mode furtif ${newStatus ? 'activé' : 'désactivé'}`);
    } catch (error) {
      console.error('Erreur lors du toggle:', error);
    }
  };
  
  return { handleToggleStealth };
}

// ============================================================================
// AVANTAGES DE CETTE APPROCHE
// ============================================================================

/*
✅ AVANTAGES :

1. **Type Safety** : TypeScript détecte les erreurs à la compilation
2. **Validation Automatique** : Zod valide les arguments et résultats
3. **Contrat Centralisé** : Un seul endroit pour définir les commandes
4. **Auto-complétion** : IDE suggère les bonnes commandes et arguments
5. **Refactoring Sécurisé** : Renommer une commande met à jour tous les usages
6. **Documentation Vivante** : Les types servent de documentation
7. **Tests Facilités** : Validation automatique des contrats

❌ AVANT (string literals) :
- invoke("get_stealth_status") // Erreur de frappe possible
- invoke("get_image_as_base64", { imagePath: 123 }) // Type incorrect
- Pas de validation des résultats

✅ APRÈS (client typé) :
- getStealthStatus() // Auto-complétion + validation
- getImageAsBase64("path") // Validation automatique
- Résultats typés et validés
*/
