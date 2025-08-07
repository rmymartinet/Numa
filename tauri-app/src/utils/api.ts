import { logger } from './logger';

// Configuration pour les retries
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

// Types d'erreurs réseau
export enum NetworkErrorType {
  TIMEOUT = 'timeout',
  RATE_LIMIT = 'rate_limit',
  SERVER_ERROR = 'server_error',
  NETWORK_ERROR = 'network_error',
  UNKNOWN = 'unknown',
}

export interface NetworkError {
  type: NetworkErrorType;
  message: string;
  status?: number;
  retryAfter?: number;
}

// Fonction utilitaire pour calculer le délai de retry
function calculateRetryDelay(attempt: number, config: RetryConfig): number {
  const delay =
    config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  return Math.min(delay, config.maxDelay);
}

// Fonction pour analyser les erreurs réseau
function analyzeNetworkError(error: any): NetworkError {
  if (error.name === 'AbortError' || error.message.includes('timeout')) {
    return {
      type: NetworkErrorType.TIMEOUT,
      message: "Délai d'attente dépassé",
    };
  }

  if (error.status === 429) {
    return {
      type: NetworkErrorType.RATE_LIMIT,
      message: 'Limite de taux dépassée',
      status: 429,
      retryAfter: parseInt(error.headers?.get('retry-after') || '60'),
    };
  }

  if (error.status >= 500) {
    return {
      type: NetworkErrorType.SERVER_ERROR,
      message: 'Erreur serveur',
      status: error.status,
    };
  }

  if (error.status >= 400) {
    return {
      type: NetworkErrorType.NETWORK_ERROR,
      message: 'Erreur de requête',
      status: error.status,
    };
  }

  return {
    type: NetworkErrorType.UNKNOWN,
    message: error.message || 'Erreur inconnue',
  };
}

// Fonction pour attendre un délai
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fonction principale avec retry
export async function fetchWithRetry<T>(
  url: string,
  options: RequestInit,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: NetworkError;

  for (let attempt = 1; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      logger.info(`Tentative ${attempt}/${retryConfig.maxRetries}`, { url });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = new Error(
          `HTTP ${response.status}: ${response.statusText}`
        );
        (error as any).status = response.status;
        (error as any).headers = response.headers;
        throw error;
      }

      const data = await response.json();
      logger.info(`Requête réussie après ${attempt} tentative(s)`, { url });
      return data;
    } catch (error: any) {
      lastError = analyzeNetworkError(error);

      logger.warn(`Tentative ${attempt} échouée`, {
        url,
        error: lastError,
        attempt,
      });

      // Ne pas retry pour certaines erreurs
      if (
        lastError.type === NetworkErrorType.NETWORK_ERROR &&
        lastError.status === 400
      ) {
        throw lastError;
      }

      // Dernière tentative
      if (attempt === retryConfig.maxRetries) {
        logger.error('Toutes les tentatives ont échoué', {
          url,
          totalAttempts: retryConfig.maxRetries,
          lastError,
        });
        throw lastError;
      }

      // Calculer le délai de retry
      let delay = calculateRetryDelay(attempt, retryConfig);

      // Utiliser retry-after si disponible
      if (
        lastError.type === NetworkErrorType.RATE_LIMIT &&
        lastError.retryAfter
      ) {
        delay = lastError.retryAfter * 1000;
      }

      logger.info(`Attente avant retry`, { delay, attempt });
      await sleep(delay);
    }
  }

  throw lastError!;
}

// Hook React pour les requêtes avec retry
export function useApiWithRetry() {
  const makeRequest = async <T>(
    url: string,
    options: RequestInit,
    config?: Partial<RetryConfig>
  ): Promise<T> => {
    return fetchWithRetry<T>(url, options, config);
  };

  return { makeRequest };
}
