import { invoke } from '@tauri-apps/api/core';

export const showOverlay = () => invoke('toggle_overlay', { show: true });
export const hideOverlay = () => invoke('toggle_overlay', { show: false });
export const resizeOverlay = (width: number, height: number) =>
  invoke('set_overlay_size', { width, height });
export const moveOverlay = (dx: number, dy: number) =>
  invoke('move_overlay', { dx, dy });
