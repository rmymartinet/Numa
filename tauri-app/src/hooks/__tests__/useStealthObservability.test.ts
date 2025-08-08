import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStealthObservability } from '../useStealthObservability';

// Mock des modules
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(() => Promise.resolve(false)),
}));

vi.mock('../../utils/errorReporting', () => ({
  errorReporter: {
    disableReplay: vi.fn(),
    initialize: vi.fn(),
  },
}));

vi.mock('../../utils/metrics', () => ({
  metricsTracker: {
    setSamplingRate: vi.fn(),
  },
}));

vi.mock('../../utils/logger', () => ({
  logger: {
    setNetworkOff: vi.fn(),
  },
}));

// Mock de localStorage
const localStorageMock = {
  getItem: vi.fn(() => 'false'),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

describe('useStealthObservability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Configurer les mocks globaux
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  it('should initialize without throwing errors', () => {
    expect(() => {
      renderHook(() => useStealthObservability());
    }).not.toThrow();
  });

  it('should be a valid React hook', () => {
    const { result } = renderHook(() => useStealthObservability());
    
    // Vérifier que le hook retourne un objet avec stealthActive
    expect(result.current).toHaveProperty('stealthActive');
    expect(typeof result.current.stealthActive).toBe('boolean');
  });

  it('should set up event listeners', () => {
    const { listen } = require('@tauri-apps/api/event');
    
    renderHook(() => useStealthObservability());
    
    // Vérifier que listen a été appelé pour les événements stealth
    expect(listen).toHaveBeenCalledWith('stealth-activated', expect.any(Function));
    expect(listen).toHaveBeenCalledWith('stealth-deactivated', expect.any(Function));
  });
});
