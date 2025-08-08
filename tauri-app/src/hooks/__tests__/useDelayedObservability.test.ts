import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDelayedObservability } from '../useDelayedObservability';

// Mock simple de tous les modules
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
}));

vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('../../utils/errorReporting', () => ({
  errorReporter: {
    initialize: vi.fn(),
  },
}));

vi.mock('../../utils/metrics', () => ({
  metricsTracker: {
    setSamplingRate: vi.fn(),
  },
}));

// Mock de localStorage
const localStorageMock = {
  getItem: vi.fn(() => 'false'),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock de requestIdleCallback
const requestIdleCallbackMock = vi.fn((callback) => {
  setTimeout(callback, 0);
  return 1;
});

describe('useDelayedObservability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Configurer les mocks globaux
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    
    Object.defineProperty(window, 'requestIdleCallback', {
      value: requestIdleCallbackMock,
      writable: true,
    });
  });

  it('should initialize without throwing errors', () => {
    expect(() => {
      renderHook(() => useDelayedObservability());
    }).not.toThrow();
  });

  it('should be a valid React hook', () => {
    const { result } = renderHook(() => useDelayedObservability());
    
    // Vérifier que le hook retourne undefined (pas d'erreur)
    expect(result.current).toBeUndefined();
  });
});
