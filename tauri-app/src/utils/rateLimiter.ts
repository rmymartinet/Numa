import { useState, useEffect, useCallback } from 'react';

// Rate Limiter côté client pour Numa

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (identifier: string) => string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  isAllowed(identifier: string): boolean {
    const key = this.config.keyGenerator ? this.config.keyGenerator(identifier) : identifier;
    const now = Date.now();
    const entry = this.store.get(key);

    // Nettoyer les entrées expirées
    if (entry && now > entry.resetTime) {
      this.store.delete(key);
    }

    // Créer une nouvelle entrée si elle n'existe pas
    if (!this.store.has(key)) {
      this.store.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      return true;
    }

    const currentEntry = this.store.get(key)!;

    // Vérifier si la limite est dépassée
    if (currentEntry.count >= this.config.maxRequests) {
      return false;
    }

    // Incrémenter le compteur
    currentEntry.count++;
    return true;
  }

  getRemaining(identifier: string): number {
    const key = this.config.keyGenerator ? this.config.keyGenerator(identifier) : identifier;
    const entry = this.store.get(key);
    
    if (!entry) {
      return this.config.maxRequests;
    }

    return Math.max(0, this.config.maxRequests - entry.count);
  }

  getResetTime(identifier: string): number {
    const key = this.config.keyGenerator ? this.config.keyGenerator(identifier) : identifier;
    const entry = this.store.get(key);
    
    return entry ? entry.resetTime : Date.now();
  }

  reset(identifier: string): void {
    const key = this.config.keyGenerator ? this.config.keyGenerator(identifier) : identifier;
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

// Instances de rate limiter prédéfinies
export const rateLimiters = {
  // Limite les appels API généraux
  api: new RateLimiter({
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  }),

  // Limite les captures d'écran
  screenshot: new RateLimiter({
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  }),

  // Limite les analyses OCR
  ocr: new RateLimiter({
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
  }),

  // Limite les actions utilisateur
  userAction: new RateLimiter({
    maxRequests: 50,
    windowMs: 10 * 1000, // 10 secondes
  }),
};

// Hook React pour le rate limiting
export function useRateLimit(limiter: RateLimiter, identifier: string) {
  const [isAllowed, setIsAllowed] = useState(() => limiter.isAllowed(identifier));
  const [remaining, setRemaining] = useState(() => limiter.getRemaining(identifier));
  const [resetTime, setResetTime] = useState(() => limiter.getResetTime(identifier));

  const checkLimit = useCallback(() => {
    const allowed = limiter.isAllowed(identifier);
    setIsAllowed(allowed);
    setRemaining(limiter.getRemaining(identifier));
    setResetTime(limiter.getResetTime(identifier));
    return allowed;
  }, [limiter, identifier]);

  const reset = useCallback(() => {
    limiter.reset(identifier);
    setIsAllowed(true);
    setRemaining(limiter.getRemaining(identifier));
    setResetTime(limiter.getResetTime(identifier));
  }, [limiter, identifier]);

  // Mettre à jour les valeurs périodiquement
  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(limiter.getRemaining(identifier));
      setResetTime(limiter.getResetTime(identifier));
    }, 1000);

    return () => clearInterval(interval);
  }, [limiter, identifier]);

  return {
    isAllowed,
    remaining,
    resetTime,
    checkLimit,
    reset,
  };
}

// Wrapper pour les fonctions avec rate limiting
export function withRateLimit<T extends (...args: any[]) => any>(
  fn: T,
  limiter: RateLimiter,
  identifier: string
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    if (!limiter.isAllowed(identifier)) {
      throw new Error(`Rate limit exceeded for ${identifier}. Try again later.`);
    }
    return fn(...args);
  }) as T;
}

// Décorateur pour les méthodes de classe
export function rateLimited(limiter: RateLimiter, identifier: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      if (!limiter.isAllowed(identifier)) {
        throw new Error(`Rate limit exceeded for ${identifier}. Try again later.`);
      }
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

// Utilitaires pour la gestion des erreurs de rate limiting
export const rateLimitUtils = {
  // Attendre jusqu'à la prochaine fenêtre
  waitForReset: (limiter: RateLimiter, identifier: string): Promise<void> => {
    return new Promise((resolve) => {
      const resetTime = limiter.getResetTime(identifier);
      const now = Date.now();
      const waitTime = Math.max(0, resetTime - now);
      
      setTimeout(resolve, waitTime);
    });
  },

  // Retry avec backoff exponentiel
  retryWithBackoff: async <T>(
    fn: () => Promise<T>,
    limiter: RateLimiter,
    identifier: string,
    maxRetries: number = 3
  ): Promise<T> => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (limiter.isAllowed(identifier)) {
          return await fn();
        }
      } catch (error) {
        if (attempt === maxRetries) throw error;
      }

      // Attendre avec backoff exponentiel
      const waitTime = Math.min(1000 * Math.pow(2, attempt), 10000);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    throw new Error(`Rate limit exceeded after ${maxRetries} retries`);
  },
};
