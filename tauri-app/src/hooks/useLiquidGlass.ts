import { useEffect, useRef, useCallback } from 'react';
import {
  startLiquidGlass,
  updateLiquidGlassFrame,
  stopLiquidGlass,
  startLiquidGlassForHUD,
  updateLiquidGlassForHUD,
  LiquidGlassConfig,
} from '../utils/liquidGlass';

interface UseLiquidGlassOptions {
  material?: 'hudWindow' | 'glass' | 'liquid';
  autoUpdate?: boolean;
  enabled?: boolean;
}

export function useLiquidGlass(
  elementRef: React.RefObject<HTMLElement>,
  options: UseLiquidGlassOptions = {}
) {
  const { material = 'hudWindow', autoUpdate = true, enabled = true } = options;

  const isActive = useRef(false);
  const resizeObserver = useRef<ResizeObserver | null>(null);

  const start = useCallback(async () => {
    if (!enabled || !elementRef.current || isActive.current) return;

    try {
      await startLiquidGlassForHUD(elementRef.current, material);
      isActive.current = true;
      console.log('🎨 Liquid Glass started for element');
    } catch (error) {
      console.error('Failed to start Liquid Glass:', error);
    }
  }, [enabled, elementRef, material]);

  const update = useCallback(async () => {
    if (!enabled || !elementRef.current || !isActive.current) return;

    try {
      await updateLiquidGlassForHUD(elementRef.current);
    } catch (error) {
      console.error('Failed to update Liquid Glass:', error);
    }
  }, [enabled, elementRef]);

  const stop = useCallback(async () => {
    if (!isActive.current) return;

    try {
      await stopLiquidGlass();
      isActive.current = false;
      console.log('🎨 Liquid Glass stopped');
    } catch (error) {
      console.error('Failed to stop Liquid Glass:', error);
    }
  }, []);

  // Start Liquid Glass when element is available
  useEffect(() => {
    if (enabled && elementRef.current) {
      start();
    }
  }, [enabled, elementRef, start]);

  // Setup auto-update with ResizeObserver
  useEffect(() => {
    if (!enabled || !autoUpdate || !elementRef.current) return;

    const element = elementRef.current;

    // Create ResizeObserver to watch for size changes
    resizeObserver.current = new ResizeObserver(() => {
      update();
    });

    resizeObserver.current.observe(element);

    // Also watch for position changes with MutationObserver
    const mutationObserver = new MutationObserver(() => {
      update();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    return () => {
      resizeObserver.current?.disconnect();
      mutationObserver.disconnect();
    };
  }, [enabled, autoUpdate, elementRef, update]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
      resizeObserver.current?.disconnect();
    };
  }, [stop]);

  return {
    start,
    update,
    stop,
    isActive: isActive.current,
  };
}

// Hook for manual control
export function useLiquidGlassManual() {
  const start = useCallback(async (config: LiquidGlassConfig) => {
    try {
      await startLiquidGlass(config);
      return true;
    } catch (error) {
      console.error('Failed to start Liquid Glass:', error);
      return false;
    }
  }, []);

  const update = useCallback(
    async (x: number, y: number, width: number, height: number) => {
      try {
        await updateLiquidGlassFrame(x, y, width, height);
        return true;
      } catch (error) {
        console.error('Failed to update Liquid Glass:', error);
        return false;
      }
    },
    []
  );

  const stop = useCallback(async () => {
    try {
      await stopLiquidGlass();
      return true;
    } catch (error) {
      console.error('Failed to stop Liquid Glass:', error);
      return false;
    }
  }, []);

  return {
    start,
    update,
    stop,
  };
}
