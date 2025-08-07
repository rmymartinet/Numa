import { useEffect, useRef, useCallback, useState } from 'react';
import { logPerformance } from '../utils/logger';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: number;
  fps: number;
  loadTime: number;
}

interface UseOptimizedPerformanceOptions {
  componentName: string;
  enableMemoryTracking?: boolean;
  enableFPSTracking?: boolean;
  threshold?: number; // Seuil d'alerte en ms
}

export function useOptimizedPerformance(options: UseOptimizedPerformanceOptions) {
  const { componentName, enableMemoryTracking = false, enableFPSTracking = false, threshold = 16 } = options;
  
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());
  const frameCount = useRef(0);
  const lastFPSUpdate = useRef(performance.now());
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    fps: 60,
    loadTime: 0
  });

  // Mesure du temps de rendu
  useEffect(() => {
    const startTime = performance.now();
    renderCount.current += 1;
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      setMetrics(prev => ({ ...prev, renderTime }));
      
      if (renderTime > threshold) {
        logPerformance(`${componentName} - Slow render detected`, renderTime);
      }
      
      lastRenderTime.current = endTime;
    };
  });

  // Tracking FPS
  useEffect(() => {
    if (!enableFPSTracking) return;

    let animationId: number;
    
    const updateFPS = () => {
      frameCount.current++;
      const now = performance.now();
      
      if (now - lastFPSUpdate.current >= 1000) {
        const fps = Math.round((frameCount.current * 1000) / (now - lastFPSUpdate.current));
        setMetrics(prev => ({ ...prev, fps }));
        frameCount.current = 0;
        lastFPSUpdate.current = now;
      }
      
      animationId = requestAnimationFrame(updateFPS);
    };
    
    animationId = requestAnimationFrame(updateFPS);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [enableFPSTracking]);

  // Tracking mémoire (si disponible)
  useEffect(() => {
    if (!enableMemoryTracking || !('memory' in performance)) return;

    const updateMemory = () => {
      const memory = (performance as any).memory;
      if (memory) {
        const memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
        setMetrics(prev => ({ ...prev, memoryUsage }));
      }
    };

    const interval = setInterval(updateMemory, 1000);
    return () => clearInterval(interval);
  }, [enableMemoryTracking]);

  // Mesure d'opérations avec cache
  const measureOperation = useCallback((
    operationName: string, 
    operation: () => void | Promise<void>,
    cacheKey?: string
  ) => {
    const startTime = performance.now();
    
    // Cache pour éviter les mesures répétées
    if (cacheKey) {
      const cached = performanceCache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    const result = operation();
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        if (cacheKey) {
          performanceCache.set(cacheKey, duration);
        }
        
        logPerformance(`${componentName} - ${operationName}`, duration);
      });
    } else {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (cacheKey) {
        performanceCache.set(cacheKey, duration);
      }
      
      logPerformance(`${componentName} - ${operationName}`, duration);
      return result;
    }
  }, [componentName]);

  // Debounce optimisé avec cache
  const debouncedOperation = useCallback((
    operation: () => void,
    delay: number,
    cacheKey?: string
  ) => {
    const timeoutId = setTimeout(() => {
      measureOperation('debounced', operation, cacheKey);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [measureOperation]);

  // Throttle optimisé
  const throttledOperation = useCallback((
    operation: () => void,
    limit: number
  ) => {
    let inThrottle: boolean;
    
    return () => {
      if (!inThrottle) {
        measureOperation('throttled', operation);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }, [measureOperation]);

  return {
    metrics,
    renderCount: renderCount.current,
    measureOperation,
    debouncedOperation,
    throttledOperation,
    isSlow: metrics.renderTime > threshold
  };
}

// Cache global pour les performances
const performanceCache = new Map<string, number>();

// Hook pour optimiser les re-renders
export function useOptimizedRender<T>(
  value: T,
  deps: React.DependencyList,
  equalityFn?: (prev: T, next: T) => boolean
) {
  const prevValue = useRef<T>(value);
  const shouldUpdate = useRef(true);

  if (equalityFn) {
    shouldUpdate.current = !equalityFn(prevValue.current, value);
  } else {
    shouldUpdate.current = prevValue.current !== value;
  }

  if (shouldUpdate.current) {
    prevValue.current = value;
  }

  return shouldUpdate.current ? value : prevValue.current;
}

// Hook pour optimiser les callbacks
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
  options?: { maxAge?: number }
) {
  const { maxAge = 1000 } = options || {};
  const lastCall = useRef(0);
  const lastResult = useRef<any>(null);

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastCall.current < maxAge && lastResult.current !== null) {
      return lastResult.current;
    }
    
    lastCall.current = now;
    lastResult.current = callback(...args);
    return lastResult.current;
  }, [callback, maxAge, ...deps]) as T;
}
