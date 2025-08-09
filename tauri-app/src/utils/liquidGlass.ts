import { invoke } from '@tauri-apps/api/core';

export interface LiquidGlassConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  material?: 'hudWindow' | 'glass' | 'liquid';
}

/**
 * Start Liquid Glass effect on the current window
 */
export async function startLiquidGlass(
  config: LiquidGlassConfig
): Promise<void> {
  try {
    await invoke('plugin:liquid_glass|start_liquid_glass', { config });
    console.log('✅ Liquid Glass started:', config);
  } catch (error) {
    console.error('❌ Failed to start Liquid Glass:', error);
    throw error;
  }
}

/**
 * Update Liquid Glass frame position and size
 */
export async function updateLiquidGlassFrame(
  x: number,
  y: number,
  width: number,
  height: number
): Promise<void> {
  try {
    await invoke('plugin:liquid_glass|update_liquid_glass_frame', {
      x,
      y,
      width,
      height,
    });
  } catch (error) {
    console.error('❌ Failed to update Liquid Glass frame:', error);
    throw error;
  }
}

/**
 * Stop Liquid Glass effect
 */
export async function stopLiquidGlass(): Promise<void> {
  try {
    await invoke('plugin:liquid_glass|stop_liquid_glass');
    console.log('✅ Liquid Glass stopped');
  } catch (error) {
    console.error('❌ Failed to stop Liquid Glass:', error);
    throw error;
  }
}

/**
 * Helper to start Liquid Glass for HUD bar
 */
export async function startLiquidGlassForHUD(
  element: HTMLElement,
  material: 'hudWindow' | 'glass' | 'liquid' = 'hudWindow'
): Promise<void> {
  const rect = element.getBoundingClientRect();

  await startLiquidGlass({
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height,
    material,
  });
}

/**
 * Helper to update Liquid Glass frame for HUD bar
 */
export async function updateLiquidGlassForHUD(
  element: HTMLElement
): Promise<void> {
  const rect = element.getBoundingClientRect();

  await updateLiquidGlassFrame(rect.left, rect.top, rect.width, rect.height);
}
