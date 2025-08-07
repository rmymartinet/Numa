import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useOptimizedPerformance, useOptimizedRender, useOptimizedCallback } from '../useOptimizedPerformance';

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => 1000),
  memory: {
    usedJSHeapSize: 50 * 1024 * 1024 // 50MB
  }
};

Object.defineProperty(window, 'performance', {
  value: mockPerformance,
  writable: true
});

// Mock requestAnimationFrame
const mockRequestAnimationFrame = vi.fn((callback) => {
  setTimeout(callback, 16); // 60fps
  return 1;
});

const mockCancelAnimationFrame = vi.fn();

Object.defineProperty(window, 'requestAnimationFrame', {
  value: mockRequestAnimationFrame,
  writable: true
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  value: mockCancelAnimationFrame,
  writable: true
});

describe('useOptimizedPerformance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPerformance.now.mockReturnValue(1000);
  });

  it('should initialize with default metrics', () => {
    const { result } = renderHook(() => 
      useOptimizedPerformance({ componentName: 'TestComponent' })
    );

    expect(result.current.metrics).toEqual({
      renderTime: 0,
      fps: 60,
      loadTime: 0
    });
    expect(result.current.renderCount).toBe(0);
    expect(result.current.isSlow).toBe(false);
  });

  it('should measure operation performance', async () => {
    const { result } = renderHook(() => 
      useOptimizedPerformance({ componentName: 'TestComponent' })
    );

    const mockOperation = vi.fn(() => {
      // Simulate some work
      return Promise.resolve();
    });

    await act(async () => {
      await result.current.measureOperation('test-operation', mockOperation);
    });

    expect(mockOperation).toHaveBeenCalled();
  });

  it('should detect slow renders', () => {
    const { result } = renderHook(() => 
      useOptimizedPerformance({ 
        componentName: 'TestComponent',
        threshold: 10 // 10ms threshold
      })
    );

    // Simulate slow render
    act(() => {
      mockPerformance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1020); // 20ms render
    });

    expect(result.current.isSlow).toBe(true);
  });

  it('should track FPS when enabled', () => {
    const { result } = renderHook(() => 
      useOptimizedPerformance({ 
        componentName: 'TestComponent',
        enableFPSTracking: true
      })
    );

    expect(mockRequestAnimationFrame).toHaveBeenCalled();
  });

  it('should track memory when enabled', () => {
    const { result } = renderHook(() => 
      useOptimizedPerformance({ 
        componentName: 'TestComponent',
        enableMemoryTracking: true
      })
    );

    // Memory tracking should be active
    expect(result.current.metrics.memoryUsage).toBeDefined();
  });

  it('should provide debounced operation', () => {
    const { result } = renderHook(() => 
      useOptimizedPerformance({ componentName: 'TestComponent' })
    );

    const mockOperation = vi.fn();
    const debounced = result.current.debouncedOperation(mockOperation, 100);

    expect(typeof debounced).toBe('function');
  });

  it('should provide throttled operation', () => {
    const { result } = renderHook(() => 
      useOptimizedPerformance({ componentName: 'TestComponent' })
    );

    const mockOperation = vi.fn();
    const throttled = result.current.throttledOperation(mockOperation, 100);

    expect(typeof throttled).toBe('function');
  });
});

describe('useOptimizedRender', () => {
  it('should return new value when dependencies change', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useOptimizedRender(value, [value]),
      { initialProps: { value: 'initial' } }
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'updated' });
    expect(result.current).toBe('updated');
  });

  it('should use custom equality function', () => {
    const equalityFn = vi.fn((prev, next) => prev.id === next.id);
    
    const { result, rerender } = renderHook(
      ({ value }) => useOptimizedRender(value, [value], equalityFn),
      { initialProps: { value: { id: 1, data: 'initial' } } }
    );

    expect(result.current).toEqual({ id: 1, data: 'initial' });

    rerender({ value: { id: 1, data: 'updated' } });
    expect(result.current).toEqual({ id: 1, data: 'initial' }); // Should not update due to equality function
  });
});

describe('useOptimizedCallback', () => {
  it('should cache results based on maxAge', () => {
    const mockCallback = vi.fn((x: number) => x * 2);
    
    const { result } = renderHook(() => 
      useOptimizedCallback(mockCallback, [], { maxAge: 1000 })
    );

    // First call
    act(() => {
      const result1 = result.current(5);
      expect(result1).toBe(10);
    });

    // Second call within maxAge
    act(() => {
      const result2 = result.current(5);
      expect(result2).toBe(10); // Should return cached result
    });

    expect(mockCallback).toHaveBeenCalledTimes(1); // Should only be called once
  });

  it('should call callback again after maxAge expires', async () => {
    const mockCallback = vi.fn((x: number) => x * 2);
    
    const { result } = renderHook(() => 
      useOptimizedCallback(mockCallback, [], { maxAge: 100 })
    );

    // First call
    act(() => {
      result.current(5);
    });

    // Wait for maxAge to expire
    await new Promise(resolve => setTimeout(resolve, 150));

    // Second call after maxAge
    act(() => {
      result.current(5);
    });

    expect(mockCallback).toHaveBeenCalledTimes(2); // Should be called twice
  });
});
