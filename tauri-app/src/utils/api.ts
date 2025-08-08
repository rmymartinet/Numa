// src/utils/api.ts
// DEPRECATED: Utilisez tauriClient.ts à la place
// Ce fichier est conservé pour la compatibilité

import {
  getStealthStatus as getStealthStatusNew,
  toggleStealth as toggleStealthNew,
  captureScreen as captureScreenNew,
  getImageAsBase64 as getImageAsBase64New,
  panelShow as panelShowNew,
  panelHide as panelHideNew,
  resizeWindow as resizeWindowNew,
} from './tauriClient';

// Re-export des nouvelles fonctions typées
export const getStealthStatus = getStealthStatusNew;
export const toggleStealth = toggleStealthNew;
export const captureScreen = captureScreenNew;
export const getImageAsBase64 = getImageAsBase64New;
export const panelShow = panelShowNew;
export const panelHide = panelHideNew;
export const resizeWindow = resizeWindowNew;
